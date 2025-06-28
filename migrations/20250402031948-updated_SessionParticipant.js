"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("SessionParticipants", "isApproved");
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("SessionParticipants", "isApproved", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
};
