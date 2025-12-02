'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // Fetch all skills
      const skillRows = await queryInterface.sequelize.query(
        `SELECT "ID","Name" FROM "Skills"`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      const getSkillID = (name) => {
        const found = skillRows.find((s) => s.Name === name);
        if (!found) throw new Error('Skill not found: ' + name);
        return found.ID;
      };

      // Define all parts
      const PARTS = [
        // GRAMMAR & VOCABULARY
        {
          Content: 'Part 1',
          SubContent: 'Information recognition (13 questions)',
          Skill: 'GRAMMAR AND VOCABULARY',
          Sequence: 1,
        },
        {
          Content: 'Part 2',
          SubContent: 'VOCABULARY (Question 26–30: 25 questions)',
          Skill: 'GRAMMAR AND VOCABULARY',
          Sequence: 2,
        },

        // READING
        {
          Content:
            'Part 1 - Read the email from Ron to his assistant. Choose one word from the list for each gap. The first one is done for you.',
          SubContent: '',
          Skill: 'READING',
          Sequence: 1,
        },
        {
          Content:
            'Part 2A: The sentences below are a story about a scientist. Put the sentences in the right order. The first sentence is done for you.',
          SubContent: 'The sentences below are a story about a scientist.',
          Skill: 'READING',
          Sequence: 2,
        },
        {
          Content:
            'Part 2B: The sentences below are from a fire instruction. Put the sentences in the right order. The first sentence is done for you.',
          SubContent: 'The sentences below are from a fire instruction.',
          Skill: 'READING',
          Sequence: 3,
        },
        {
          Content:
            'Part 3: Four people respond in the comments section of an online magazine article about watching a movie. Read the texts and then answer the questions below.',
          SubContent: 'Four people respond in the comments section.',
          Skill: 'READING',
          Sequence: 4,
        },
        {
          Content:
            'Part 4 - Read the following passage quickly. Choose a heading for each numbered paragraph (1-7). There is one more heading than you need.',
          SubContent: 'Choose a heading for each numbered paragraph (1–7).',
          Skill: 'READING',
          Sequence: 5,
        },

        // LISTENING
        {
          Content: 'PART 1: Information recognition (13 questions)',
          SubContent: '(13 questions)',
          Skill: 'LISTENING',
          Sequence: 1,
        },
        {
          Content: 'PART 2: Information Matching (4 questions)',
          SubContent: '(4 questions)',
          Skill: 'LISTENING',
          Sequence: 2,
        },
        {
          Content: 'PART 3: Opinion Matching (4 questions)',
          SubContent: '(4 questions)',
          Skill: 'LISTENING',
          Sequence: 3,
        },
        {
          Content: 'PART 4: Inference (2 talks - 4 questions)',
          SubContent: '(2 talks – 4 questions)',
          Skill: 'LISTENING',
          Sequence: 4,
        },

        // WRITING
        {
          Content:
            'Part 1: You want to join the Fitness Club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
          SubContent: null,
          Skill: 'WRITING',
          Sequence: 1,
        },
        {
          Content:
            'Part 2: You are a new member of the Fitness Club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.',
          SubContent: null,
          Skill: 'WRITING',
          Sequence: 2,
        },
        {
          Content:
            'Part 3: You are a member of the Fitness Club. You are talking to other members in a chat room. Reply to their questions. Write in sentences. Use 30-40 words per answer. Recommended time: 10 minutes.',
          SubContent: null,
          Skill: 'WRITING',
          Sequence: 3,
        },
        {
          Content:
            'Part 4: You are a member of the Fitness Club. You have received this email from the club manager. ',
          SubContent: `Dear Member,
Because of personal reasons, the instructor will be away for the next two weeks. We will use our facilities by ourselves without the assistance of an instructor. I am so sorry about this situation and hope you doing well in next two weeks.
The Manager`,
          Skill: 'WRITING',
          Sequence: 4,
        },

        // SPEAKING
        {
          Content: 'Part 1',
          SubContent: 'Short Q&A',
          Skill: 'SPEAKING',
          Sequence: 1,
        },
        {
          Content: 'Part 2',
          SubContent: 'Describe the picture',
          Skill: 'SPEAKING',
          Sequence: 2,
        },
        {
          Content: 'Part 3',
          SubContent: 'Describe & compare pictures',
          Skill: 'SPEAKING',
          Sequence: 3,
        },
        {
          Content: 'Part 4',
          SubContent: 'Opinion questions',
          Skill: 'SPEAKING',
          Sequence: 4,
        },
      ];

      // Fetch existing Parts
      const existingParts = await queryInterface.sequelize.query(
        `SELECT "ID","Content","SkillID" FROM "Parts"`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      const existingMap = new Map(
        existingParts.map((p) => [`${p.Content}_${p.SkillID}`, p.ID])
      );

      const upsertRows = [];

      for (const p of PARTS) {
        const skillID = getSkillID(p.Skill);
        const key = `${p.Content}_${skillID}`;

        // If exists → UPDATE
        if (existingMap.has(key)) {
          await queryInterface.bulkUpdate(
            'Parts',
            {
              SubContent: p.SubContent,
              Sequence: p.Sequence,
              updatedAt: now,
            },
            { ID: existingMap.get(key) },
            { transaction: t }
          );
        } else {
          // If not exists → INSERT
          upsertRows.push({
            ID: uuidv4(),
            SkillID: skillID,
            Content: p.Content,
            SubContent: p.SubContent,
            Sequence: p.Sequence,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      if (upsertRows.length > 0) {
        await queryInterface.bulkInsert('Parts', upsertRows, {
          transaction: t,
        });
      }

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Xoá theo Content giống đúng những gì đã khai báo trong PARTS ở up()
    const CONTENTS = [
      // GRAMMAR & VOCABULARY
      'Part 1',
      'Part 2',

      // READING
      'Part 1 - Read the email from Ron to his assistant. Choose one word from the list for each gap. The first one is done for you.',
      'Part 2A: The sentences below are a story about a scientist. Put the sentences in the right order. The first sentence is done for you.',
      'Part 2B: The sentences below are from a fire instruction. Put the sentences in the right order. The first sentence is done for you.',
      'Part 3: Four people respond in the comments section of an online magazine article about watching a movie. Read the texts and then answer the questions below.',
      'Part 4 - Read the following passage quickly. Choose a heading for each numbered paragraph (1-7). There is one more heading than you need.',

      // LISTENING
      'PART 1: Information recognition (13 questions)',
      'PART 2: Information Matching (4 questions)',
      'PART 3: Opinion Matching (4 questions)',
      'PART 4: Inference (2 talks - 4 questions)',

      // WRITING
      'Part 1: You want to join the Fitness Club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
      'Part 2: You are a new member of the Fitness Club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.',
      'Part 3: You are a member of the Fitness Club. You are talking to other members in a chat room. Reply to their questions. Write in sentences. Use 30-40 words per answer. Recommended time: 10 minutes.',
      'Part 4: You are a member of the Fitness Club. You have received this email from the club manager. ',

      // SPEAKING
      'Part 1',
      'Short Q&A',
      'Part 2',
      'Describe the picture',
      'Part 3',
      'Describe & compare pictures',
      'Part 4',
      'Opinion questions',
    ];

    await queryInterface.bulkDelete(
      'Parts',
      {
        Content: CONTENTS,
      },
      {}
    );
  },
};
