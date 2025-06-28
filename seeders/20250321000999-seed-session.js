// filepath: /Users/quy.pham/Desktop/ST/GreenPREP-API/seeders/20250321000999-seed-session.js
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { v4: uuidv4 } = require("uuid");

    const id1 = uuidv4();
    const id2 = uuidv4();
    const id3 = uuidv4();
    const id4 = uuidv4();
    const id5 = uuidv4();
    const id6 = uuidv4();

    // Fetch existing Class IDs from the database
    const classes = await queryInterface.sequelize.query(
      `SELECT "ID" FROM "Classes";`
    );
    const classIds = classes[0].map((c) => c.ID);

    // Fetch existing Topic IDs from the database
    const topics = await queryInterface.sequelize.query(
      `SELECT "ID" FROM "Topics";`
    );
    const topicIds = topics[0].map((t) => t.ID);


    // Check for existing session keys
    const existingSessions = await queryInterface.sequelize.query(
      `SELECT "sessionKey" FROM "Sessions" WHERE "sessionKey" IN ('S1-KEY', 'S2-KEY', 'S3-KEY', 'S4-KEY', 'S5-KEY', 'S6-KEY');`
    );

    if (existingSessions[0].length > 0) {
      return;
    }

    return queryInterface.bulkInsert("Sessions", [
      {
      ID: id1,
      sessionName: "Session 1",
      sessionKey: "S1-KEY",
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + 3600000),
      examSet: topicIds[0], // Assign first topic
        status: "NOT_STARTED",
        ClassID: classIds[0], // Assign first class
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: id2,
        sessionName: "Session 2",
        sessionKey: "S2-KEY",
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 7200000),
        examSet: topicIds[0], // Assign second topic
        status: "ON_GOING",
        ClassID: classIds[1], // Assign second class
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: id3,
        sessionName: "Session 3",
        sessionKey: "S3-KEY",
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 5400000), // +1.5 hours
        examSet: topicIds[0], // Assign third topic
        status: "COMPLETE",
        ClassID: classIds[2], // Assign third class
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: id4,
        sessionName: "Session 4",
        sessionKey: "S4-KEY",
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 3600000),
        examSet: topicIds[0], // Assign first topic
        status: "NOT_STARTED",
        ClassID: classIds[0], // Assign first class
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: id5,
        sessionName: "Session 5",
        sessionKey: "S5-KEY",
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 7200000),
        examSet: topicIds[0], // Assign second topic
        status: "ON_GOING",
        ClassID: classIds[1], // Assign second class
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: id6,
        sessionName: "Session 6",
        sessionKey: "S6-KEY",
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 5400000), // +1.5 hours
        examSet: topicIds[0], // Assign third topic
        status: "COMPLETE",
        ClassID: classIds[2], // Assign third class
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Sessions", null, {});
  },
};