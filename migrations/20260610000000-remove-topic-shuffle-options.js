'use strict';

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('Topics');
    if (table.ShuffleQuestions) {
      await queryInterface.removeColumn('Topics', 'ShuffleQuestions');
    }
    if (table.ShuffleAnswers) {
      await queryInterface.removeColumn('Topics', 'ShuffleAnswers');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Topics');
    if (!table.ShuffleQuestions) {
      await queryInterface.addColumn('Topics', 'ShuffleQuestions', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
    if (!table.ShuffleAnswers) {
      await queryInterface.addColumn('Topics', 'ShuffleAnswers', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },
};
