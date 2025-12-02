'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // 1) Skill GRAMMAR AND VOCABULARY
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

      // 2) Part "Part 2: ..." thuộc skill này
      const partContent = 'Part 2: ...';

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

      // 3) Một số câu matching mẫu
      const questions = [
        {
          content:
            'Select a word from the list that has the most similar meaning to the following words.',
          answerContent: {
            title:
              'Select a word from the list that has the most similar meaning to the following words.',
            subTitle: 'Example: big - large',
            leftItems: ['complain', 'copy', 'cut', 'defeat', 'disagree'],
            rightItems: [
              'slice',
              'ask',
              'praise',
              'duplicate',
              'hoard',
              'approve',
              'conquer',
              'argue',
              'object',
              'follow',
            ],
            correctAnswer: [
              { left: 'complain', right: 'object' },
              { left: 'copy', right: 'duplicate' },
              { left: 'cut', right: 'slice' },
              { left: 'defeat', right: 'conquer' },
              { left: 'disagree', right: 'argue' },
            ],
          },
          sequence: 26,
        },
        {
          content: 'Complete each definition using a word from the list.',
          answerContent: {
            leftItems: [
              'To place in the ground, cover up or hide is to',
              'To smash, split or fracture is to',
              'To raise, push higher or promote is to',
              'To show off about oneself is to',
              'To declare someone else responsible for a fault is to',
            ],
            rightItems: [
              'buy',
              'bother',
              'bury',
              'book',
              'boast',
              'boost',
              'blur',
              'break',
              'blame',
              'bear',
            ],
            correctAnswer: [
              {
                left: 'To place in the ground, cover up or hide is to',
                right: 'bury',
              },
              { left: 'To smash, split or fracture is to', right: 'break' },
              {
                left: 'To raise, push higher or promote is to',
                right: 'boost',
              },
              { left: 'To show off about oneself is to', right: 'boast' },
              {
                left: 'To declare someone else responsible for a fault is to',
                right: 'blame',
              },
            ],
          },
          sequence: 27,
        },
      ];

      const rowsToInsert = [];

      for (const q of questions) {
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
          Type: 'matching',
          AudioKeys: null,
          ImageKeys: null,
          PartID: partId,
          Sequence: q.sequence,
          Content: q.content,
          SubContent: null,
          GroupContent: null,
          AnswerContent: JSON.stringify(q.answerContent),
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
    } catch (err) {
      await transaction.rollback();
      throw err;
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
          Content: 'Part 2: ...',
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
        Type: 'matching',
      },
      {}
    );
  },
};
