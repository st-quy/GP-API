'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tx = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      const skillId = await queryInterface.rawSelect(
        'Skills',
        { where: { Name: 'WRITING' }, transaction: tx },
        ['ID']
      );

      if (!skillId) {
        throw new Error(
          'Skill "WRITING" chưa được seed. Hãy chạy seed skills trước.'
        );
      }

      async function getPartId(content) {
        const id = await queryInterface.rawSelect(
          'Parts',
          {
            where: { Content: content, SkillID: skillId },
            transaction: tx,
          },
          ['ID']
        );
        if (!id) {
          throw new Error(
            `Part "${content}" cho skill WRITING chưa được seed. Hãy chạy 20250101000004-seed-parts-base trước.`
          );
        }
        return id;
      }

      const p1 = await getPartId(
        'Part 1: You want to join the Fitness Club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.'
      );
      const p2 = await getPartId(
        'Part 2: You are a new member of the Fitness Club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.'
      );
      const p3 = await getPartId(
        'Part 3: You are a member of the Fitness Club. You are talking to other members in a chat room. Reply to their questions. Write in sentences. Use 30-40 words per answer. Recommended time: 10 minutes.'
      );
      const p4 = await getPartId(
        'Part 4: You are a member of the Fitness Club. You have received this email from the club manager.'
      );

      const questions = [
        {
          type: 'writing',
          partId: p1,
          content:
            'Write short answers (1–5 words) to each message from the Fitness Club member.',
          sequence: 1,
        },
        {
          type: 'writing',
          partId: p2,
          content:
            'You are a new member of the Fitness Club. Fill in the form with information about your exercise routine. Use 20–30 words.',
          sequence: 2,
        },
        {
          type: 'writing',
          partId: p3,
          content:
            'You are talking to other members in the Fitness Club chat room. Answer their questions about your favourite way to keep fit. Write 30–40 words.',
          sequence: 3,
        },
        {
          type: 'writing',
          partId: p4,
          content:
            'You have received an email from the club manager asking for suggestions to improve the Fitness Club. Write your reply (180–220 words).',
          sequence: 4,
        },
      ];

      const rowsToInsert = [];

      for (const q of questions) {
        const existingId = await queryInterface.rawSelect(
          'Questions',
          {
            where: { Content: q.content, PartID: q.partId },
            transaction: tx,
          },
          ['ID']
        );
        if (existingId) continue;

        rowsToInsert.push({
          ID: uuidv4(),
          Type: q.type,
          AudioKeys: null,
          // ❗ Quan trọng: KHÔNG dùng [] nữa
          ImageKeys: null,
          PartID: q.partId,
          Sequence: q.sequence,
          Content: q.content,
          SubContent: null,
          GroupContent: null,
          AnswerContent: null, // Writing chấm tay
          GroupID: null,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (rowsToInsert.length > 0) {
        await queryInterface.bulkInsert('Questions', rowsToInsert, {
          transaction: tx,
        });
      }

      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const skillId = await queryInterface.rawSelect(
      'Skills',
      { where: { Name: 'WRITING' } },
      ['ID']
    );
    if (!skillId) return;

    const contents = [
      'Part 1: You want to join the Fitness Club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
      'Part 2: You are a new member of the Fitness Club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.',
      'Part 3: You are a member of the Fitness Club. You are talking to other members in a chat room. Reply to their questions. Write in sentences. Use 30-40 words per answer. Recommended time: 10 minutes.',
      'Part 4: You are a member of the Fitness Club. You have received this email from the club manager.',
    ];

    const partIds = [];
    for (const c of contents) {
      const id = await queryInterface.rawSelect(
        'Parts',
        { where: { Content: c, SkillID: skillId } },
        ['ID']
      );
      if (id) partIds.push(id);
    }

    if (!partIds.length) return;

    await queryInterface.bulkDelete(
      'Questions',
      {
        PartID: { [Sequelize.Op.in]: partIds },
        Type: 'writing',
      },
      {}
    );
  },
};
