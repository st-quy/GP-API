"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("StudentAnswers", "SessionID", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "Sessions",
        key: "ID",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("StudentAnswers", "SessionID");
  },
};
