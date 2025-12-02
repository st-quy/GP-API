'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const [teachers] = await queryInterface.sequelize.query(
      `SELECT "ID" FROM "Users" WHERE "email" = 'teacher@greenprep.com';`
    );
    if (!teachers || teachers.length === 0) return;

    const teacherId = teachers[0].ID;

    const existing = await queryInterface.sequelize.query(
      `SELECT "className" FROM "Classes" WHERE "className" IN ('Class A', 'Class B', 'Class C');`
    );
    const existingSet = new Set(existing[0].map((c) => c.className));

    const classes = ['Class A', 'Class B', 'Class C']
      .filter((name) => !existingSet.has(name))
      .map((name) => ({
        ID: uuidv4(),
        className: name,
        UserID: teacherId,
        createdAt: now,
        updatedAt: now,
      }));

    if (classes.length > 0) {
      await queryInterface.bulkInsert('Classes', classes, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'Classes',
      { className: ['Class A', 'Class B', 'Class C'] },
      {}
    );
  },
};
