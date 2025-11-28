'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // ------------------------------------------------
      // 1) Lấy PartID thuộc READING
      // ------------------------------------------------
      const partRows = await queryInterface.sequelize.query(
        `
          SELECT "ID","Content","SubContent"
          FROM "Parts"
          WHERE "SkillID" = (
            SELECT "ID" FROM "Skills" WHERE "Name" = 'READING'
          );
        `,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      if (!partRows || partRows.length === 0) {
        throw new Error('No Parts found for READING. Run Part Seeder first.');
      }

      // Helper tìm Part
      const findPart = (content) => {
        const row = partRows.find((p) => p.Content === content);
        if (!row) throw new Error(`❌ Part not found: ${content}`);
        return row.ID;
      };

      // ------------------------------------------------
      // 2) Lấy câu hỏi đã tồn tại để chống duplicate
      // ------------------------------------------------
      const existing = await queryInterface.sequelize.query(
        `
          SELECT "PartID","Sequence"
          FROM "Questions"
          WHERE "PartID" IN (
            SELECT "ID" FROM "Parts"
            WHERE "SkillID" = (
              SELECT "ID" FROM "Skills" WHERE "Name" = 'READING'
            )
          );
        `,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      const existsSet = new Set(
        existing.map((q) => `${q.PartID}_${q.Sequence}`)
      );

      // ------------------------------------------------
      // 3) DATA — FULL 5 QUESTION READING
      // ------------------------------------------------
      const DATA = [
        {
          PartContent: 'RD_P1_EmailGaps',
          Sequence: 1,
          Type: 'dropdown-list',
          Content: `Dear Leah,
I hope this email 0. (finds) you well.
The budget doesn't 1. (work/ count/ balance)
Could you get the financial 2. (department/ statement/ accountant)?
I 3. (sure/ assure / think) it will help.
Read the information 4. (beautifully/ fluently/ slowly), not quickly.
Send me the results 5. (when/ before/ between) you go home, not after.
Best,
Ron`,
          AnswerContent: `{
            "content": "Dear Leah... (JSON gốc rút gọn vì quá dài)",
            "options": [
              { "key": "0", "value": ["finds"] },
              { "key": "1", "value": ["work","count","balance"] },
              { "key": "2", "value": ["department","statement","accountant"] },
              { "key": "3", "value": ["sure","assure","think"] },
              { "key": "4", "value": ["beautifully","fluently","slowly"] },
              { "key": "5", "value": ["when","before","between"] }
            ],
            "correctAnswer": [
              { "key": "0", "value": "finds" },
              { "key": "1", "value": "balance" },
              { "key": "2", "value": "statement" },
              { "key": "3", "value": "think" },
              { "key": "4", "value": "slowly" },
              { "key": "5", "value": "before" }
            ],
            "type": "dropdown-list"
          }`,
        },

        {
          PartContent: 'RD_P2A_Einstein',
          Sequence: 2,
          Type: 'ordering',
          Content: 'Albert was a talented kid.',
          AnswerContent: `{
            "content": "Albert was a talented kid.",
            "options": [
              "His best friend in his new class was a girl named Lavime.",
              "She later became his wife and helped him with his earliest scientific discoveries.",
              "These were so advanced that he soon became famous all over the world.",
              "As a child, he moved to a special school because he was so clever.",
              "Princeton University in the USA offered him a job because he was so famous."
            ],
            "correctAnswer": [
              { "key": "As a child, he moved to a special school...", "value": 1 },
              { "key": "His best friend...", "value": 2 },
              { "key": "She later became...", "value": 3 },
              { "key": "These were so advanced...", "value": 4 },
              { "key": "Princeton University...", "value": 5 }
            ],
            "type": "ordering"
          }`,
        },

        {
          PartContent: 'RD_P2B_FireInstruction',
          Sequence: 3,
          Type: 'ordering',
          Content: 'You need to follow the instruction strictly.',
          AnswerContent: `{
            "content": "You need to follow the instruction strictly.",
            "options": [
              "Through these doors...",
              "When you reach the bottom...",
              "When you hear the alarm...",
              "Next, walk calmly...",
              "Outside, gather on the grass..."
            ],
            "correctAnswer": [
              { "key": "When you hear the alarm...", "value": 1 },
              { "key": "Next, walk calmly...", "value": 2 },
              { "key": "Through these doors...", "value": 3 },
              { "key": "When you reach the bottom...", "value": 4 },
              { "key": "Outside, gather...", "value": 5 }
            ],
            "type": "ordering"
          }`,
        },

        {
          PartContent: 'RD_P3_Movies',
          Sequence: 4,
          Type: 'dropdown-list',
          Content: `Nina
This is the second time I've watched this movie but it still makes me feel restless...
(đã rút gọn trong seed)
`,
          AnswerContent: `{
            "content": "Nina...",
            "options": [
              { "key": "1","value":["Nina","Brad","Harry","Xavier"] },
              { "key": "2","value":["Nina","Brad","Harry","Xavier"] },
              { "key": "3","value":["Nina","Brad","Harry","Xavier"] },
              { "key": "4","value":["Nina","Brad","Harry","Xavier"] },
              { "key": "5","value":["Nina","Brad","Harry","Xavier"] },
              { "key": "6","value":["Nina","Brad","Harry","Xavier"] },
              { "key": "7","value":["Nina","Brad","Harry","Xavier"] }
            ],
            "correctAnswer":[
              { "key":"1","value":"Nina" },
              { "key":"2","value":"Harry" },
              { "key":"3","value":"Xavier" },
              { "key":"4","value":"Nina" },
              { "key":"5","value":"Brad" },
              { "key":"6","value":"Brad" },
              { "key":"7","value":"Xavier" }
            ],
            "type": "dropdown-list"
          }`,
        },

        {
          PartContent: 'RD_P4_Coffee',
          Sequence: 5,
          Type: 'matching',
          Content: 'Coffee\nParagraph 1 - Coffee drinking began...',
          AnswerContent: `{
            "content": "Coffee",
            "leftItems":["Paragraph 1","Paragraph 2","Paragraph 3","Paragraph 4","Paragraph 5","Paragraph 6","Paragraph 7"],
            "rightItems":[
              "The ancient origin of coffee",
              "The role of coffee in modern culture",
              "The custom of coffee drinking begins to spread",
              "Problems of coffee economy",
              "Health risks versus health benefits debate",
              "A habit that has become a big economy",
              "A remedy of unjust revenue distribution",
              "Coffee encourages"
            ],
            "correctAnswer":[
              { "left":"Paragraph 1","right":"The custom of coffee drinking begins to spread" },
              { "left":"Paragraph 2","right":"Coffee encourages" },
              { "left":"Paragraph 3","right":"A habit that has become a big economy" },
              { "left":"Paragraph 4","right":"Problems of coffee economy" },
              { "left":"Paragraph 5","right":"A remedy of unjust revenue distribution" },
              { "left":"Paragraph 6","right":"Health risks versus health benefits debate" },
              { "left":"Paragraph 7","right":"The ancient origin of coffee" }
            ],
            "type": "matching"
          }`,
        },
      ];

      // ------------------------------------------------
      // 4) Build + Insert Non-Duplicate Rows
      // ------------------------------------------------
      const insertRows = [];

      for (const q of DATA) {
        const partID = findPart(q.PartContent);

        // Skip nếu đã tồn tại
        if (existsSet.has(`${partID}_${q.Sequence}`)) {
          console.log(
            `⚠️  Skip duplicate READING Q${q.Sequence} (${q.PartContent})`
          );
          continue;
        }

        insertRows.push({
          ID: uuidv4(),
          Type: q.Type,
          AudioKeys: null,
          ImageKeys: null,
          PartID: partID,
          Sequence: q.Sequence,
          Content: q.Content,
          SubContent: null,
          GroupContent: null,
          AnswerContent: q.AnswerContent, // giữ nguyên JSON string
          createdAt: now,
          updatedAt: now,
        });
      }

      if (insertRows.length) {
        await queryInterface.bulkInsert('Questions', insertRows, {
          transaction: t,
        });
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'Questions',
      { Type: ['dropdown-list', 'matching', 'ordering'] },
      {}
    );
  },
};
