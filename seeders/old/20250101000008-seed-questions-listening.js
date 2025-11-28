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
        { where: { Name: 'LISTENING' }, transaction: tx },
        ['ID']
      );

      if (!skillId) {
        throw new Error(
          'Skill "LISTENING" chưa được seed. Hãy chạy seed skills trước.'
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
            `Part "${content}" cho skill LISTENING chưa được seed. Hãy chạy 20250101000004-seed-parts-base trước.`
          );
        }
        return id;
      }

      const part1 = await getPartId(
        'PART 1: Information recognition (13 questions)'
      );
      const part2 = await getPartId(
        'PART 2: Information Matching (4 questions)'
      );
      const part3 = await getPartId('PART 3: Opinion Matching (4 questions)');
      const part4 = await getPartId(
        'PART 4: Inference (2 talks - 4 questions)'
      );

      const questions = [
        // PART 1: information recognition – multiple-choice
        {
          type: 'multiple-choice',
          partId: part1,
          content:
            'A mother is calling her son to remind him about picking up groceries. How much is an egg?',
          groupContent: {
            title:
              'A mother is calling her son to remind him about picking up groceries.',
          },
          options: ['£1.50', '£2.50', '£3.50'],
          correctAnswer: '£1.50',
          audioKeys: 'audio/listening/part1/q1.mp3',
          sequence: 1,
        },
        {
          type: 'multiple-choice',
          partId: part1,
          content:
            'An author is talking about her daily routine. When does she usually write?',
          groupContent: {
            title: 'An author is talking about her daily routine.',
          },
          options: ['In the mornings', 'In the afternoons', 'In the evenings'],
          correctAnswer: 'In the afternoons',
          audioKeys: 'audio/listening/part1/q2.mp3',
          sequence: 2,
        },

        // PART 2: information matching
        {
          type: 'matching',
          partId: part2,
          content:
            'You will hear four people talking about their favourite free-time activities. Match each speaker with an activity.',
          answerContent: {
            leftItems: ['Speaker 1', 'Speaker 2', 'Speaker 3', 'Speaker 4'],
            rightItems: [
              'Playing football',
              'Watching films',
              'Cooking',
              'Reading comics',
              'Going shopping',
            ],
            correctAnswer: [
              { left: 'Speaker 1', right: 'Cooking' },
              { left: 'Speaker 2', right: 'Watching films' },
              { left: 'Speaker 3', right: 'Playing football' },
              { left: 'Speaker 4', right: 'Reading comics' },
            ],
          },
          audioKeys: 'audio/listening/part2/info-matching.mp3',
          sequence: 14,
        },

        // PART 3: opinion matching
        {
          type: 'matching',
          partId: part3,
          content:
            'You will hear four people talking about their opinions on online learning. Match each speaker with the opinion that best describes what they say.',
          answerContent: {
            leftItems: ['Speaker A', 'Speaker B', 'Speaker C', 'Speaker D'],
            rightItems: [
              'Online learning is more flexible.',
              'Online learning is too impersonal.',
              'Online learning is cheaper.',
              'Online learning is more effective than classroom learning.',
              'Online learning is only good for some subjects.',
            ],
            correctAnswer: [
              { left: 'Speaker A', right: 'Online learning is more flexible.' },
              {
                left: 'Speaker B',
                right: 'Online learning is too impersonal.',
              },
              { left: 'Speaker C', right: 'Online learning is cheaper.' },
              {
                left: 'Speaker D',
                right:
                  'Online learning is more effective than classroom learning.',
              },
            ],
          },
          audioKeys: 'audio/listening/part3/opinion-matching.mp3',
          sequence: 18,
        },

        // PART 4: inference – multiple-choice (2 talks, 4 questions)
        {
          type: 'multiple-choice',
          partId: part4,
          content:
            'You will hear a man talking about his new job. Why did he decide to change his career?',
          options: [
            'Because he wanted to earn more money.',
            'Because he wanted a better work–life balance.',
            'Because he wanted to move to another country.',
          ],
          correctAnswer: 'Because he wanted a better work–life balance.',
          audioKeys: 'audio/listening/part4/talk1-q1.mp3',
          sequence: 22,
        },
        {
          type: 'multiple-choice',
          partId: part4,
          content:
            'You will hear a woman talking about a holiday. Why did she decide not to return to the same place?',
          options: [
            'Because the hotel was too expensive.',
            'Because the weather was bad.',
            'Because the town was too crowded.',
          ],
          correctAnswer: 'Because the town was too crowded.',
          audioKeys: 'audio/listening/part4/talk2-q1.mp3',
          sequence: 23,
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
          AudioKeys: q.audioKeys || null,
          ImageKeys: null,
          PartID: q.partId,
          Sequence: q.sequence,
          Content: q.content,
          SubContent: null,
          GroupContent: JSON.stringify(q.groupContent) || null,
          AnswerContent: q.answerContent
            ? JSON.stringify(q.answerContent)
            : q.options
            ? JSON.stringify({
                options: q.options,
                correctAnswer: q.correctAnswer,
              })
            : null,
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
      { where: { Name: 'LISTENING' } },
      ['ID']
    );
    if (!skillId) return;

    const partContents = [
      'PART 1: Information recognition (13 questions)',
      'PART 2: Information Matching (4 questions)',
      'PART 3: Opinion Matching (4 questions)',
      'PART 4: Inference (2 talks - 4 questions)',
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
