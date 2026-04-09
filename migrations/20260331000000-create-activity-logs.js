'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ActivityLogs', {
      ID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      UserID: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'ID',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      action: {
        type: Sequelize.ENUM('create', 'update', 'delete'),
        allowNull: false,
      },
      entityType: {
        type: Sequelize.ENUM('class', 'session', 'topic', 'question', 'part', 'section'),
        allowNull: false,
      },
      entityID: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      entityName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ActivityLogs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ActivityLogs_action";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ActivityLogs_entityType";');
  },
};
