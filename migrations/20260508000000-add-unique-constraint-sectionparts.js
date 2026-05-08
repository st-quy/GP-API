'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add unique constraint on (SectionID, PartID) so that
    // Sequelize upsert's ON CONFLICT ("SectionID","PartID") works correctly.
    await queryInterface.addConstraint('SectionParts', {
      fields: ['SectionID', 'PartID'],
      type: 'unique',
      name: 'SectionParts_SectionID_PartID_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'SectionParts',
      'SectionParts_SectionID_PartID_unique'
    );
  },
};
