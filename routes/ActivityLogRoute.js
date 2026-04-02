const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/AuthMiddleware');
const ActivityLogController = require('../controller/ActivityLogController');

/**
 * @swagger
 * /activities/recent:
 *   get:
 *     summary: Get recent teacher activities
 *     tags: [Activities]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Recent activities fetched
 */
router.get('/recent', authorize(['teacher', 'admin']), ActivityLogController.getRecentActivities);

module.exports = router;
