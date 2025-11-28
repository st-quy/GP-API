'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // ---------------------------------------------
      // 1) Fetch Part IDs
      // ---------------------------------------------
      const partRows = await queryInterface.sequelize.query(
        `
        SELECT "ID","Content"
        FROM "Parts"
        WHERE "Content" IN ('GV_P1_InfoRecognition','GV_P2_Vocab');
        `,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      if (partRows.length < 2) {
        throw new Error('Parts for GRAMMAR not found. Run FILE 1 first.');
      }

      const getPart = (content) => {
        const found = partRows.find((p) => p.Content === content);
        if (!found) throw new Error('Missing Part: ' + content);
        return found.ID;
      };

      const PART1 = getPart('GV_P1_InfoRecognition');
      const PART2 = getPart('GV_P2_Vocab');

      // ---------------------------------------------
      // 2) Fetch existing questions to avoid duplicates
      // ---------------------------------------------
      const existing = await queryInterface.sequelize.query(
        `
        SELECT "PartID","Sequence"
        FROM "Questions"
        WHERE "PartID" IN (:partIDs)
        `,
        {
          replacements: { partIDs: [PART1, PART2] },
          type: Sequelize.QueryTypes.SELECT,
          transaction: t,
        }
      );

      const existsSet = new Set(
        existing.map((q) => `${q.PartID}_${q.Sequence}`)
      );

      const questions = [];

      // -------------------------
      // PART 1 — Multiple Choice
      // -------------------------
      const P1_DATA = [
        {
          seq: 1,
          content: 'I wish I ____ a better grade on the test.',
          options: `A. got\nB. would get\nC. had gotten`,
          correct: 'C',
        },
        {
          seq: 2,
          content: 'I have ____ apples in my bag.',
          options: `A. a little\nB. a few\nC. much`,
          correct: 'B',
        },
        {
          seq: 3,
          content: 'I am going ____ the park.',
          options: `A. to\nB. on\nC. in`,
          correct: 'A',
        },
        {
          seq: 4,
          content: 'I ____ my homework every day.',
          options: `A. do\nB. does\nC. am doing`,
          correct: 'A',
        },
        {
          seq: 5,
          content: 'If I ____ enough money, I would buy a new car.',
          options: `A. have\nB. had\nC. will have`,
          correct: 'B',
        },
        {
          seq: 6,
          content: 'I ____ go to the party if I finish my work on time.',
          options: `A. shall\nB. could\nC. should`,
          correct: 'A',
        },
        {
          seq: 7,
          content: 'I ____ play basketball when I was younger.',
          options: `A. used to\nB. would\nC. should have`,
          correct: 'A',
        },
        {
          seq: 8,
          content: 'The teacher asked the students ____ their homework.',
          options: `A. to\nB. doing\nC. to do`,
          correct: 'C',
        },
        {
          seq: 9,
          content: '____ I am tired, I will still go to the gym.',
          options: `A. Although\nB. Therefore\nC. On the other hand`,
          correct: 'A',
        },
        {
          seq: 10,
          content:
            'Anna: Did you enjoy the concert?\nSara: ____, it was amazing!',
          options: `A. By the way\nB. Definitely\nC. Meanwhile`,
          correct: 'B',
        },
        {
          seq: 11,
          content: 'I will wait for you ____ you finish your work.',
          options: `A. until\nB. then\nC. during`,
          correct: 'A',
        },
        {
          seq: 12,
          content: 'I ____ have gone to the concert if I had known.',
          options: `A. would\nB. should\nC. must`,
          correct: 'A',
        },
        {
          seq: 13,
          content: 'I ____ to finish homework before TV.',
          options: `A. should\nB. must\nC. have`,
          correct: 'C',
        },
        {
          seq: 14,
          content: 'I ____ my laundry right now.',
          options: `A. am doing\nB. am going to do\nC. will do`,
          correct: 'A',
        },
        {
          seq: 15,
          content: 'I go to the store ____ buy groceries.',
          options: `A. for\nB. that\nC. to`,
          correct: 'C',
        },
        {
          seq: 16,
          content: 'Peter: What time?\nMary: ____, I forgot my watch.',
          options: `A. Luckily\nB. Unfortunately\nC. Absolutely`,
          correct: 'B',
        },
        {
          seq: 17,
          content: 'I ____ my laundry for two hours when you called.',
          options: `A. was doing\nB. have been doing\nC. had been doing`,
          correct: 'A',
        },
        {
          seq: 18,
          content: 'I ____ have taken my umbrella if I had known.',
          options: `A. should\nB. must\nC. have to`,
          correct: 'A',
        },
        {
          seq: 19,
          content: 'I will meet you ____ the park.',
          options: `A. on\nB. in\nC. at`,
          correct: 'C',
        },
        {
          seq: 20,
          content: 'How often do you ____ to the gym?',
          options: `A. go\nB. goes\nC. going`,
          correct: 'A',
        },
        {
          seq: 21,
          content: 'I ____ homework before bed yesterday.',
          options: `A. had finished\nB. have finished\nC. has finished`,
          correct: 'A',
        },
        {
          seq: 22,
          content: 'I ____ my housework every Saturday.',
          options: `A. do\nB. does\nC. am doing`,
          correct: 'A',
        },
        {
          seq: 23,
          content: 'You ____ have brought an umbrella.',
          options: `A. shouldn't\nB. needn't\nC. mustn't`,
          correct: 'B',
        },
        {
          seq: 24,
          content: 'Lan’s mother is ____ than Nga’s mother.',
          options: `A. taller\nB. more tall\nC. more taller`,
          correct: 'A',
        },
        {
          seq: 25,
          content: "If you hadn't arrived late, she ____ married now.",
          options: `A. wouldn't get\nB. would have got\nC. hadn't got`,
          correct: 'A',
        },
      ];

      for (const q of P1_DATA) {
        if (existsSet.has(`${PART1}_${q.seq}`)) continue;

        questions.push({
          ID: uuidv4(),
          Type: 'multiple-choice',
          AudioKeys: null,
          ImageKeys: null,
          PartID: PART1,
          Sequence: q.seq,
          Content: q.content,
          SubContent: null,
          GroupContent: null,
          AnswerContent: JSON.stringify({
            title: q.content,
            options: q.options.split('\n').map((line) => ({
              key: line.trim().split('.')[0],
              value: line.trim().split('.')[1].trim(),
            })),
            correctAnswer: q.options
              .split('\n')
              .find((line) => line.startsWith(q.correct))
              .split('.')[1]
              .trim(),
          }),
          createdAt: now,
          updatedAt: now,
        });
      }

      // -------------------------
      // PART 2 — Matching
      // -------------------------
      const P2_DATA = [
        {
          seq: 26,
          content:
            'Select a word from the list that has the most similar meaning.',
          left: [
            '1. complain',
            '2. copy',
            '3. cut',
            '4. defeat',
            '5. disagree',
          ],
          right: [
            'slice',
            'praise',
            'hoard',
            'conquer',
            'object',
            'ask',
            'duplicate',
            'approve',
            'argue',
            'follow',
          ],
          correct: [
            { left: '1. complain', right: 'object' },
            { left: '2. copy', right: 'duplicate' },
            { left: '3. cut', right: 'slice' },
            { left: '4. defeat', right: 'conquer' },
            { left: '5. disagree', right: 'argue' },
          ],
        },

        // (giữ nguyên 27 → 30 như file của bạn)
        {
          seq: 27,
          content: 'Complete each definition using a word from the list.',
          left: [
            '1. To place in the ground, cover up or hide is to',
            '2. To smash or split is to',
            '3. To raise or push something higher is to',
            '4. To brag about oneself is to',
            '5. To declare someone else responsible for a fault is to',
          ],
          right: [
            'buy',
            'bury',
            'boast',
            'blur',
            'blame',
            'bother',
            'book',
            'boost',
            'break',
            'bear',
          ],
          correct: [
            {
              left: '1. To place in the ground, cover up or hide is to',
              right: 'bury',
            },
            { left: '2. To smash or split is to', right: 'break' },
            {
              left: '3. To raise or push something higher is to',
              right: 'boost',
            },
            { left: '4. To brag about oneself is to', right: 'boast' },
            {
              left: '5. To declare someone else responsible for a fault is to',
              right: 'blame',
            },
          ],
        },

        {
          seq: 28,
          content: 'Complete each sentence using a word from the list.',
          left: [
            "1. The witness's testimony was _____ ...",
            '2. The artist was known for her _____ ...',
            '3. She was a _____ nurse ...',
            '4. The garden was _____ ...',
            '5. He was able to explain the concept ...',
          ],
          right: [
            'cultivated',
            'complex',
            'capable',
            'concise',
            'compassionate',
            'comfortable',
            'confident',
            'creative',
            'careless',
            'credible',
          ],
          correct: [
            {
              left: "1. The witness's testimony was _____ ...",
              right: 'credible',
            },
            {
              left: '2. The artist was known for her _____ ...',
              right: 'creative',
            },
            { left: '3. She was a _____ nurse ...', right: 'compassionate' },
            { left: '4. The garden was _____ ...', right: 'cultivated' },
            {
              left: '5. He was able to explain the concept ...',
              right: 'concise',
            },
          ],
        },

        {
          seq: 29,
          content:
            'Select a word from the list that has the most similar meaning.',
          left: [
            '1. shore',
            '2. beginner',
            '3. child',
            '4. competition',
            '5. hatred',
          ],
          right: [
            'expert',
            'adult',
            'bravery',
            'coast',
            'disgust',
            'contest',
            'liking',
            'learner',
            'toddler',
            'courage',
          ],
          correct: [
            { left: '1. shore', right: 'coast' },
            { left: '2. beginner', right: 'learner' },
            { left: '3. child', right: 'toddler' },
            { left: '4. competition', right: 'contest' },
            { left: '5. hatred', right: 'disgust' },
          ],
        },

        {
          seq: 30,
          content: 'Select a word that is most often used with the following.',
          left: [
            'action +',
            'black +',
            'baggage +',
            'convenience +',
            'driving +',
          ],
          right: [
            'fire',
            'manner',
            'store',
            'license',
            'claim',
            'list',
            'promise',
            'home',
            'interest',
            'movie',
          ],
          correct: [
            { left: 'action +', right: 'movie' },
            { left: 'black +', right: 'list' },
            { left: 'baggage +', right: 'claim' },
            { left: 'convenience +', right: 'store' },
            { left: 'driving +', right: 'license' },
          ],
        },
      ];

      for (const q of P2_DATA) {
        if (existsSet.has(`${PART2}_${q.seq}`)) continue;

        questions.push({
          ID: uuidv4(),
          Type: 'matching',
          AudioKeys: null,
          ImageKeys: null,
          PartID: PART2,
          Sequence: q.seq,
          Content: q.content,
          SubContent: null,
          GroupContent: null,
          AnswerContent: JSON.stringify({
            content: q.content,
            leftItems: q.left,
            rightItems: q.right,
            correctAnswer: q.correct,
          }),
          createdAt: now,
          updatedAt: now,
        });
      }

      // --------------------------------
      // INSERT ALL QUESTIONS (non-duplicate only)
      // --------------------------------
      if (questions.length > 0) {
        await queryInterface.bulkInsert('Questions', questions, {
          transaction: t,
        });
      }

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Questions', {
      Type: ['multiple-choice', 'matching'],
    });
  },
};
