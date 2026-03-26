'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * PostgreSQL ENUMs are a bit tricky to update.
     * We use a raw query to add the value to the type.
     */
    try {
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_Sessions_status" ADD VALUE 'ARCHIVED';`
      );
    } catch (error) {
      // In case the value already exists or the type name is different
      console.warn('Could not add ARCHIVED to enum_Sessions_status. It might already exist.', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * PostgreSQL doesn't support removing values from an ENUM type.
     * To revert, we would normally have to drop and recreate the type, 
     * which is dangerous if data exists. For safety, we do nothing in down.
     */
    console.warn('PostgreSQL does not support removing values from an ENUM. Migration down skipped.');
  }
};
