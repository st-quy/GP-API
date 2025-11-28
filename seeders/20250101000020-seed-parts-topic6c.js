'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // Fetch all skills
      const skillRows = await queryInterface.sequelize.query(
        `SELECT "ID","Name" FROM "Skills"`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      const getSkillID = (name) => {
        const found = skillRows.find((s) => s.Name === name);
        if (!found) throw new Error('Skill not found: ' + name);
        return found.ID;
      };

      // Define all parts
      const PARTS = [
        // GRAMMAR & VOCABULARY
        {
          Content: 'GV_P1_InfoRecognition',
          SubContent: 'Information recognition (13 questions)',
          Skill: 'GRAMMAR AND VOCABULARY',
          Sequence: 1,
        },
        {
          Content: 'GV_P2_Vocab',
          SubContent: 'VOCABULARY (Question 26–30: 25 questions)',
          Skill: 'GRAMMAR AND VOCABULARY',
          Sequence: 2,
        },

        // READING
        {
          Content: 'RD_P1_EmailGaps',
          SubContent: '',
          Skill: 'READING',
          Sequence: 1,
        },
        {
          Content: 'RD_P2A_Einstein',
          SubContent: 'The sentences below are a story about a scientist.',
          Skill: 'READING',
          Sequence: 2,
        },
        {
          Content: 'RD_P2B_FireInstruction',
          SubContent: 'The sentences below are from a fire instruction.',
          Skill: 'READING',
          Sequence: 3,
        },
        {
          Content: 'RD_P3_Movies',
          SubContent: 'Four people respond in the comments section.',
          Skill: 'READING',
          Sequence: 4,
        },
        {
          Content: 'RD_P4_Coffee',
          SubContent: 'Choose a heading for each numbered paragraph (1–7).',
          Skill: 'READING',
          Sequence: 5,
        },

        // LISTENING
        {
          Content: 'LS_P1_InfoRecognition',
          SubContent: '(13 questions)',
          Skill: 'LISTENING',
          Sequence: 1,
        },
        {
          Content: 'LS_P2_InfoMatching',
          SubContent: '(4 questions)',
          Skill: 'LISTENING',
          Sequence: 2,
        },
        {
          Content: 'LS_P3_OpinionMatching',
          SubContent: '(4 questions)',
          Skill: 'LISTENING',
          Sequence: 3,
        },
        {
          Content: 'LS_P4_Inference',
          SubContent: '(2 talks – 4 questions)',
          Skill: 'LISTENING',
          Sequence: 4,
        },

        // WRITING
        {
          Content: 'WR_P1_ShortAnswers',
          SubContent: '(5 short answers)',
          Skill: 'WRITING',
          Sequence: 1,
        },
        {
          Content: 'WR_P2_Form',
          SubContent: '(Fill in the form, 20–30 words)',
          Skill: 'WRITING',
          Sequence: 2,
        },
        {
          Content: 'WR_P3_Chatroom',
          SubContent: '(Reply 30–40 words per answer)',
          Skill: 'WRITING',
          Sequence: 3,
        },
        {
          Content: 'WR_P4_Emails',
          SubContent: '(Short + long email)',
          Skill: 'WRITING',
          Sequence: 4,
        },

        // SPEAKING
        {
          Content: 'SP_P1_QA',
          SubContent: 'Short Q&A',
          Skill: 'SPEAKING',
          Sequence: 1,
        },
        {
          Content: 'SP_P2_DescribePicture',
          SubContent: 'Describe the picture',
          Skill: 'SPEAKING',
          Sequence: 2,
        },
        {
          Content: 'SP_P3_Compare',
          SubContent: 'Describe & compare pictures',
          Skill: 'SPEAKING',
          Sequence: 3,
        },
        {
          Content: 'SP_P4_Opinion',
          SubContent: 'Opinion questions',
          Skill: 'SPEAKING',
          Sequence: 4,
        },
      ];

      // Fetch existing Parts
      const existingParts = await queryInterface.sequelize.query(
        `SELECT "ID","Content","SkillID" FROM "Parts"`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      const existingMap = new Map(
        existingParts.map((p) => [`${p.Content}_${p.SkillID}`, p.ID])
      );

      const upsertRows = [];

      for (const p of PARTS) {
        const skillID = getSkillID(p.Skill);
        const key = `${p.Content}_${skillID}`;

        // If exists → UPDATE
        if (existingMap.has(key)) {
          await queryInterface.bulkUpdate(
            'Parts',
            {
              SubContent: p.SubContent,
              Sequence: p.Sequence,
              updatedAt: now,
            },
            { ID: existingMap.get(key) },
            { transaction: t }
          );
        } else {
          // If not exists → INSERT
          upsertRows.push({
            ID: uuidv4(),
            SkillID: skillID,
            Content: p.Content,
            SubContent: p.SubContent,
            Sequence: p.Sequence,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      if (upsertRows.length > 0) {
        await queryInterface.bulkInsert('Parts', upsertRows, {
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
    // Xoá theo Content để tránh xoá nhầm Part khác
    const CONTENTS = [
      'GV_P1_InfoRecognition',
      'GV_P2_Vocab',
      'RD_P1_EmailGaps',
      'RD_P2A_Einstein',
      'RD_P2B_FireInstruction',
      'RD_P3_Movies',
      'RD_P4_Coffee',
      'LS_P1_InfoRecognition',
      'LS_P2_InfoMatching',
      'LS_P3_OpinionMatching',
      'LS_P4_Inference',
      'WR_P1_ShortAnswers',
      'WR_P2_Form',
      'WR_P3_Chatroom',
      'WR_P4_Emails',
      'SP_P1_QA',
      'SP_P2_DescribePicture',
      'SP_P3_Compare',
      'SP_P4_Opinion',
    ];

    await queryInterface.bulkDelete('Parts', {
      Content: CONTENTS,
    });
  },
};
