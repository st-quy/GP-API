'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For PostgreSQL, we need to alter the enum type to add 'archived'
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Sections_Status" ADD VALUE IF NOT EXISTS 'archived';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // PostgreSQL doesn't support removing enum values easily
    // This is a no-op down migration
  },
};
