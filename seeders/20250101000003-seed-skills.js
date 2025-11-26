'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      const SKILLS = [
        { Name: 'GRAMMAR AND VOCABULARY' },
        { Name: 'READING' },
        { Name: 'LISTENING' },
        { Name: 'WRITING' },
        { Name: 'SPEAKING' },
      ];

      const skillNames = SKILLS.map((s) => s.Name);

      const existingSkills = await queryInterface.sequelize.query(
        `SELECT "ID","Name" FROM "Skills" WHERE "Name" IN (:names);`,
        {
          replacements: { names: skillNames },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      const existingNamesSet = new Set(existingSkills.map((s) => s.Name));

      const skillsToInsert = SKILLS.filter(
        (s) => !existingNamesSet.has(s.Name)
      ).map((s) => ({
        ID: uuidv4(),
        Name: s.Name,
        createdAt: now,
        updatedAt: now,
      }));

      if (skillsToInsert.length > 0) {
        await queryInterface.bulkInsert('Skills', skillsToInsert, {
          transaction,
        });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const SKILL_NAMES = [
      'GRAMMAR AND VOCABULARY',
      'READING',
      'LISTENING',
      'WRITING',
      'SPEAKING',
    ];
    return queryInterface.bulkDelete('Skills', { Name: SKILL_NAMES }, {});
  },
};
