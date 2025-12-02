'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // ---------------------------------------------------------------------
      // 1) Lấy toàn bộ Part WRITING
      // ---------------------------------------------------------------------
      const partRows = await queryInterface.sequelize.query(
        `
        SELECT "ID", "Content", "SubContent"
        FROM "Parts"
        WHERE "SkillID" = (
          SELECT "ID" FROM "Skills" WHERE "Name" = 'WRITING'
        );
        `,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      if (!partRows || partRows.length === 0) {
        throw new Error(
          '❌ No WRITING parts found. Run FILE 1 & FILE 2 first.'
        );
      }

      const findPart = (content) => {
        const row = partRows.find((p) => p.Content === content);
        if (!row) throw new Error(`❌ WRITING Part not found: ${content}`);
        return row.ID;
      };

      // ---------------------------------------------------------------------
      // 2) TOÀN BỘ WRITING — GIỮ NGUYÊN GỐC
      // ---------------------------------------------------------------------
      const DATA = [
        // WRITING — PART 1
        {
          PartContent:
            'Part 1: You want to join the Fitness Club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
          Sequence: 1,
          Content: 'Where are you from?',
          SubContent: null,
        },
        {
          PartContent:
            'Part 1: You want to join the Fitness Club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
          Sequence: 2,
          Content: 'What’s the weather like today?',
          SubContent: null,
        },
        {
          PartContent:
            'Part 1: You want to join the Fitness Club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
          Sequence: 3,
          Content: 'What do you do in your free time?',
          SubContent: null,
        },
        {
          PartContent:
            'Part 1: You want to join the Fitness Club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
          Sequence: 4,
          Content: 'What is your first language?',
          SubContent: null,
        },
        {
          PartContent:
            'Part 1: You want to join the Fitness Club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
          Sequence: 5,
          Content: 'Who do you usually go to the movies with?',
          SubContent: null,
        },

        // WRITING — PART 2
        {
          PartContent:
            'Part 2: You are a new member of the Fitness Club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.',
          Sequence: 1,
          Content:
            'Please tell us the classes you want to take and what times and days are suitable for you.',
          SubContent: '',
        },

        // WRITING — PART 3
        {
          PartContent:
            'Part 3: You are a member of the Fitness Club. You are talking to other members in a chat room. Reply to their questions. Write in sentences. Use 30-40 words per answer. Recommended time: 10 minutes.',
          Sequence: 1,
          Content:
            'Ben: Hi! Welcome to the club. How did you hear about the club?',
          SubContent: '',
        },
        {
          PartContent:
            'Part 3: You are a member of the Fitness Club. You are talking to other members in a chat room. Reply to their questions. Write in sentences. Use 30-40 words per answer. Recommended time: 10 minutes.',
          Sequence: 2,
          Content:
            'Quinn: Hi! I really hope my body can be fit. What do you hope to achieve by joining the club?',
          SubContent: '',
        },
        {
          PartContent:
            'Part 3: You are a member of the Fitness Club. You are talking to other members in a chat room. Reply to their questions. Write in sentences. Use 30-40 words per answer. Recommended time: 10 minutes.',
          Sequence: 3,
          Content:
            'Chris: What do you think of the fitness club facilities? Should we change anything?',
          SubContent: '',
        },

        // WRITING — PART 4
        {
          PartContent:
            'Part 4: You are a member of the Fitness Club. You have received this email from the club manager. ',
          Sequence: 10,
          Content:
            'Write an email to your friend who is also a member of the club. Write about your feelings and opinions on the situation. Write about 50 words. Recommended time: 10 minutes',
          SubContent:
            '* (You’re allowed to write up to 75 words without affecting your grade).',
        },
        {
          PartContent:
            'Part 4: You are a member of the Fitness Club. You have received this email from the club manager. ',
          Sequence: 11,
          Content:
            'Write an email to the manager of the club. Write about your feelings and opinions on the situation. Write about 120-150 words. Recommended time: 20 minutes.',
          SubContent:
            '* (You’re allowed to write up to 225 words without affecting your grade).',
        },
      ];

      // ---------------------------------------------------------------------
      // 3) Lấy danh sách câu WRITING hiện có để anti-duplicate
      // ---------------------------------------------------------------------
      const existing = await queryInterface.sequelize.query(
        `SELECT "PartID","Sequence" FROM "Questions" WHERE "Type" = 'writing'`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      const existSet = new Set(
        existing.map((e) => `${e.PartID}__${e.Sequence}`)
      );

      // ---------------------------------------------------------------------
      // 4) Build rows để insert (skip duplicate)
      // ---------------------------------------------------------------------
      const insertRows = [];

      for (const q of DATA) {
        const partID = findPart(q.PartContent, q.SubContent);
        const key = `${partID}__${q.Sequence}`;

        if (existSet.has(key)) {
          console.log(
            `⚠️ Skip duplicate WRITING: ${q.PartContent} - Seq ${q.Sequence}`
          );
          continue;
        }

        insertRows.push({
          ID: uuidv4(),
          Type: 'writing',
          AudioKeys: null,
          ImageKeys: null,
          PartID: partID,
          Sequence: q.Sequence,
          Content: q.Content,
          SubContent: q.SubContent,
          GroupContent: null,
          AnswerContent: null,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (insertRows.length > 0) {
        await queryInterface.bulkInsert('Questions', insertRows, {
          transaction: t,
        });
      } else {
        console.log('✔ WRITING already fully seeded. Nothing to insert.');
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Questions', { Type: 'writing' });
  },
};
