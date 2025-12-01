'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();

      // ----------------------------------------
      // 1) Find or create Topic 6C
      // ----------------------------------------
      let topicID = null;

      const existingTopic = await queryInterface.sequelize.query(
        `SELECT "ID" FROM "Topics" WHERE "Name" = 'Topic 6C' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      if (existingTopic.length > 0) {
        // Topic đã tồn tại → dùng lại ID
        topicID = existingTopic[0].ID;

        // Cập nhật trạng thái (optional)
        await queryInterface.bulkUpdate(
          'Topics',
          { Status: 'submited', updatedAt: now },
          { ID: topicID },
          { transaction: t }
        );
      } else {
        // Topic chưa có → tạo mới
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

      // ----------------------------------------
      // 2) Fetch Parts created in FILE 1 (idempotent)
      // ----------------------------------------
      const partContents = [
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

      const parts = await queryInterface.sequelize.query(
        `
        SELECT "ID","Content","Sequence","SkillID"
        FROM "Parts"
        WHERE "Content" IN (:contents)
      `,
        {
          replacements: { contents: partContents },
          type: Sequelize.QueryTypes.SELECT,
          transaction: t,
        }
      );

      if (parts.length === 0)
        throw new Error('Parts missing. Run seed parts first.');

      // ----------------------------------------
      // 3) Fetch existing TopicParts to avoid duplicates
      // ----------------------------------------
      const existingTopicParts = await queryInterface.sequelize.query(
        `
        SELECT "PartID"
        FROM "TopicParts"
        WHERE "TopicID" = :topicID
      `,
        {
          replacements: { topicID },
          type: Sequelize.QueryTypes.SELECT,
          transaction: t,
        }
      );

      const existingSet = new Set(existingTopicParts.map((tp) => tp.PartID));

      // ----------------------------------------
      // 4) Build & Insert only missing TopicParts
      // ----------------------------------------
      const topicPartsToInsert = parts
        .filter((p) => !existingSet.has(p.ID)) // chỉ insert nếu chưa có
        .map((p) => ({
          ID: uuidv4(),
          TopicID: topicID,
          PartID: p.ID,
          createdAt: now,
          updatedAt: now,
        }));

      if (topicPartsToInsert.length > 0) {
        await queryInterface.bulkInsert('TopicParts', topicPartsToInsert, {
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
    const t = await queryInterface.sequelize.transaction();
    try {
      const topic = await queryInterface.sequelize.query(
        `SELECT "ID" FROM "Topics" WHERE "Name" = 'Topic 6C' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      if (topic.length > 0) {
        const topicID = topic[0].ID;

        await queryInterface.bulkDelete(
          'TopicParts',
          { TopicID: topicID },
          { transaction: t }
        );

        await queryInterface.bulkDelete(
          'Topics',
          { ID: topicID },
          { transaction: t }
        );
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
