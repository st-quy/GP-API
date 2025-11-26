'use strict';
const { v4: uuidv4 } = require('uuid');

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

    await queryInterface.bulkInsert('SessionParticipants', [
      {
        ID: uuidv4(),
        GrammarVocab: 0,
        Reading: 0,
        Listening: 0,
        Speaking: 0,
        Writing: 0,
        Total: 0,
        GrammarVocabLevel: null,
        ReadingLevel: null,
        ListeningLevel: null,
        SpeakingLevel: null,
        WritingLevel: null,
        Level: null,
        IsPublished: false,
        SessionID: sessionId,
        approvedAt: now,
        UserID: userId,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SessionParticipants', null, {});
  },
};
