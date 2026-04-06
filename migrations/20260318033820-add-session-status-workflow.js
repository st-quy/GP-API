"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Sessions_status"
      ADD VALUE IF NOT EXISTS 'DRAFT';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Sessions_status"
      ADD VALUE IF NOT EXISTS 'PUBLISHED';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Sessions_status"
      ADD VALUE IF NOT EXISTS 'ARCHIVED';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Sessions_status"
      ADD VALUE IF NOT EXISTS 'DELETED';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // PostgreSQL does not support removing values from an ENUM type.
    // To rollback, you would need to create a new type, migrate data, and swap.
    // This is intentionally left as a no-op for safety.
  },
};
