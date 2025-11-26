'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // 1) Lấy Skill GRAMMAR AND VOCABULARY
      const skillId = await queryInterface.rawSelect(
        'Skills',
        {
          where: { Name: 'GRAMMAR AND VOCABULARY' },
          transaction,
        },
        ['ID']
      );

      if (!skillId) {
        throw new Error(
          'Skill "GRAMMAR AND VOCABULARY" chưa được seed. Hãy chạy seed skills trước.'
        );
      }

      // 2) Lấy Part "Part 1: ..." thuộc skill này
      const partContent = 'Part 1: ...';

      const partId = await queryInterface.rawSelect(
        'Parts',
        {
          where: {
            Content: partContent,
            SkillID: skillId,
          },
          transaction,
        },
        ['ID']
      );

      if (!partId) {
        throw new Error(
          `Part "${partContent}" cho skill "GRAMMAR AND VOCABULARY" chưa được seed. Hãy chạy 20250101000004-seed-parts-base trước.`
        );
      }

      // 3) Danh sách câu hỏi Multiple-choice
      const questions = [
        {
          content:
            'I wish I ____ a better grade on the final exam last semester.',
          options: ['got', 'would get', 'had gotten'],
          correctAnswer: 'had gotten',
        },
        {
          content: 'I have _____ apples in my bag.',
          options: ['a little', 'a few', 'much'],
          correctAnswer: 'a few',
        },
        {
          content: 'I am going ____ the park.',
          options: ['to', 'on', 'in'],
          correctAnswer: 'to',
        },
        {
          content: 'I ____ my homework every day.',
          options: ['do', 'does', 'am doing'],
          correctAnswer: 'do',
        },
        {
          content: 'If I ____ enough money, I would buy a new car.',
          options: ['have', 'had', 'will have'],
          correctAnswer: 'had',
        },
        {
          content: 'I ____ play basketball when I was younger.',
          options: ['used to', 'would', 'should have'],
          correctAnswer: 'used to',
        },
        {
          content: 'The teacher asked the students ____ their homework.',
          options: ['to', 'doing', 'to do'],
          correctAnswer: 'to do',
        },
        {
          content: '____ I am tired, I will still go to the gym.',
          options: ['Although', 'Therefore', 'On the other hand'],
          correctAnswer: 'Although',
        },
        {
          content:
            'Anna: Did you enjoy the concert last night?\nShara: ____, it was amazing!',
          options: ['By the way', 'Definitely', 'Meanwhile'],
          correctAnswer: 'Definitely',
        },
        {
          content: 'I will wait for you ____ you finish your work.',
          options: ['until', 'then', 'during'],
          correctAnswer: 'until',
        },
      ];

      const rowsToInsert = [];

      for (let index = 0; index < questions.length; index++) {
        const q = questions[index];

        const existingId = await queryInterface.rawSelect(
          'Questions',
          {
            where: { Content: q.content, PartID: partId },
            transaction,
          },
          ['ID']
        );

        if (existingId) continue;

        rowsToInsert.push({
          ID: uuidv4(),
          Type: 'multiple-choice',
          AudioKeys: null,
          ImageKeys: null,
          PartID: partId,
          Sequence: index + 1,
          Content: q.content,
          SubContent: null,
          GroupContent: null,
          // 👇 CHỈNH ĐIỂM NÀY: stringify AnswerContent
          AnswerContent: JSON.stringify({
            options: q.options,
            correctAnswer: q.correctAnswer,
          }),
          GroupID: null,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (rowsToInsert.length > 0) {
        await queryInterface.bulkInsert('Questions', rowsToInsert, {
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const skillId = await queryInterface.rawSelect(
      'Skills',
      { where: { Name: 'GRAMMAR AND VOCABULARY' } },
      ['ID']
    );
    if (!skillId) return;

    const partId = await queryInterface.rawSelect(
      'Parts',
      {
        where: {
          Content: 'Part 1: ...',
          SkillID: skillId,
        },
      },
      ['ID']
    );
    if (!partId) return;

    await queryInterface.bulkDelete(
      'Questions',
      {
        PartID: partId,
        Type: 'multiple-choice',
      },
      {}
    );
  },
};
