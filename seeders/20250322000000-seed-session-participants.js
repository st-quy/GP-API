"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const sessions = await queryInterface.sequelize.query(
      `SELECT "ID" FROM "Sessions" LIMIT 5;`
    );
    const [user] = await queryInterface.sequelize.query(
      `SELECT "ID" FROM "Users" WHERE "email" = 'student@greenprep.com';`
    );
    

    const sessionIds = sessions[0].map((session) => session.ID);

    const { v4: uuidv4 } = require("uuid");
    const id1 = uuidv4();

    // Seed dữ liệu mẫu
    const participants = [
      {
        ID: id1,
        GrammarVocab: 50,
        Reading: 50,
        ReadingLevel: "C",
        Listening: 50,
        ListeningLevel: "C",
        Speaking: 50,
        SpeakingLevel: "C",
        Writing: 50,
        WritingLevel: "C",
        Total: 250,
        Level: "C",
        SessionID: sessionIds[0],
        approvedAt: new Date(),
        UserID: user[0].ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("SessionParticipants", participants, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("SessionParticipants", null, {});
  },
};
