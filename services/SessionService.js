const { Sequelize, Op } = require("sequelize");
const cron = require("node-cron");
const { Session, SessionParticipant, Class, Topic, sequelize } = require("../models");
const { removeMinIOAudio } = require("./StudentAnswerService");

async function getAllSessions(req) {
  try {
    const sessions = await Session.findAll({
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
      data: sessions,
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

    const session = await Session.findByPk(sessionId);
    if (!session) {
      return {
        status: 404,
        message: "Session not found or no changes made",
      };
    }

    const now = new Date();
    const isOngoingByTime =
      session.isPublished &&
      session.startTime &&
      session.endTime &&
      now >= session.startTime &&
      now <= session.endTime;

    if (session.status === "ON_GOING" || isOngoingByTime) {
      return {
        status: 403,
        message: "Cannot edit a session that is currently ON_GOING",
      };
    }

    // Validate examSet if provided (even if null/empty)
    if (typeof examSet !== "undefined") {
      // Reject null or empty values explicitly since Session.examSet is allowNull: false
      if (examSet === null || examSet === "") {
        return {
          status: 400,
          message: "Invalid exam set value",
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

    // Validate ClassID if provided
    if (ClassID) {
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
    const resolvedClassID = ClassID || session.ClassID;
    const resolvedSessionName = sessionName || session.sessionName;
    if (resolvedClassID !== session.ClassID || resolvedSessionName !== session.sessionName) {
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
    const resolvedStartTime = startTime ? new Date(startTime) : session.startTime;
    const resolvedEndTime = endTime ? new Date(endTime) : session.endTime;

    // Ensure provided time values are valid dates
    if (startTime && isNaN(resolvedStartTime.getTime())) {
      return {
        status: 400,
        message: "Invalid start time",
      };
    }
    if (endTime && isNaN(resolvedEndTime.getTime())) {
      return {
        status: 400,
        message: "Invalid end time",
      };
    }

    if (resolvedStartTime >= resolvedEndTime) {
      return {
        status: 400,
        message: "Start time must be before end time",
      };
    }

    const now = new Date();
    // Determine the effective isPublished value for this update
    const resolvedIsPublished =
      typeof isPublished === "boolean" ? isPublished : session.isPublished;

    let newStatus;
    if (resolvedStartTime > now) {
      newStatus = "NOT_STARTED";
    } else if (resolvedEndTime > now) {
      newStatus = "ON_GOING";
    } else {
      newStatus = "COMPLETE";
    }

    // Enforce invariant: published sessions must be COMPLETE
    if (resolvedIsPublished) {
      newStatus = "COMPLETE";
    }

    const updateFields = {
      ...(sessionName !== undefined && { sessionName }),
      ...(sessionKey !== undefined && { sessionKey }),
      ...(startTime !== undefined && { startTime: resolvedStartTime }),
      ...(endTime !== undefined && { endTime: resolvedEndTime }),
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
