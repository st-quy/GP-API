'use strict';
const { v4: uuidv4 } = require('uuid');
const { SESSION_REQUEST_STATUS } = require('../helpers/constants');

module.exports = {
  async up(queryInterface, Sequelize) {
    const [sessions] = await queryInterface.sequelize.query(
      `SELECT "ID" FROM "Sessions" LIMIT 1;`
    );
    const [users] = await queryInterface.sequelize.query(
      `SELECT "ID" FROM "Users" WHERE "email" = 'student@greenprep.com';`
    );

    if (!sessions.length || !users.length) return;

    const sessionId = sessions[0].ID;
    const userId = users[0].ID;
    const now = new Date();

    await queryInterface.bulkInsert('SessionRequests', [
      {
        ID: uuidv4(),
        status: SESSION_REQUEST_STATUS.PENDING,
        requestDate: now,
        SessionID: sessionId,
        UserID: userId,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SessionRequests', null, {});
  },
};
