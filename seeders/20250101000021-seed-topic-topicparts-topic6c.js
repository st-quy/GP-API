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
        // GRAMMAR
        'GV_P1_InfoRecognition',
        'GV_P2_Vocab',

        // READING
        'RD_P1_EmailGaps',
        'RD_P2A_Einstein',
        'RD_P2B_FireInstruction',
        'RD_P3_Movies',
        'RD_P4_Coffee',

        // LISTENING
        'LS_P1_InfoRecognition',
        'LS_P2_InfoMatching',
        'LS_P3_OpinionMatching',
        'LS_P4_Inference',

        // WRITING
        'WR_P1_ShortAnswers',
        'WR_P2_Form',
        'WR_P3_Chatroom',
        'WR_P4_Emails',

        // SPEAKING
        'SP_P1_QA',
        'SP_P2_DescribePicture',
        'SP_P3_Compare',
        'SP_P4_Opinion',
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
