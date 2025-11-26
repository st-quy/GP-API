'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Nếu trước đó bạn có FK constraint, removeColumn sẽ lo luôn
    await queryInterface.removeColumn('Questions', 'SkillID');
  },

  async down(queryInterface, Sequelize) {
    // Rollback: thêm lại cột SkillID
    await queryInterface.addColumn('Questions', 'SkillID', {
      type: Sequelize.UUID,
      allowNull: true, // trước đây bạn để NOT NULL thì có thể chỉnh lại
      references: {
        model: 'Skills',
        key: 'ID',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
};
