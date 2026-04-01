const { ActivityLog, User } = require('../models');
const { Op } = require('sequelize');

const ACTIVITY_RETENTION_DAYS = 30;
const PAGE_SIZE = 15;

async function logActivity({ userId, action, entityType, entityID, entityName, details }) {
  try {
    await ActivityLog.create({
      UserID: userId || null,
      action,
      entityType,
      entityID: entityID || null,
      entityName: entityName || null,
      details: details || null,
    });
  } catch (error) {
    console.error('Error logging activity:', error.message);
  }
}

async function cleanupOldActivities() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ACTIVITY_RETENTION_DAYS);
    const { count } = await ActivityLog.destroy({
      where: {
        createdAt: { [Op.lt]: cutoffDate },
      },
    });
    if (count > 0) {
      console.log(`[ActivityLog] Cleaned up ${count} old activity records (older than ${ACTIVITY_RETENTION_DAYS} days)`);
    }
  } catch (error) {
    console.error('[ActivityLog] Cleanup error:', error.message);
  }
}

async function getRecentActivities(req) {
  try {
    const { limit = PAGE_SIZE, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || PAGE_SIZE, 50);
    const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

    const { count, rows: activities } = await ActivityLog.findAndCountAll({
      include: [
        {
          model: User,
          attributes: ['ID', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offsetNum,
    });

    const data = activities.map((a) => {
      const plain = a.get({ plain: true });
      return {
        ...plain,
        user: plain.User
          ? `${plain.User.firstName} ${plain.User.lastName}`
          : 'Unknown',
      };
    });

    return {
      status: 200,
      message: 'Recent activities fetched successfully',
      data,
      pagination: {
        total: count,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + data.length < count,
      },
    };
  } catch (error) {
    throw new Error(`Error fetching recent activities: ${error.message}`);
  }
}

module.exports = {
  logActivity,
  getRecentActivities,
  cleanupOldActivities,
};
