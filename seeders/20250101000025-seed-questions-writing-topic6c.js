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
          PartContent: 'WR_P1_ShortAnswers',
          Sequence: 1,
          Content: 'Where are you from?',
          SubContent: null,
        },
        {
          PartContent: 'WR_P1_ShortAnswers',
          Sequence: 2,
          Content: 'Please tell me about your favorite film star.',
          SubContent: null,
        },
        {
          PartContent: 'WR_P1_ShortAnswers',
          Sequence: 3,
          Content: 'What do you do in your free time?',
          SubContent: null,
        },
        {
          PartContent: 'WR_P1_ShortAnswers',
          Sequence: 4,
          Content:
            'Please tell me about the last time you saw an advertisement.',
          SubContent: null,
        },

        // WRITING — PART 2
        {
          PartContent: 'WR_P2_Form',
          Sequence: 6,
          Content: 'Please write about your ideal house.',
          SubContent: '',
        },

        // WRITING — PART 3
        {
          PartContent: 'WR_P3_Chatroom',
          Sequence: 4,
          Content: 'What kind of accommodation do you live in now?',
          SubContent: '',
        },
        {
          PartContent: 'WR_P3_Chatroom',
          Sequence: 5,
          Content: 'Which part of the house would you like to change?',
          SubContent: '',
        },
        {
          PartContent: 'WR_P3_Chatroom',
          Sequence: 7,
          Content:
            'Hannah: Hi! Welcome to the club. I really enjoy watching TV programs about houses. How about you? Are you interested in these programs?',
          SubContent: '',
        },
        {
          PartContent: 'WR_P3_Chatroom',
          Sequence: 8,
          Content:
            'Jack: Hello! Have you ever had any problems with your neighbors?',
          SubContent: '',
        },
        {
          PartContent: 'WR_P3_Chatroom',
          Sequence: 9,
          Content:
            'Nira: Welcome! Houses should be built in a way that is environmentally friendly. Do you agree?',
          SubContent: '',
        },

        // WRITING — PART 4
        {
          PartContent: 'WR_P4_Emails',
          Sequence: 10,
          Content:
            'Write an email to your friend. Share your thoughts on this piece of news and your suggestions. Write about 50 words. Recommended time: 10 minutes.',
          SubContent:
            '* (You’re allowed to write up to 75 words without affecting your grade).',
        },
        {
          PartContent: 'WR_P4_Emails',
          Sequence: 11,
          Content:
            'Write an email to the club president. Express your feelings about this piece of news and your suggestions. Write about 120-150 words. Recommended time: 20 minutes.',
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
