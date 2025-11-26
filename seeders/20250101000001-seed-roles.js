'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();
      const ROLE_NAMES = ['admin', 'teacher', 'student'];

      const existing = await queryInterface.sequelize.query(
        `SELECT "Name" FROM "Roles" WHERE "Name" IN (:names);`,
        {
          replacements: { names: ROLE_NAMES },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      const existingSet = new Set(existing.map((r) => r.Name));

      const toInsert = ROLE_NAMES.filter((name) => !existingSet.has(name)).map(
        (name) => ({
          ID: uuidv4(),
          Name: name,
          createdAt: now,
          updatedAt: now,
        })
      );

      if (toInsert.length > 0) {
        await queryInterface.bulkInsert('Roles', toInsert, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const ROLE_NAMES = ['admin', 'teacher', 'student'];
    return queryInterface.bulkDelete('Roles', { Name: ROLE_NAMES }, {});
  },
};
