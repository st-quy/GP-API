'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // 1) Tạo (hoặc lấy) Topic "Practice Test 1"
      const topicName = 'Practice Test 1';

      let topicId = await queryInterface.rawSelect(
        'Topics',
        {
          where: { Name: topicName },
          transaction,
        },
        ['ID']
      );

      if (!topicId) {
        topicId = uuidv4();
        await queryInterface.bulkInsert(
          'Topics',
          [
            {
              ID: topicId,
              Name: topicName,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction }
        );
      }

      // 2) Lấy map SkillName -> SkillID (để tìm Part đúng Skill + Content)
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

      for (const name of SKILL_NAMES) {
        if (!skillMap[name]) {
          throw new Error(
            `Skill "${name}" chưa được seed. Hãy chạy seed skills trước.`
          );
        }
      }

      // 3) Định nghĩa tất cả Part sẽ gắn vào Topic này (theo đúng Content đã seed)
      // Thứ tự trong mảng = thứ tự logic đề thi
      const topicPartConfigs = [
        // GRAMMAR & VOCABULARY
        {
          skillName: 'GRAMMAR AND VOCABULARY',
          content: 'Part 1: ...',
        },
        {
          skillName: 'GRAMMAR AND VOCABULARY',
          content: 'Part 2: ...',
        },

        // READING
        {
          skillName: 'READING',
          content:
            'Part 1 - Read the email from Ron to his assistant. Choose one word from the list for each gap. The first one is done for you.',
        },
        {
          skillName: 'READING',
          content:
            'Part 2A: The sentences below are a story about a scientist. Put the sentences in the right order. The first sentence is done for you.',
        },
        {
          skillName: 'READING',
          content:
            'Part 2B: The sentences below are from a fire instruction. Put the sentences in the right order. The first sentence is done for you.',
        },
        {
          skillName: 'READING',
          content:
            'Part 3: Four people respond in the comments section of an online magazine article about watching a movie. Read the texts and then answer the questions below.',
        },
        {
          skillName: 'READING',
          content:
            'Part 4 - Read the following passage quickly. Choose a heading for each numbered paragraph (1-7). There is one more heading than you need.',
        },

        // LISTENING
        {
          skillName: 'LISTENING',
          content: 'PART 1: Information recognition (13 questions)',
        },
        {
          skillName: 'LISTENING',
          content: 'PART 2: Information Matching (4 questions)',
        },
        {
          skillName: 'LISTENING',
          content: 'PART 3: Opinion Matching (4 questions)',
        },
        {
          skillName: 'LISTENING',
          content: 'PART 4: Inference (2 talks - 4 questions)',
        },

        // WRITING
        {
          skillName: 'WRITING',
          content:
            'Part 1: You want to join the Fitness Club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
        },
        {
          skillName: 'WRITING',
          content:
            'Part 2: You are a new member of the Fitness Club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.',
        },
        {
          skillName: 'WRITING',
          content:
            'Part 3: You are a member of the Fitness Club. You are talking to other members in a chat room. Reply to their questions. Write in sentences. Use 30-40 words per answer. Recommended time: 10 minutes.',
        },
        {
          skillName: 'WRITING',
          content:
            'Part 4: You are a member of the Fitness Club. You have received this email from the club manager.',
        },

        // SPEAKING
        {
          skillName: 'SPEAKING',
          content: 'Part 1',
        },
        {
          skillName: 'SPEAKING',
          content: 'Part 2',
        },
        {
          skillName: 'SPEAKING',
          content: 'Part 3',
        },
        {
          skillName: 'SPEAKING',
          content: 'Part 4',
        },
      ];

      const topicPartsToInsert = [];

      for (const cfg of topicPartConfigs) {
        const skillId = skillMap[cfg.skillName];
        if (!skillId) continue;

        // Tìm Part theo SkillID + Content
        const partId = await queryInterface.rawSelect(
          'Parts',
          {
            where: {
              Content: cfg.content,
              SkillID: skillId,
            },
            transaction,
          },
          ['ID']
        );

        if (!partId) {
          throw new Error(
            `Không tìm thấy Part với Content="${cfg.content}" và Skill="${cfg.skillName}". Hãy chắc chắn seeder 20250101000004-seed-parts-base đã chạy.`
          );
        }

        // Check xem TopicPart (TopicID, PartID) đã tồn tại chưa
        const existingTopicPartId = await queryInterface.rawSelect(
          'TopicParts',
          {
            where: {
              TopicID: topicId,
              PartID: partId,
            },
            transaction,
          },
          ['ID']
        );

        if (!existingTopicPartId) {
          topicPartsToInsert.push({
            ID: uuidv4(),
            TopicID: topicId,
            PartID: partId,
            QuestionSetID: null, // hiện tại mình không dùng QuestionSet
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      if (topicPartsToInsert.length > 0) {
        await queryInterface.bulkInsert('TopicParts', topicPartsToInsert, {
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
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const topicName = 'Practice Test 1';

      const topicId = await queryInterface.rawSelect(
        'Topics',
        {
          where: { Name: topicName },
          transaction,
        },
        ['ID']
      );

      if (!topicId) {
        await transaction.commit();
        return;
      }

      // Xoá TopicParts gắn với Topic này
      await queryInterface.bulkDelete(
        'TopicParts',
        { TopicID: topicId },
        { transaction }
      );

      // Xoá luôn Topic (nếu bạn muốn giữ Topic thì comment đoạn này lại)
      await queryInterface.bulkDelete(
        'Topics',
        { ID: topicId },
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
