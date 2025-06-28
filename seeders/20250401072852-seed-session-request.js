"use strict";

const { v4: uuidv4 } = require("uuid");
const { SESSION_REQUEST_STATUS } = require("../helpers/constants");

module.exports = {
  async up(queryInterface, Sequelize) {
    const sessions = await queryInterface.sequelize.query(
      `SELECT "ID" FROM "Sessions" LIMIT 5;`
    );

    const [users] = await queryInterface.sequelize.query(
      `SELECT "ID" FROM "Users" WHERE "email" = 'student@greenprep.com';`
    );

    const sessionIds = sessions[0].map((session) => session.ID);

    
    if (!users || users.length === 0) {
      throw new Error('Student user not found');
    }

    const id1 = uuidv4();

    const sessionRequests = [
      {
        ID: id1,
        status: SESSION_REQUEST_STATUS.PENDING,
        requestDate: new Date(),
        SessionID: sessionIds[0],
        UserID: users[0].ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("SessionRequests", sessionRequests, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("SessionRequests", null, {});
  },
};
