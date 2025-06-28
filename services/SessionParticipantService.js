const { SessionParticipant, Session, User } = require("../models");
const { CEFR_LEVELS } = require("../constants/levels");
const sequelizePaginate = require("sequelize-paginate");
const { generateStudentReportAndSendMail } = require("./ScoreMailService");
const { Op, Sequelize } = require("sequelize");

async function addParticipant(sessionId, userId) {
  try {
    const participant = await SessionParticipant.create({
      SessionID: sessionId,
      UserID: userId,
    });
    return {
      status: 201,
      message: "Participant added successfully",
      data: participant,
    };
  } catch (error) {
    console.error("Error adding participant:", error);
    throw error;
  }
}

/**
 *
 * @param {import('express').Request} req
 * @returns
 */
async function getAllParticipants(req) {
  try {
    sequelizePaginate.paginate(SessionParticipant);
    const { sessionId } = req.params;
    const { searchKeyword } = req.query;

    const where = { SessionID: sessionId };
    const include = [
      {
        model: User,
        as: "User",
        where: searchKeyword
          ? {
              [Op.or]: [
                {
                  firstName: { [Op.like]: `%${searchKeyword.toLowerCase()}%` },
                },
                { lastName: { [Op.like]: `%${searchKeyword.toLowerCase()}%` } },
                Sequelize.where(
                  Sequelize.fn(
                    "LOWER",
                    Sequelize.fn(
                      "CONCAT",
                      Sequelize.col("User.firstName"),
                      " ",
                      Sequelize.col("User.lastName")
                    )
                  ),
                  { [Op.like]: `%${searchKeyword.toLowerCase()}%` }
                ),
              ],
            }
          : undefined,
      },
    ];

    // Get total count first
    const totalCount = await SessionParticipant.count({
      where,
      include,
      distinct: true,
    });

    const options = {
      page: req.query.page || 1,
      paginate: req.query.limit || 10,
      where,
      include,
    };

    const result = await SessionParticipant.paginate(options);

    return {
      status: 200,
      message: "Participants retrieved successfully",
      data: result.docs,
      pagination: {
        currentPage: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.limit) || 10,
        itemsOnPage: result.docs.length,
        totalPages: result.pages,
        totalItems: totalCount,
      },
    };
  } catch (error) {
    console.error("Error getting participants:", error.message);
    throw error;
  }
}

async function getAllParticipantsGroupedByUser(req) {
  try {
    const participants = await SessionParticipant.findAll({
      include: [
        {
          model: User,
          as: "User",
          attributes: { exclude: ["password"] },
        },
      ],
    });

    const groupedParticipants = participants.reduce((acc, participant) => {
      const userId = participant.UserID;
      if (!acc[userId]) {
        acc[userId] = [];
      }
      acc[userId].push(participant);
      return acc;
    }, {});

    return {
      status: 200,
      message: "Participants grouped by user retrieved successfully",
      data: groupedParticipants,
    };
  } catch (error) {
    console.error("Error getting participants grouped by user:", error.message);
    throw error;
  }
}

const getParticipantsByUserId = async (userId, req) => {
  const { searchKeyword } = req.query;
  const whereClause = { UserID: userId, IsPublished: true };
  const includeClause = [
    {
      model: Session,
      as: "Session",
      where: searchKeyword
        ? {
            [Op.or]: [{ sessionName: { [Op.like]: `%${searchKeyword}%` } }],
          }
        : undefined,
    },
    {
      model: User,
      as: "User",
      attributes: { exclude: ["password"] },
    },
  ];

  const participants = await SessionParticipant.findAll({
    where: whereClause,
    include: includeClause,
  });

  if (!participants.length) {
    return { status: 404, message: "No participants found for the given user" };
  }

  return {
    status: 200,
    message: "Participants retrieved successfully",
    data: participants,
  };
};

const publishScoresBySessionId = async (req) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    throw new Error("sessionId is required");
  }

  // First check for incomplete participants
  const incompleteParticipants = await SessionParticipant.findAll({
    where: {
      SessionID: sessionId,
      [Op.or]: [
        { WritingLevel: null },
        { SpeakingLevel: null },
        { Level: null },
      ],
    },
  });

  if (incompleteParticipants.length > 0) {
    return {
      status: 400,
      message:
        "Some participants are missing required levels (Writing Level, Speaking Level, or Overall Level).",
    };
  }

  const completeStudents = await SessionParticipant.findAll({
    where: {
      SessionID: sessionId,
      IsPublished: false,
      GrammarVocab: { [Op.not]: null },
      Reading: { [Op.not]: null },
      ReadingLevel: { [Op.not]: null },
      Listening: { [Op.not]: null },
      ListeningLevel: { [Op.not]: null },
      Writing: { [Op.not]: null },
      WritingLevel: { [Op.not]: null },
      Speaking: { [Op.not]: null },
      SpeakingLevel: { [Op.not]: null },
      Total: { [Op.not]: null },
      Level: { [Op.not]: null },
    },
    attributes: ["UserID"],
  });

  if (!completeStudents.length) {
    return {
      status: 400,
      message: "No students meet the requirements to publish scores.",
    };
  }

  const userIds = completeStudents.map((s) => s.UserID);

  if (userIds.length) {
    await SessionParticipant.update(
      { IsPublished: true },
      {
        where: {
          SessionID: sessionId,
          UserID: userIds,
        },
      }
    );
  }

  try {
    await generateStudentReportAndSendMail({ req, userIds });
    await Session.update(
      { isPublished: true, status: "COMPLETE" },
      { where: { ID: sessionId } }
    );
  } catch (err) {
    console.error("Error generating student report:", err.message);
    return {
      status: 500,
      message: "Failed to generate student report.",
    };
  }

  return {
    status: 200,
    message: "Scores published successfully.",
  };
};

const getPublishedSessionParticipantsByUserId = async (req) => {
  const { publish, userId } = req.query;
  if (!publish) {
    throw new Error("Publish parameter is required");
  }
  if (publish !== "true") {
    throw new Error(
      "Publish must be 'true' to retrieve published participants"
    );
  }
  if (!userId) {
    throw new Error("UserID is required");
  }
  const results = await SessionParticipant.findAll({
    where: {
      IsPublished: publish,
      UserID: userId,
    },
  });
  return {
    status: 200,
    message: "Published session participants retrieved successfully.",
    data: results,
  };
};

const updateLevelById = async (req) => {
  try {
    const { newLevel } = req.body;
    const participantId = req.params.id;

    if (!participantId) throw new Error("participantId is required.");
    if (!newLevel) throw new Error("newLevel is required.");

    if (!CEFR_LEVELS.includes(newLevel)) {
      throw new Error(
        `Invalid level: ${newLevel}. Valid levels are: ${CEFR_LEVELS.join(
          ", "
        )}`
      );
    }

    const [affectedRows] = await SessionParticipant.update(
      { Level: newLevel },
      { where: { ID: participantId } }
    );

    if (affectedRows === 0) {
      return {
        status: 404,
        message: `No participant found with ID ${participantId}.`,
      };
    }

    return {
      status: 200,
      message: `Successfully updated level to "${newLevel}".`,
    };
  } catch (error) {
    return {
      status: 500,
      message: error.message || "Internal server error.",
    };
  }
};

module.exports = {
  updateLevelById,
  getPublishedSessionParticipantsByUserId,
  publishScoresBySessionId,
  addParticipant,
  getAllParticipants,
  getParticipantsByUserId,
  getAllParticipantsGroupedByUser,
};
