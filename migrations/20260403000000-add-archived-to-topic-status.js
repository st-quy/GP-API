'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // For PostgreSQL, we need to add the value to the existing ENUM type
    // We use raw SQL because queryInterface.changeColumn doesn't handle ENUM additions well in all versions
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_Topics_Status\" ADD VALUE IF NOT EXISTS 'archived';"
    );
  },

  async down(queryInterface, Sequelize) {
    // Reverting ENUM values is complex in Postgres. 
    // Usually, we just leave it or recreate the table if necessary.
    // For this assessment platform, we'll keep it simple.
    console.log('Down migration: Removing values from ENUM is not directly supported in Postgres without recreating the type.');
  }
};
