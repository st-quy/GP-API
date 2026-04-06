'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Sections', 'Status', {
      type: Sequelize.ENUM('draft', 'published'),
      allowNull: true,
      defaultValue: 'draft',
      after: 'SkillID'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Sections', 'Status');
  }
};
