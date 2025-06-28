const SessionRequestService = require("../services/SessionRequestService");

async function createSessionRequest(req, res) {
  try {
    const newSessionRequest = await SessionRequestService.createSessionRequest(
      req
    );
    return res.status(newSessionRequest.status).json(newSessionRequest);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getAllSessionRequests(req, res) {
  try {
    const sessionRequests = await SessionRequestService.getAllSessionRequests(
      req
    );
    return res.status(sessionRequests.status).json(sessionRequests);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getSessionRequestByStudentId(req, res) {
  try {
    const sessionRequest =
      await SessionRequestService.getSessionRequestByStudentId(req);
    return res.status(sessionRequest.status).json(sessionRequest);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function approveSessionRequest(req, res) {
  try {
    const approvedSessionRequest =
      await SessionRequestService.approveSessionRequest(req);
    return res
      .status(approvedSessionRequest.status)
      .json(approvedSessionRequest);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function approveAllSessionRequest(req, res) {
  try {
    const approvedSessionRequest =
      await SessionRequestService.approveAllSessionRequest(req);
    return res
      .status(approvedSessionRequest.status)
      .json(approvedSessionRequest);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function rejectSessionRequest(req, res) {
  try {
    const rejectedSessionRequest =
      await SessionRequestService.rejectSessionRequest(req);
    return res
      .status(rejectedSessionRequest.status)
      .json(rejectedSessionRequest);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function rejectAllSessionRequest(req, res) {
  try {
    const rejectedSessionRequest =
      await SessionRequestService.rejectAllSessionRequest(req);
    return res
      .status(rejectedSessionRequest.status)
      .json(rejectedSessionRequest);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllSessionRequests,
  getSessionRequestByStudentId,
  createSessionRequest,
  approveSessionRequest,
  rejectSessionRequest,
  approveAllSessionRequest,
  rejectAllSessionRequest
};
