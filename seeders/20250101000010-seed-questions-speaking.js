'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tx = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      const skillId = await queryInterface.rawSelect(
        'Skills',
        { where: { Name: 'SPEAKING' }, transaction: tx },
        ['ID']
      );

      if (!skillId) {
        throw new Error(
          'Skill "SPEAKING" chưa được seed. Hãy chạy seed skills trước.'
        );
      }

      async function getPartId(content) {
        const id = await queryInterface.rawSelect(
          'Parts',
          {
            where: { Content: content, SkillID: skillId },
            transaction: tx,
          },
          ['ID']
        );
        if (!id) {
          throw new Error(
            `Part "${content}" cho skill SPEAKING chưa được seed. Hãy chạy 20250101000004-seed-parts-base trước.`
          );
        }
        return id;
      }

      const p1 = await getPartId('Part 1');
      const p2 = await getPartId('Part 2');
      const p3 = await getPartId('Part 3');
      const p4 = await getPartId('Part 4');

      const questions = [
        // Part 1 – personal questions
        {
          type: 'speaking',
          partId: p1,
          content: 'Describe your journey here today.',
          sequence: 1,
        },
        {
          type: 'speaking',
          partId: p1,
          content: 'Tell me about your favourite season.',
          sequence: 2,
        },
        {
          type: 'speaking',
          partId: p1,
          content: 'Describe a typical meal in your country.',
          sequence: 3,
        },

        // Part 2 – picture-based questions
        {
          type: 'speaking',
          partId: p2,
          content: 'Describe the picture.',
          imageKeys: ['images/speaking/part2/picture-1.png'],
          sequence: 4,
        },
        {
          type: 'speaking',
          partId: p2,
          content:
            'Tell me about a time you went shopping for clothes. What did you buy and who were you with?',
          imageKeys: ['images/speaking/part2/picture-1.png'],
          sequence: 5,
        },
        {
          type: 'speaking',
          partId: p2,
          content:
            'Describe a place where you like to relax after school or work.',
          imageKeys: ['images/speaking/part2/picture-2.png'],
          sequence: 6,
        },

        // Part 3 – compare & contrast
        {
          type: 'speaking',
          partId: p3,
          content:
            'Compare two pictures of people working in different environments. What are the similarities and differences?',
          imageKeys: [
            'images/speaking/part3/picture-2a.png',
            'images/speaking/part3/picture-2b.png',
          ],
          sequence: 7,
        },
        {
          type: 'speaking',
          partId: p3,
          content:
            'What are the advantages and disadvantages of working from home?',
          sequence: 8,
        },

        // Part 4 – discussion
        {
          type: 'speaking',
          partId: p4,
          content: 'Why do some people dislike going shopping for clothes?',
          sequence: 9,
        },
        {
          type: 'speaking',
          partId: p4,
          content:
            'Do you think online shopping will completely replace traditional shops? Why or why not?',
          sequence: 10,
        },
      ];

      const rowsToInsert = [];

      for (const q of questions) {
        const existingId = await queryInterface.rawSelect(
          'Questions',
          {
            where: { Content: q.content, PartID: q.partId },
            transaction: tx,
          },
          ['ID']
        );
        if (existingId) continue;

        rowsToInsert.push({
          ID: uuidv4(),
          Type: q.type,
          AudioKeys: null,
          ImageKeys: q.imageKeys || null,
          PartID: q.partId,
          Sequence: q.sequence,
          Content: q.content,
          SubContent: null,
          GroupContent: null,
          AnswerContent: null, // Speaking chấm tay
          GroupID: null,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (rowsToInsert.length > 0) {
        await queryInterface.bulkInsert('Questions', rowsToInsert, {
          transaction: tx,
        });
      }

      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const skillId = await queryInterface.rawSelect(
      'Skills',
      { where: { Name: 'SPEAKING' } },
      ['ID']
    );
    if (!skillId) return;

    const contents = ['Part 1', 'Part 2', 'Part 3', 'Part 4'];

    const partIds = [];
    for (const c of contents) {
      const id = await queryInterface.rawSelect(
        'Parts',
        { where: { Content: c, SkillID: skillId } },
        ['ID']
      );
      if (id) partIds.push(id);
    }

    if (!partIds.length) return;

    await queryInterface.bulkDelete(
      'Questions',
      {
        PartID: { [Sequelize.Op.in]: partIds },
        Type: 'speaking',
      },
      {}
    );
  },
};
