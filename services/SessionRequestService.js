const { where } = require("sequelize");
const { SESSION_REQUEST_STATUS } = require("../helpers/constants");
const { Session, SessionRequest, SessionParticipant } = require("../models");
const { addParticipant } = require("./SessionParticipantService");

/**
 *
 * @param {import('express').Request} req
 * @returns
 */
async function getAllSessionRequests(req) {
  try {
    const { sessionId } = req.params;
    const status = req.query.status;

    const whereClause = { SessionID: sessionId };
    if (Object.values(SESSION_REQUEST_STATUS).includes(status)) {
      whereClause.status = status;
    }
    const sessionRequests = await SessionRequest.findAll({
      where: whereClause,
      include: ["User"],
    });
    return {
      status: 200,
      data: sessionRequests,
    };
  } catch (error) {
    throw new Error(`Error getting session requests: ${error.message}`);
  }
}

/**
 *
 * @param {import('express').Request} req
 * @returns
 */
async function getSessionRequestByStudentId(req) {
  try {
    const { sessionId, studentId } = req.params;
    const { requestId } = req.query;

    const status = req.query.status;

    const whereClause = {
      UserID: studentId,
      SessionID: sessionId,
      ID: requestId,
    };
    if (Object.values(SESSION_REQUEST_STATUS).includes(status)) {
      whereClause.status = status;
    }

    const sessionRequest = await SessionRequest.findOne({
      where: whereClause,
    });
    if (!sessionRequest) {
      throw new Error("Session request not found");
    }

    if (sessionRequest.status === SESSION_REQUEST_STATUS.APPROVED) {
      const sessionParticipant = await SessionParticipant.findOne({
        where: {
          UserID: studentId,
          SessionID: sessionId,
        },
        include: ["Session"],
      });

      if (!sessionParticipant) {
        throw new Error(
          `Session participant with studentId ${studentId} and ${sessionId} not found`
        );
      }
      return {
        status: 200,
        data: {
          sessionParticipant,
          sessionRequest,
        },
      };
    }
    return {
      status: 200,
      data: sessionRequest,
    };
  } catch (error) {
    throw new Error(`Error getting session request: ${error.message}`);
  }
}

/**
 *
 * @param {import('express').Request} req
 * @returns
 */
async function createSessionRequest(req) {
  try {
    const { UserID, sessionKey } = req.body;
    const session = await Session.findOne({ where: { sessionKey } });
    if (!session) {
      return {
        status: 404,
        message: "Session not found",
      };
    }

    if (["COMPLETE", "NOT_STARTED"].includes(session.status)) {
      return {
        status: 400,
        message: `Session is ${
          session.status === "COMPLETE" ? "complete" : "not started"
        }`,
      };
    }
    console.log(UserID);
    console.log(sessionKey);

    const pendingRequest = await SessionRequest.findOne({
      where: {
        UserID,
        SessionID: session.ID,
        status: SESSION_REQUEST_STATUS.PENDING,
      },
    });

    if (pendingRequest) {
      return {
        status: 201,
        message: "Session request created successfully",
        data: [pendingRequest],
      };
    }

    const allSessionRequest = await SessionRequest.findAll({
      where: {
        UserID,
        SessionID: session.ID,
      },
    });

    const rejectedSessionRequests = allSessionRequest.filter(
      (request) => request.status === SESSION_REQUEST_STATUS.REJECTED
    );

    if (rejectedSessionRequests.length >= 3) {
      throw new Error("Session request limit reached");
    }

    let sessionRequest;
    const hasApprovedSessionRequest = allSessionRequest.some(
      (request) => request.status === SESSION_REQUEST_STATUS.APPROVED
    );

    if (!hasApprovedSessionRequest) {
      sessionRequest = await SessionRequest.create({
        UserID,
        SessionID: session.ID,
      });
    } else {
      const approvedSessionRequest = await SessionRequest.findOne({
        where: {
          UserID,
          SessionID: session.ID,
          status: SESSION_REQUEST_STATUS.APPROVED,
        },
      });

      approvedSessionRequest.status = SESSION_REQUEST_STATUS.PENDING;
      await approvedSessionRequest.save();
      sessionRequest = approvedSessionRequest;
    }

    return {
      status: 201,
      message: "Session request created successfully",
      data: sessionRequest,
    };
  } catch (error) {
    const errorMsg = `Error creating session request: ${error.message}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 *
 * @param {import('express').Request} req
 * @returns
 */
async function approveSessionRequest(req) {
  try {
    const { sessionId } = req.params;
    const { requestId } = req.body;

    const sessionRequest = await SessionRequest.findOne({
      where: { ID: requestId, SessionID: sessionId },
    });
    if (
      !sessionRequest ||
      sessionRequest.status !== SESSION_REQUEST_STATUS.PENDING
    ) {
      throw new Error("Session request not found");
    }

    if (sessionRequest.status === SESSION_REQUEST_STATUS.PENDING) {
      sessionRequest.status = SESSION_REQUEST_STATUS.APPROVED;
      await sessionRequest.save();

      const existedParticipant = await SessionParticipant.findOne({
        where: {
          UserID: sessionRequest.UserID,
          SessionID: sessionId,
        },
      });

      if (!existedParticipant) {
        await addParticipant(sessionId, sessionRequest.UserID);
      }
    }

    return {
      status: 200,
      message: "Session request approved successfully",
      data: sessionRequest,
    };
  } catch (error) {
    throw new Error(`Error approving session request: ${error.message}`);
  }
}

async function approveAllSessionRequest(req) {
  try {
    const { sessionId } = req.params;

    const sessionRequests = await SessionRequest.findAll({
      where: {
        SessionID: sessionId,
        status: SESSION_REQUEST_STATUS.PENDING,
      },
    });

    if (!sessionRequests.length) {
      throw new Error("No pending session requests found");
    }

    const approvalPromises = sessionRequests.map(async (request) => {
      request.status = SESSION_REQUEST_STATUS.APPROVED;
      await request.save();
      await addParticipant(sessionId, request.UserID);
      return request;
    });

    const approvedRequests = await Promise.all(approvalPromises);

    return {
      status: 200,
      message: "All session requests approved successfully",
      data: approvedRequests,
    };
  } catch (error) {
    throw new Error(`Error approving session requests: ${error.message}`);
  }
}

/**
 *
 * @param {import('express').Request} req
 * @returns
 */
async function rejectSessionRequest(req) {
  try {
    const { sessionId } = req.params;
    const { requestId } = req.body;

    const sessionRequest = await SessionRequest.findOne({
      where: { ID: requestId, SessionID: sessionId },
    });
    if (
      !sessionRequest ||
      sessionRequest.status !== SESSION_REQUEST_STATUS.PENDING
    ) {
      throw new Error("Session request not found");
    }

    sessionRequest.status = SESSION_REQUEST_STATUS.REJECTED;
    await sessionRequest.save();

    return {
      status: 200,
      message: "Session request rejected successfully",
      data: sessionRequest,
    };
  } catch (error) {
    throw new Error(`Error rejecting session request: ${error.message}`);
  }
}

async function rejectAllSessionRequest(req) {
  try {
    const { sessionId } = req.params;

    const sessionRequests = await SessionRequest.findAll({
      where: {
        SessionID: sessionId,
        status: SESSION_REQUEST_STATUS.PENDING,
      },
    });

    if (!sessionRequests.length) {
      throw new Error("No pending session requests found");
    }

    const rejectPromises = sessionRequests.map(async (request) => {
      request.status = SESSION_REQUEST_STATUS.REJECTED;
      await request.save();
      return request;
    });

    const rejectRequests = await Promise.all(rejectPromises);

    return {
      status: 200,
      message: "All session requests rejected successfully",
      data: rejectRequests,
    };
  } catch (error) {
    throw new Error(`Error approving session requests: ${error.message}`);
  }
}

module.exports = {
  getAllSessionRequests,
  getSessionRequestByStudentId,
  createSessionRequest,
  approveSessionRequest,
  rejectSessionRequest,
  approveAllSessionRequest,
  rejectAllSessionRequest,
};
