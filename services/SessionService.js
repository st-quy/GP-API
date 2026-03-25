const { Sequelize, Op } = require("sequelize");
const cron = require("node-cron");
const { Session, SessionParticipant, Class, Topic, sequelize } = require("../models");
const { removeMinIOAudio } = require("./StudentAnswerService");

async function getAllSessions(req) {
  try {
    const {
      search,
      status,
      classId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const whereClause = {};

    if (search) {
      whereClause.sessionName = { [Op.iLike]: `%${search}%` };
    }

    if (status) {
      whereClause.status = status;
    }

    if (classId) {
      whereClause.ClassID = classId;
    }

    if (startDate && endDate) {
      whereClause.startTime = { [Op.gte]: new Date(startDate) };
      whereClause.endTime = { [Op.lte]: new Date(endDate) };
    } else if (startDate) {
      whereClause.startTime = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereClause.endTime = { [Op.lte]: new Date(endDate) };
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await Session.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Class,
          as: "Classes",
        },
        {
          model: Topic,
          as: "Topic",
        },
      ],
      limit: Number(limit),
      offset: Number(offset),
      order: [["createdAt", "DESC"]],
    });

    return {
      status: 200,
      data: rows,
      total: count,
      currentPage: Number(page),
      totalPages: Math.ceil(count / limit),
    };
  } catch (error) {
    throw new Error(`Error fetching all sessions: ${error.message}`);
  }
}

async function getSessionByClass(req) {
  try {
    const { classId, sessionName, status, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      ClassID: classId,
    };

    if (sessionName) {
      whereClause.sessionName = sessionName;
    }

    if (status) {
      whereClause.status = status;
    }

    const classes = await Session.findAndCountAll({
      where: whereClause,
      limit,
      offset,
    });
    return {
      status: 200,
      data: classes.rows,
      total: classes.count,
      currentPage: page,
      totalPages: Math.ceil(classes.count / limit),
    };
  } catch (error) {
    throw new Error(
      `Error fetching classes by sessionName and status with pagination: ${error.message}`
    );
  }
}

async function createSession(req) {
  try {
    const {
      sessionName,
      sessionKey,
      startTime,
      endTime,
      examSet,
      ClassID,
      duration,
      instructions,
    } = req.body;
    if (
      !sessionName ||
      !sessionKey ||
      !startTime ||
      !endTime ||
      !examSet ||
      !ClassID
    ) {
      return {
        status: 400,
        message:
          "sessionName, sessionKey, startTime, endTime, examSet, and ClassID are required",
      };
    }

    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);

    if (
      Number.isNaN(parsedStartTime.getTime()) ||
      Number.isNaN(parsedEndTime.getTime())
    ) {
      return {
        status: 400,
        message: "startTime and endTime must be valid dates",
      };
    }

    if (parsedStartTime >= parsedEndTime) {
      return {
        status: 400,
        message: "Start time must be before end time",
      };
    }

    let normalizedDuration = null;
    if (duration !== undefined && duration !== null && duration !== "") {
      const parsedDuration = Number(duration);

      if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
        return {
          status: 400,
          message: "duration must be a positive integer",
        };
      }

      normalizedDuration = parsedDuration;
    }

    let normalizedInstructions = null;
    if (instructions !== undefined && instructions !== null) {
      if (typeof instructions !== "string") {
        return {
          status: 400,
          message: "instructions must be a string",
        };
      }

      const trimmedInstructions = instructions.trim();
      if (!trimmedInstructions) {
        return {
          status: 400,
          message: "instructions cannot be empty",
        };
      }

      normalizedInstructions = trimmedInstructions;
    }

    const checkExistTopic = await Topic.findByPk(examSet);

    if (!checkExistTopic) {
      return {
        status: 400,
        message: "Topic not found",
      };
    }

    const checkExistClass = await Class.findByPk(ClassID);
    if (!checkExistClass) {
      return {
        status: 400,
        message: "Class not found",
      };
    }

    const checkExistSessionKey = await Session.findOne({
      where: {
        sessionKey,
      },
    });
    if (checkExistSessionKey) {
      return {
        status: 400,
        message: `Session with key ${sessionKey} already exists`,
      };
    }

    const checkExistSessionName = await Session.findOne({
      where: {
        sessionName,
        ClassID,
      },
    });

    if (checkExistSessionName) {
      return {
        status: 400,
        message: `Session with name ${sessionName} already exists in this class`,
      };
    }

    let status;
    const now = new Date();
    if (parsedStartTime > now) {
      status = "NOT_STARTED";
    } else if (parsedEndTime > now) {
      status = "ON_GOING";
    } else {
      status = "COMPLETE";
    }

    const newSession = await Session.create({
      sessionName,
      sessionKey,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      duration: normalizedDuration,
      instructions: normalizedInstructions,
      examSet,
      ClassID,
      status,
    });
    return {
      status: 201,
      data: newSession,
    };
  } catch (error) {
    throw new Error(`Error creating session: ${error.message}`);
  }
}

async function updateSession(req) {
  try {
    const { sessionId } = req.params;
    const {
      sessionName,
      sessionKey,
      startTime,
      endTime,
      examSet,
      ClassID,
      isPublished,
      minioAudioRemoved
    } = req.body;

    // Prevent clients from mutating system-managed fields
    if (typeof isPublished !== "undefined" || typeof minioAudioRemoved !== "undefined") {
      return {
        status: 400,
        message:
          "The fields 'isPublished' and 'minioAudioRemoved' are system-managed and cannot be updated via this endpoint",
      };
    }

    const session = await Session.findByPk(sessionId);
    if (!session) {
      return {
        status: 404,
        message: "Session not found or no changes made",
      };
    }

    // Derive whether the session is currently ON_GOING from time and isPublished,
    // instead of relying solely on the persisted session.status, which may be stale.
    const now = new Date();
    const effectiveStartTime = startTime ? new Date(startTime) : session.startTime;
    const effectiveEndTime = endTime ? new Date(endTime) : session.endTime;
    const effectiveIsPublished =
      typeof isPublished === "boolean" ? isPublished : session.isPublished;

    const isOngoingByTime =
      effectiveIsPublished &&
      effectiveStartTime &&
      effectiveEndTime &&
      now >= effectiveStartTime &&
      now <= effectiveEndTime;

    if (isOngoingByTime) {
      return {
        status: 403,
        message: "Cannot edit a session that is currently ON_GOING",
      };
    }

    // Validate examSet if provided (treat undefined as "not provided")
    if (examSet !== undefined) {
      // Explicitly reject null or empty values for non-nullable column
      if (examSet === null || examSet === "") {
        return {
          status: 400,
          message: "examSet cannot be null or empty",
        };
      }

      const checkExistTopic = await Topic.findByPk(examSet);
      if (!checkExistTopic) {
        return {
          status: 400,
          message: "Topic (exam set) not found",
        };
      }
    }

    // Validate ClassID if provided (treat undefined as "not provided")
    if (ClassID !== undefined) {
      // Explicitly reject null or empty values for non-nullable column
      if (ClassID === null || ClassID === "") {
        return {
          status: 400,
          message: "ClassID cannot be null or empty",
        };
      }

      const checkExistClass = await Class.findByPk(ClassID);
      if (!checkExistClass) {
        return {
          status: 400,
          message: "Class not found",
        };
      }
    }

    // Check unique sessionKey (excluding current session)
    if (sessionKey && sessionKey !== session.sessionKey) {
      const duplicate = await Session.findOne({
        where: { sessionKey, ID: { [Op.ne]: sessionId } },
      });
      if (duplicate) {
        return {
          status: 400,
          message: `Session with key ${sessionKey} already exists`,
        };
      }
    }

    // Check unique sessionName within the same class (excluding current session)
    const resolvedClassID =
      ClassID !== undefined ? ClassID : session.ClassID;
    const resolvedSessionName = sessionName || session.sessionName;
    const sessionNameChanged = sessionName && sessionName !== session.sessionName;
    const classIdChanged = ClassID && ClassID !== session.ClassID;
    if (sessionNameChanged || classIdChanged) {
      const duplicate = await Session.findOne({
        where: {
          sessionName: resolvedSessionName,
          ClassID: resolvedClassID,
          ID: { [Op.ne]: sessionId },
        },
      });
      if (duplicate) {
        return {
          status: 400,
          message: `Session with name ${resolvedSessionName} already exists in this class`,
        };
      }
    }

    // Validate and recalculate status when time fields change
    let resolvedStartTime = session.startTime;
    let resolvedEndTime = session.endTime;

    if (startTime !== undefined) {
      const parsedStart = new Date(startTime);
      if (Number.isNaN(parsedStart.getTime())) {
        return {
          status: 400,
          message: "Invalid start time",
        };
      }
      resolvedStartTime = parsedStart;
    }

    if (endTime !== undefined) {
      const parsedEnd = new Date(endTime);
      if (Number.isNaN(parsedEnd.getTime())) {
        return {
          status: 400,
          message: "Invalid end time",
        };
      }
      resolvedEndTime = parsedEnd;
    }

    if (resolvedStartTime >= resolvedEndTime) {
      return {
        status: 400,
        message: "Start time must be before end time",
      };
    }

    const now = new Date();
    const resolvedIsPublished =
      isPublished !== undefined ? isPublished : session.isPublished;
    let newStatus;
    if (resolvedStartTime > now) {
      newStatus = "NOT_STARTED";
    } else if (resolvedEndTime > now) {
      newStatus = "ON_GOING";
    } else {
      newStatus = "COMPLETE";
    }

    if (resolvedIsPublished === true) {
      newStatus = "COMPLETE";
    }

    const updateFields = {
      ...(sessionName !== undefined && { sessionName }),
      ...(sessionKey !== undefined && { sessionKey }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(examSet !== undefined && { examSet }),
      ...(ClassID !== undefined && { ClassID }),
      ...(isPublished !== undefined && { isPublished }),
      ...(minioAudioRemoved !== undefined && { minioAudioRemoved }),
      status: newStatus,
    };

    await session.update(updateFields);

    return {
      status: 200,
      data: updatedSession,
    };
  } catch (error) {
    throw new Error(`Error updating session: ${error.message}`);
  }
}

async function getSessionDetailById(req) {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      where: { ID: sessionId },
      include: [
        {
          model: SessionParticipant,
          as: "SessionParticipants",
        },
        {
          model: Class,
          as: "Classes",
        },
        {
          model: Topic,
          as: "Topic",
        },
      ],
    });

    if (!session) {
      return {
        status: 404,
        message: "Session not found",
      };
    }

    return {
      status: 200,
      data: session,
    };
  } catch (error) {
    throw new Error(`Error fetching session detail: ${error.message}`);
  }
}

async function removeSession(req) {
  try {
    const { sessionId } = req.params;
    const deletedCount = await Session.destroy({
      where: { ID: sessionId },
    });

    if (deletedCount === 0) {
      return {
        status: 404,
        message: "Session not found",
      };
    }

    return {
      status: 200,
      message: "Session deleted successfully",
    };
  } catch (error) {
    throw new Error(`Error deleting session: ${error.message}`);
  }
}

async function cronStatusAllSessions() {
  try {
    const now = new Date();
    const sessions = await Session.findAll();

    for (const session of sessions) {
      let newStatus;

      const startTime = new Date(session.startTime);
      const endTime = new Date(session.endTime);

      newStatus =
        startTime > now
          ? "NOT_STARTED"
          : endTime > now
          ? "ON_GOING"
          : "COMPLETE";

      if (session.isPublished) {
        newStatus = "COMPLETE";
      }

      if (session.status !== newStatus) {
        await Session.update(
          { status: newStatus },
          { where: { ID: session.ID } }
        );
      }
    }

    const updatedSessions = await Session.findAll({
      include: [
        {
          model: Class,
          as: "Classes",
        },
        {
          model: Topic,
          as: "Topic",
        },
      ],
    });

    return {
      status: 200,
      data: updatedSessions,
    };
  } catch (error) {
    throw new Error(`Error updating session statuses: ${error.message}`);
  }
}

async function checkAndRemoveOldAudios() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  try {
    const sessions = await Session.findAll({
      where: {
        minioAudioRemoved: false,
        isPublished: true,
        status: "COMPLETE",
        updatedAt: {
          [Op.lte]: sevenDaysAgo,
        },
      },
    });

    if (sessions.length === 0) {
      console.warn("No sessions to process.");
      return;
    }

    for (const session of sessions) {
      await removeMinIOAudio(session.ID);
    }
  } catch (error) {
    throw new Error(`Error removing old audios, ${error}`);
  }
}

cron.schedule("0 0 * * *", async () => {
  await checkAndRemoveOldAudios();
});

cron.schedule("*/2 * * * *", async () => {
  await cronStatusAllSessions();
});

module.exports = {
  getAllSessions,
  getSessionByClass,
  createSession,
  updateSession,
  getSessionDetailById,
  removeSession,
  cronStatusAllSessions,
  checkAndRemoveOldAudios,
};
