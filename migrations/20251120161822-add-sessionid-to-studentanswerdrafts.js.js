'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('StudentAnswerDrafts', 'SessionID', {
      type: Sequelize.UUID,
      allowNull: true, // an toàn cho data cũ; sau này có thể siết NOT NULL
      references: {
        model: 'Sessions',
        key: 'ID',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // hoặc SET NULL tuỳ logic của bạn
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('StudentAnswerDrafts', 'SessionID');
  },
};
