'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Parts', 'SkillID', {
      type: Sequelize.UUID,
      allowNull: true, // nếu DB mới hoàn toàn, có thể đổi thành false
      references: {
        model: 'Skills',
        key: 'ID',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Parts', 'SkillID');
  },
};
