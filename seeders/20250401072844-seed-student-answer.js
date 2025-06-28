"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { v4: uuidv4 } = require("uuid");

    const sessionParticipants = await queryInterface.sequelize.query(
      `
      SELECT "SessionID", "UserID"
      FROM "SessionParticipants"
      WHERE "approvedAt" IS NOT NULL AND "UserID" IS NOT NULL
      LIMIT 1;
      `
    );

    const topics = await queryInterface.sequelize.query(
      `SELECT "ID" FROM "Topics" LIMIT 1;`
    );

    const questions = await queryInterface.sequelize.query(
      `
      SELECT q."ID" 
      FROM "Questions" q
      INNER JOIN "Skills" s ON q."SkillID" = s."ID"
      WHERE LOWER(s."Name") IN ('speaking', 'writing')
      LIMIT 5;
      `
    );

    const sessionParticipantData = sessionParticipants[0];
    const topicIds = topics[0].map((topic) => topic.ID);
    const questionIds = questions[0].map((question) => question.ID);

    const studentAnswers = sessionParticipantData.map((participant, index) => ({
      ID: uuidv4(),
      StudentID: participant.UserID,
      SessionID: participant.SessionID,
      TopicID: topicIds[0],
      QuestionID: questionIds[index % questionIds.length],
      AnswerText: `This is a sample answer text for question ${index + 1}.`,
      AnswerAudio: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await queryInterface.bulkInsert("StudentAnswers", studentAnswers, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("StudentAnswers", null, {});
  },
}