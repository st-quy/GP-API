'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // =====================================================
      // 1) Lấy hoặc tạo Topic 6C
      // =====================================================
      let topicID = null;

      const topicRow = await queryInterface.sequelize.query(
        `SELECT "ID" FROM "Topics" WHERE "Name" = 'Topic 6C' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      if (topicRow.length) {
        topicID = topicRow[0].ID;
      } else {
        topicID = uuidv4();
        await queryInterface.bulkInsert(
          'Topics',
          [
            {
              ID: topicID,
              Name: 'Topic 6C',
              Status: 'submited',
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction: t }
        );
      }

      // =====================================================
      // 2) Lấy Parts dựa trên Content list bạn đã định nghĩa
      // =====================================================
      const partContents = [
        // GRAMMAR
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

      const parts = await queryInterface.sequelize.query(
        `
        SELECT "ID","SkillID","Content","Sequence"
        FROM "Parts"
        WHERE "Content" IN (:contents)
      `,
        {
          replacements: { contents: partContents },
          type: Sequelize.QueryTypes.SELECT,
          transaction: t,
        }
      );

      if (!parts.length)
        throw new Error('No parts found! Must seed parts first.');

      // =====================================================
      // 3) Group Part theo SkillID
      // =====================================================
      const partsBySkill = {};
      for (const p of parts) {
        if (!partsBySkill[p.SkillID]) partsBySkill[p.SkillID] = [];
        partsBySkill[p.SkillID].push(p);
      }

      // =====================================================
      // 4) Lấy toàn bộ Skill
      // =====================================================
      const skills = await queryInterface.sequelize.query(
        `SELECT "ID","Name" FROM "Skills"`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      // =====================================================
      // 5) Tạo Section cho mỗi Skill
      // =====================================================
      const sectionMap = {}; // SkillID -> SectionID

      for (const skill of skills) {
        const sectionName = `Section for ${skill.Name}`;

        const exist = await queryInterface.sequelize.query(
          `SELECT "ID" FROM "Sections" WHERE "Name" = :name LIMIT 1`,
          {
            replacements: { name: sectionName },
            type: Sequelize.QueryTypes.SELECT,
            transaction: t,
          }
        );

        if (exist.length) {
          sectionMap[skill.ID] = exist[0].ID;
        } else {
          const sectionID = uuidv4();
          sectionMap[skill.ID] = sectionID;

          await queryInterface.bulkInsert(
            'Sections',
            [
              {
                ID: sectionID,
                Name: sectionName,
                SkillID: skill.ID,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction: t }
          );
        }
      }

      // =====================================================
      // 6) Insert SectionParts
      // =====================================================
      const sectionPartRows = [];

      for (const skill of skills) {
        const sectionID = sectionMap[skill.ID];
        const skillParts = partsBySkill[skill.ID] || [];

        for (const p of skillParts) {
          sectionPartRows.push({
            ID: uuidv4(),
            SectionID: sectionID,
            PartID: p.ID,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      await queryInterface.bulkInsert('SectionParts', sectionPartRows, {
        transaction: t,
      });

      // =====================================================
      // 7) Insert TopicSections (Topic ↔ Section)
      // =====================================================
      const topicSectionRows = Object.values(sectionMap).map((sectionID) => ({
        ID: uuidv4(),
        TopicID: topicID,
        SectionID: sectionID,
        createdAt: now,
        updatedAt: now,
      }));

      await queryInterface.bulkInsert('TopicSections', topicSectionRows, {
        transaction: t,
      });

      // =====================================================
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down() {
    console.log('Rollback manually for safety');
  },
};
