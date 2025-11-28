'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // 1) Lấy map SkillName -> SkillID
      const SKILL_NAMES = [
        'GRAMMAR AND VOCABULARY',
        'READING',
        'LISTENING',
        'WRITING',
        'SPEAKING',
      ];

      const skills = await queryInterface.sequelize.query(
        `
        SELECT "ID","Name"
        FROM "Skills"
        WHERE "Name" IN (:names);
        `,
        {
          replacements: { names: SKILL_NAMES },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      const skillMap = skills.reduce((acc, s) => {
        acc[s.Name] = s.ID;
        return acc;
      }, {});

      // Nếu thiếu skill nào thì báo lỗi sớm
      for (const name of SKILL_NAMES) {
        if (!skillMap[name]) {
          throw new Error(
            `Skill "${name}" chưa được seed. Hãy chạy seed skills trước.`
          );
        }
      }

      // 2) Khai báo khung Part đúng theo list bạn gửi

      const partsConfig = [
        // GRAMMAR & VOCABULARY
        {
          skillName: 'GRAMMAR AND VOCABULARY',
          content: 'Part 1: ...',
          subContent: null,
          sequence: 1,
        },
        {
          skillName: 'GRAMMAR AND VOCABULARY',
          content: 'Part 2: ...',
          subContent: null,
          sequence: 2,
        },

        // READING
        {
          skillName: 'READING',
          content:
            'Part 1 - Read the email from Ron to his assistant. Choose one word from the list for each gap. The first one is done for you.',
          subContent: null,
          sequence: 1,
        },
        {
          skillName: 'READING',
          content:
            'Part 2A: The sentences below are a story about a scientist. Put the sentences in the right order. The first sentence is done for you.',
          subContent: null,
          sequence: 2,
        },
        {
          skillName: 'READING',
          content:
            'Part 2B: The sentences below are from a fire instruction. Put the sentences in the right order. The first sentence is done for you.',
          subContent: null,
          sequence: 3,
        },
        {
          skillName: 'READING',
          content:
            'Part 3: Four people respond in the comments section of an online magazine article about watching a movie. Read the texts and then answer the questions below.',
          subContent: null,
          sequence: 4,
        },
        {
          skillName: 'READING',
          content:
            'Part 4 - Read the following passage quickly. Choose a heading for each numbered paragraph (1-7). There is one more heading than you need.',
          subContent: null,
          sequence: 5,
        },

        // LISTENING
        {
          skillName: 'LISTENING',
          content: 'PART 1: Information recognition (13 questions)',
          subContent: null,
          sequence: 1,
        },
        {
          skillName: 'LISTENING',
          content: 'PART 2: Information Matching (4 questions)',
          subContent: null,
          sequence: 2,
        },
        {
          skillName: 'LISTENING',
          // Trim khoảng trắng đầu dòng trong mẫu gốc " LISTENING\t PART 3: ..."
          content: 'PART 3: Opinion Matching (4 questions)',
          subContent: null,
          sequence: 3,
        },
        {
          skillName: 'LISTENING',
          content: 'PART 4: Inference (2 talks - 4 questions)',
          subContent: null,
          sequence: 4,
        },

        // WRITING
        {
          skillName: 'WRITING',
          content:
            'Part 1: You want to join the Fitness Club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
          subContent: null,
          sequence: 1,
        },
        {
          skillName: 'WRITING',
          content:
            'Part 2: You are a new member of the Fitness Club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.',
          subContent: null,
          sequence: 2,
        },
        {
          skillName: 'WRITING',
          content:
            'Part 3: You are a member of the Fitness Club. You are talking to other members in a chat room. Reply to their questions. Write in sentences. Use 30-40 words per answer. Recommended time: 10 minutes.',
          subContent: null,
          sequence: 3,
        },
        {
          skillName: 'WRITING',
          content:
            'Part 4: You are a member of the Fitness Club. You have received this email from the club manager.',
          subContent: null,
          sequence: 4,
        },

        // SPEAKING
        {
          skillName: 'SPEAKING',
          content: 'Part 1',
          subContent: null,
          sequence: 1,
        },
        {
          skillName: 'SPEAKING',
          content: 'Part 2',
          subContent: null,
          sequence: 2,
        },
        {
          skillName: 'SPEAKING',
          content: 'Part 3',
          subContent: null,
          sequence: 3,
        },
        {
          skillName: 'SPEAKING',
          content: 'Part 4',
          subContent: null,
          sequence: 4,
        },
      ];

      const partsToInsert = [];

      for (const p of partsConfig) {
        const skillId = skillMap[p.skillName];
        if (!skillId) continue;

        const existingId = await queryInterface.rawSelect(
          'Parts',
          {
            where: {
              Content: p.content,
              SkillID: skillId,
            },
            transaction,
          },
          ['ID']
        );

        if (!existingId) {
          partsToInsert.push({
            ID: uuidv4(),
            Content: p.content,
            SubContent: p.subContent || null,
            Sequence: p.sequence,
            SkillID: skillId,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      if (partsToInsert.length > 0) {
        await queryInterface.bulkInsert('Parts', partsToInsert, {
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
    // Xoá đúng các Part khung đã seed
    const partContents = [
      'Part 1: ...',
      'Part 2: ...',
      'Part 1 - Read the email from Ron to his assistant. Choose one word from the list for each gap. The first one is done for you.',
      'Part 2A: The sentences below are a story about a scientist. Put the sentences in the right order. The first sentence is done for you.',
      'Part 2B: The sentences below are from a fire instruction. Put the sentences in the right order. The first sentence is done for you.',
      'Part 3: Four people respond in the comments section of an online magazine article about watching a movie. Read the texts and then answer the questions below.',
      'Part 4 - Read the following passage quickly. Choose a heading for each numbered paragraph (1-7). There is one more heading than you need.',
      'PART 1: Information recognition (13 questions)',
      'PART 2: Information Matching (4 questions)',
      'PART 3: Opinion Matching (4 questions)',
      'PART 4: Inference (2 talks - 4 questions)',
      'Part 1: You want to join the Fitness Club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
      'Part 2: You are a new member of the Fitness Club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.',
      'Part 3: You are a member of the Fitness Club. You are talking to other members in a chat room. Reply to their questions. Write in sentences. Use 30-40 words per answer. Recommended time: 10 minutes.',
      'Part 4: You are a member of the Fitness Club. You have received this email from the club manager.',
      'Part 1',
      'Part 2',
      'Part 3',
      'Part 4',
    ];

    await queryInterface.bulkDelete('Parts', { Content: partContents }, {});
  },
};
