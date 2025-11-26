'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const [classes] = await queryInterface.sequelize.query(
      `SELECT "ID" FROM "Classes";`
    );
    const [topics] = await queryInterface.sequelize.query(
      `SELECT "ID" FROM "Topics";`
    );
    if (!classes.length || !topics.length) return;

    const classIds = classes.map((c) => c.ID);
    const topicId = topics[0].ID;

    const existing = await queryInterface.sequelize.query(
      `SELECT "sessionKey" FROM "Sessions" WHERE "sessionKey" IN ('S1-KEY','S2-KEY');`
    );
    if (existing[0].length > 0) return;

    const now = new Date();

    await queryInterface.bulkInsert('Sessions', [
      {
        ID: uuidv4(),
        sessionName: 'Session 1',
        sessionKey: 'S1-KEY',
        startTime: now,
        endTime: new Date(now.getTime() + 60 * 60 * 1000),
        examSet: topicId,
        status: 'NOT_STARTED',
        ClassID: classIds[0],
        isPublished: false,
        minioAudioRemoved: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        ID: uuidv4(),
        sessionName: 'Session 2',
        sessionKey: 'S2-KEY',
        startTime: now,
        endTime: new Date(now.getTime() + 90 * 60 * 1000),
        examSet: topicId,
        status: 'ON_GOING',
        ClassID: classIds[1] || classIds[0],
        isPublished: false,
        minioAudioRemoved: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Sessions', {
      sessionKey: ['S1-KEY', 'S2-KEY'],
    });
  },
};
