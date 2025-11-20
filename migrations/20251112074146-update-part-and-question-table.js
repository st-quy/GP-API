'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
        await queryInterface.addColumn('Questions', 'TopicPartID', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'TopicParts',
        key: 'ID',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('Questions', 'GroupID', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    await queryInterface.changeColumn('Parts', 'Sequence', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.removeColumn('Parts', 'TopicID');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Questions', 'TopicPartID');
    await queryInterface.removeColumn('Questions', 'GroupID');

    await queryInterface.changeColumn('Parts', 'Sequence', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.addColumn('Parts', 'TopicID', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Topics',
        key: 'ID',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  }
};
