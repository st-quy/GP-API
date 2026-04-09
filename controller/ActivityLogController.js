const ActivityLogService = require('../services/ActivityLogService');

async function getRecentActivities(req, res) {
  try {
    const result = await ActivityLogService.getRecentActivities(req);
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getRecentActivities,
};
