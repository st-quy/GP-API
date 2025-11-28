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
        { where: { Name: 'READING' }, transaction: tx },
        ['ID']
      );

      if (!skillId) {
        throw new Error(
          'Skill "READING" chưa được seed. Hãy chạy seed skills trước.'
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
            `Part "${content}" cho skill READING chưa được seed. Hãy chạy 20250101000004-seed-parts-base trước.`
          );
        }
        return id;
      }

      const part1 = await getPartId(
        'Part 1 - Read the email from Ron to his assistant. Choose one word from the list for each gap. The first one is done for you.'
      );
      const part2A = await getPartId(
        'Part 2A: The sentences below are a story about a scientist. Put the sentences in the right order. The first sentence is done for you.'
      );
      const part2B = await getPartId(
        'Part 2B: The sentences below are from a fire instruction. Put the sentences in the right order. The first sentence is done for you.'
      );
      const part3 = await getPartId(
        'Part 3: Four people respond in the comments section of an online magazine article about watching a movie. Read the texts and then answer the questions below.'
      );
      const part4 = await getPartId(
        'Part 4 - Read the following passage quickly. Choose a heading for each numbered paragraph (1-7). There is one more heading than you need.'
      );

      const questions = [
        // Part 1 – dropdown-list (gapped text)
        {
          type: 'dropdown-list',
          partId: part1,
          content:
            'Read the email from Ron to his assistant. Choose one word from the list for each gap. The first one is done for you.',
          answerContent: {
            mode: 'dropdown-list',
            options: [
              { key: '1', value: ['next', 'last', 'first'] },
              { key: '2', value: ['check', 'call', 'meet'] },
              { key: '3', value: ['airport', 'hotel', 'office'] },
              { key: '4', value: ['before', 'after', 'during'] },
              { key: '5', value: ['report', 'presentation', 'note'] },
            ],
            correctAnswer: [
              { key: '1', value: 'next' },
              { key: '2', value: 'check' },
              { key: '3', value: 'hotel' },
              { key: '4', value: 'before' },
              { key: '5', value: 'presentation' },
            ],
          },
          sequence: 1,
        },

        // Part 2A – ordering story
        {
          type: 'ordering',
          partId: part2A,
          content:
            'The sentences below are a story about a scientist. Put the sentences in the right order.',
          answerContent: {
            mode: 'ordering',
            options: [
              'He decided to study chemistry at university.',
              'When he was a child, he loved doing experiments in the kitchen.',
              'After many years of research, he discovered a new material.',
              'The discovery helped to create safer car tyres.',
              'He received a major science prize for his work.',
            ],
            correctAnswer: [
              {
                key: 'When he was a child, he loved doing experiments in the kitchen.',
                value: 1,
              },
              {
                key: 'He decided to study chemistry at university.',
                value: 2,
              },
              {
                key: 'After many years of research, he discovered a new material.',
                value: 3,
              },
              {
                key: 'The discovery helped to create safer car tyres.',
                value: 4,
              },
              {
                key: 'He received a major science prize for his work.',
                value: 5,
              },
            ],
          },
          sequence: 2,
        },

        // Part 2B – ordering fire instruction
        {
          type: 'ordering',
          partId: part2B,
          content:
            'The sentences below are from a fire instruction. Put the sentences in the right order.',
          answerContent: {
            mode: 'ordering',
            options: [
              'Leave the building immediately by the nearest exit.',
              'If you see smoke or fire, break the glass and push the alarm button.',
              'Do not use the lift.',
              'Go to the assembly point outside the main gate.',
              'Wait for instructions from the safety officer.',
            ],
            correctAnswer: [
              {
                key: 'If you see smoke or fire, break the glass and push the alarm button.',
                value: 1,
              },
              {
                key: 'Leave the building immediately by the nearest exit.',
                value: 2,
              },
              {
                key: 'Do not use the lift.',
                value: 3,
              },
              {
                key: 'Go to the assembly point outside the main gate.',
                value: 4,
              },
              {
                key: 'Wait for instructions from the safety officer.',
                value: 5,
              },
            ],
          },
          sequence: 3,
        },

        // Part 3 – reading MC (short texts & questions)
        {
          type: 'reading-mc',
          partId: part3,
          content:
            'Four people respond in the comments section of an online magazine article about watching a movie.',
          answerContent: {
            mode: 'multiple-choice',
            items: [
              {
                question:
                  'Who says they prefer watching movies at home rather than in the cinema?',
                options: ['Alex', 'Brenda', 'Carl'],
                correctAnswer: 'Brenda',
              },
              {
                question:
                  'Who thinks that watching films with friends is more fun?',
                options: ['Alex', 'Brenda', 'Carl'],
                correctAnswer: 'Alex',
              },
            ],
          },
          sequence: 4,
        },

        // Part 4 – heading matching
        {
          type: 'heading-matching',
          partId: part4,
          content:
            'Read the following passage quickly. Choose a heading for each numbered paragraph (1-7).',
          answerContent: {
            mode: 'heading-matching',
            headings: [
              'A new beginning',
              'The importance of planning',
              'Working with others',
              'The first problems',
              'A surprising solution',
              'Lessons learned',
              'A difficult decision',
              'The final result',
            ],
            correctAnswer: [
              { paragraph: 1, heading: 'A new beginning' },
              { paragraph: 2, heading: 'The first problems' },
              { paragraph: 3, heading: 'The importance of planning' },
              { paragraph: 4, heading: 'Working with others' },
              { paragraph: 5, heading: 'A surprising solution' },
              { paragraph: 6, heading: 'A difficult decision' },
              { paragraph: 7, heading: 'The final result' },
            ],
          },
          sequence: 5,
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
          ImageKeys: null,
          PartID: q.partId,
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
      { where: { Name: 'READING' } },
      ['ID']
    );
    if (!skillId) return;

    const partContents = [
      'Part 1 - Read the email from Ron to his assistant. Choose one word from the list for each gap. The first one is done for you.',
      'Part 2A: The sentences below are a story about a scientist. Put the sentences in the right order. The first sentence is done for you.',
      'Part 2B: The sentences below are from a fire instruction. Put the sentences in the right order. The first sentence is done for you.',
      'Part 3: Four people respond in the comments section of an online magazine article about watching a movie. Read the texts and then answer the questions below.',
      'Part 4 - Read the following passage quickly. Choose a heading for each numbered paragraph (1-7). There is one more heading than you need.',
    ];

    const partIds = [];
    for (const content of partContents) {
      const id = await queryInterface.rawSelect(
        'Parts',
        { where: { Content: content, SkillID: skillId } },
        ['ID']
      );
      if (id) partIds.push(id);
    }

    if (!partIds.length) return;

    await queryInterface.bulkDelete(
      'Questions',
      { PartID: { [Sequelize.Op.in]: partIds } },
      {}
    );
  },
};
