'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // -------------------------------------------------------------
      // 1) Lấy Part SPEAKING theo SkillID
      // -------------------------------------------------------------
      const partRows = await queryInterface.sequelize.query(
        `
        SELECT "ID", "Content", "SubContent"
        FROM "Parts"
        WHERE "SkillID" = (
          SELECT "ID" FROM "Skills" WHERE "Name" = 'SPEAKING'
        );
        `,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      if (!partRows.length) {
        throw new Error('No SPEAKING parts found. Run FILE 1 & FILE 2 first.');
      }

      const findPart = (content) => {
        const row = partRows.find((p) => p.Content === content);
        if (!row) {
          throw new Error(`SPEAKING Part not found: ${content}`);
        }
        return row.ID;
      };

      // -------------------------------------------------------------
      // 2) TOÀN BỘ SPEAKING — GIỮ NỘI DUNG GỐC, CHỈ ĐỔI TÊN PART
      //    (khớp với FILE seed Parts: SP_P1_QA, SP_P2_DescribePicture, ...)
      // -------------------------------------------------------------
      const DATA = [
        // SPEAKING — PART 1 (Short Q&A)
        {
          PartContent: 'SP_P1_QA', // đổi từ SP_P1_Personal
          Sequence: 1,
          Content: 'Please tell me about your favorite place.',
          ImageKeys: null,
        },
        {
          PartContent: 'SP_P1_QA',
          Sequence: 2,
          Content: 'Please tell me about your favorite film star.',
          ImageKeys: null,
        },
        {
          PartContent: 'SP_P1_QA',
          Sequence: 3,
          Content:
            'Please tell me about the last time you saw an advertisement.',
          ImageKeys: null,
        },

        // SPEAKING — PART 2 (Describe picture)
        {
          PartContent: 'SP_P2_DescribePicture', // đổi từ SP_P2_Picture
          Sequence: 1,
          Content: 'Describe the picture.',
          ImageKeys: [
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Photo/P2.png',
          ],
        },
        {
          PartContent: 'SP_P2_DescribePicture',
          Sequence: 2,
          Content: 'What do you usually eat for breakfast?',
          ImageKeys: [
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Photo/P2.png',
          ],
        },
        {
          PartContent: 'SP_P2_DescribePicture',
          Sequence: 3,
          Content: 'Do you think people should eat breakfast?',
          ImageKeys: [
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Photo/P2.png',
          ],
        },

        // SPEAKING — PART 3 (Compare pictures)
        {
          PartContent: 'SP_P3_Compare',
          Sequence: 1,
          Content: 'Describe two pictures.',
          ImageKeys: [
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Photo/P3.png',
          ],
        },
        {
          PartContent: 'SP_P3_Compare',
          Sequence: 2,
          Content: 'What are the attractions of the two pictures?',
          ImageKeys: [
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Photo/P3.png',
          ],
        },
        {
          PartContent: 'SP_P3_Compare',
          Sequence: 3,
          Content: 'What is the appeal of growing plants and doing gardening?',
          ImageKeys: [
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Photo/P3.png',
          ],
        },

        // SPEAKING — PART 4 (Opinion + photo)
        {
          PartContent: 'SP_P4_Opinion', // đổi từ SP_P4_PhotoDiscussion
          Sequence: 1,
          Content: 'Describe a time when you visited someone.',
          ImageKeys: [
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Photo/P4.jpg',
          ],
        },
        {
          PartContent: 'SP_P4_Opinion',
          Sequence: 2,
          Content: 'What do you think about having unexpected visitors?',
          ImageKeys: [
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Photo/P4.jpg',
          ],
        },
        {
          PartContent: 'SP_P4_Opinion',
          Sequence: 3,
          Content:
            'Some people like to live in small communities, while others like to live in big cities. What is your opinion?',
          ImageKeys: [
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Photo/P4.jpg',
          ],
        },
      ];

      // -------------------------------------------------------------
      // 3) Lấy các câu SPEAKING đã tồn tại để anti-duplicate
      // -------------------------------------------------------------
      const existing = await queryInterface.sequelize.query(
        `SELECT "PartID","Sequence" FROM "Questions" WHERE "Type" = 'speaking'`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      const existSet = new Set(
        existing.map((e) => `${e.PartID}__${e.Sequence}`)
      );

      // -------------------------------------------------------------
      // 4) Build rows (skip nếu đã tồn tại)
      // -------------------------------------------------------------
      const insertRows = [];

      for (const q of DATA) {
        const partID = findPart(q.PartContent, null);
        const key = `${partID}__${q.Sequence}`;

        if (existSet.has(key)) {
          console.log(
            `⚠️ Skip duplicate SPEAKING: ${q.PartContent} - Seq ${q.Sequence}`
          );
          continue;
        }

        insertRows.push({
          ID: uuidv4(),
          Type: 'speaking',
          AudioKeys: null,
          ImageKeys: q.ImageKeys ?? null,
          PartID: partID,
          Sequence: q.Sequence,
          Content: q.Content,
          SubContent: null,
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
        console.log('✔ SPEAKING already fully seeded. Nothing to insert.');
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Questions', { Type: 'speaking' });
  },
};
