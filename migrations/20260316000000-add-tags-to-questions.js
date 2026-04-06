'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Questions', 'Tags', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: true,
      defaultValue: [],
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Questions', 'Tags');
  },
};
