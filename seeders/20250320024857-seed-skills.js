"use strict";
const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const skills = [
      { Name: "GRAMMAR AND VOCABULARY" },
      { Name: "READING" },
      { Name: "LISTENING" },
      { Name: "WRITING" },
      { Name: "SPEAKING" },
    ];

    for (const skill of skills) {
      const existingSkill = await queryInterface.rawSelect(
        "Skills",
        {
          where: { Name: skill.Name },
        },
        ["ID"]
      );

      if (!existingSkill) {
        await queryInterface.bulkInsert(
          "Skills",
          [
            {
              ID: uuidv4(),
              Name: skill.Name,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          {}
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Skills", null, {});
  },
};
