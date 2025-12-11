const {
  Part,
  Skill,
  Question,
  Section,
  TopicSection,
  SectionPart,
  Topic,
} = require('../models');
const { Op } = require('sequelize');

async function resolveSkill({ skillId, skillName }) {
  if (!skillId && !skillName) {
    return null;
  }

  let skill = null;

  if (skillId) {
    skill = await Skill.findByPk(skillId);
    if (!skill) {
      throw new Error(`Skill with id ${skillId} not found`);
    }
  } else if (skillName) {
    skill = await Skill.findOne({ where: { Name: skillName } });
    if (!skill) {
      throw new Error(`Skill "${skillName}" not found`);
    }
  }

  return skill;
}

async function getAllSection(req) {
  try {
    const { skillId, skillName, searchName } = req.query || {};

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    let where = {};

    // Filter skill
    if (skillId || skillName) {
      try {
        const skill = await resolveSkill({ skillId, skillName });
        if (!skill) {
          return { status: 400, message: 'Skill not found' };
        }
        where.SkillID = skill.ID;
      } catch (err) {
        return { status: 400, message: err.message };
      }
    }

    if (searchName) {
      where.Name = { [Op.iLike]: `%${searchName}%` };
    }

    const total = await Section.count({ where });

    const sections = await Section.findAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        // === Include Skill ===
        {
          model: Skill,
          as: 'Skill',
          attributes: ['ID', 'Name'],
        },

        // === Include Topics (NEW) ===
        {
          model: Topic,
          as: 'Topics',
          attributes: ['ID', 'Name'],
          through: { attributes: [] }, // hide pivot
        },

        // === Include Parts ===
        {
          model: Part,
          as: 'Parts',
          required: false,
          order: [['createdAt', 'DESC']],
          include: [
            // include Questions
            {
              model: Question,
              as: 'Questions',
              required: false,
              order: [['createdAt', 'DESC']],
            },
          ],
        },
      ],
    });

    return {
      status: 200,
      message: 'Sections fetched successfully',
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: sections,
    };
  } catch (error) {
    throw new Error(`Error fetching parts: ${error.message}`);
  }
}

/* ============================================================
   UPDATE SECTION
   ============================================================ */
async function updateSection(req) {
  try {
    const { id } = req.params;
    const { name, skillId, skillName } = req.body;

    if (!id) {
      return { status: 400, message: 'Section ID is required' };
    }

    // 1) Find existing section
    const section = await Section.findByPk(id);
    if (!section) {
      return { status: 404, message: `Section with id ${id} not found` };
    }

    // 2) Resolve new skill if provided
    let updatedSkillId = section.SkillID;

    if (skillId || skillName) {
      const skill = await Skill.findOne({
        where: {
          ...(skillId && { ID: skillId }),
          ...(skillName && { Name: skillName }),
        },
      });

      if (!skill) {
        return { status: 400, message: 'Skill not found' };
      }

      updatedSkillId = skill.ID;
    }

    // 3) Update fields
    section.Name = name || section.Name;
    section.SkillID = updatedSkillId;

    await section.save();

    return {
      status: 200,
      message: 'Section updated successfully',
      data: section,
    };
  } catch (error) {
    return {
      status: 500,
      message: `Error updating section: ${error.message}`,
    };
  }
}

/* ============================================================
   DELETE SECTION
   - Xóa Section
   - Xóa kèm mapping SectionPart nếu có
   - KHÔNG xóa Part hay Question (tránh mất dữ liệu)
   ============================================================ */
async function deleteSection(req) {
  const t = await Section.sequelize.transaction();

  try {
    const { id } = req.params;

    if (!id) {
      return { status: 400, message: 'Section ID is required' };
    }

    // 1) Kiểm tra Section tồn tại
    const section = await Section.findByPk(id, { transaction: t });
    if (!section) {
      await t.rollback();
      return { status: 404, message: `Section with id ${id} not found` };
    }

    // 2) Kiểm tra section có đang dùng trong TopicSection không
    const usageCount = await TopicSection.count({
      where: { SectionID: id },
      transaction: t,
    });

    if (usageCount > 0) {
      await t.rollback();
      return {
        status: 400,
        message:
          'Cannot delete section because it is already used in one or more Topics',
        usedByTopics: usageCount,
      };
    }

    // 3) Lấy danh sách Part qua SectionPart
    const sectionParts = await SectionPart.findAll({
      where: { SectionID: id },
      transaction: t,
    });

    const partIDs = sectionParts.map((sp) => sp.PartID);

    // 4) Xóa Question theo PartID
    if (partIDs.length > 0) {
      await Question.destroy({
        where: { PartID: partIDs },
        transaction: t,
      });

      // 5) Xóa Part
      await Part.destroy({
        where: { ID: partIDs },
        transaction: t,
      });
    }

    // 6) Xóa SectionPart mapping
    await SectionPart.destroy({
      where: { SectionID: id },
      transaction: t,
    });

    // 7) Xóa Section
    await section.destroy({ transaction: t });

    await t.commit();

    return {
      status: 200,
      message:
        'Section and its linked Parts and Questions deleted successfully',
    };
  } catch (error) {
    await t.rollback();
    return {
      status: 500,
      message: `Error deleting section: ${error.message}`,
    };
  }
}

function extractAudio(obj) {
  if (!obj) return null;
  if (typeof obj.audioKeys === 'string') return obj.audioKeys;

  return (
    obj.audioKeys?.hyperlink ||
    obj.audioKeys?.text ||
    obj.audioUrl?.hyperlink ||
    obj.audioUrl?.text ||
    null
  );
}

function buildMappingFromCorrectAnswer(ac) {
  if (!Array.isArray(ac.correctAnswer)) return [];

  return ac.correctAnswer.map((item) => {
    const leftIndex = Number(item.key) - 1;
    const rightIndex = (ac.rightItems || []).indexOf(item.value);

    return {
      leftIndex,
      rightIndex: rightIndex >= 0 ? rightIndex : null,
    };
  });
}

/* ============================================================
   BUILD LISTENING DETAIL (4 PART)
   ============================================================ */
function buildListeningDetail(section) {
  const parts = (section.Parts || [])
    .slice()
    .sort((a, b) => (a.Sequence || 0) - (b.Sequence || 0));

  const r = {
    section: section,
    SectionID: section.ID,
    SectionName: section.Name,
    SkillName: 'LISTENING',
    part1: null,
    part2: null,
    part3: null,
    part4: null,
  };

  // helper
  const getAC = (q) => (q && q.AnswerContent ? q.AnswerContent : {});
  const audioOf = (q) =>
    q.AudioKeys ||
    q.AnswerContent?.audioKeys?.hyperlink ||
    q.AnswerContent?.audioKeys?.text ||
    null;

  // ========================
  // PART 1 – Multiple Choice
  // ========================
  const p1 = parts.find((p) => p.Sequence === 1);
  if (p1) {
    r.part1 = {
      PartID: p1.ID,
      Type: 'multiple-choice',
      PartName: p1.Content,
      questions: p1.Questions.map((q) => {
        const ac = getAC(q);
        return {
          QuestionID: q.ID,
          Content: q.Content,
          AudioUrl: audioOf(q),
          Options: ac.options || [],
          CorrectAnswer: ac.correctAnswer || null,
        };
      }),
    };
  }

  // ========================
  // PART 2 – Matching
  // ========================
  const p2 = parts.find((p) => p.Sequence === 2);
  if (p2 && p2.Questions.length) {
    const q = p2.Questions[0];
    const ac = getAC(q);

    r.part2 = {
      PartID: p2.ID,
      Type: 'matching',
      Instruction: q.Content,
      AudioUrl: audioOf(q),
      LeftItems: ac.leftItems || [],
      RightItems: ac.rightItems || [],
      Mapping: buildMappingFromCorrectAnswer(ac), // IMPORTANT
    };
  }

  // ========================
  // PART 3 – Matching
  // ========================
  const p3 = parts.find((p) => p.Sequence === 3);
  if (p3 && p3.Questions.length) {
    const q = p3.Questions[0];
    const ac = getAC(q);

    r.part3 = {
      PartID: p3.ID,
      Type: 'matching',
      Instruction: q.Content,
      AudioUrl: audioOf(q),
      LeftItems: ac.leftItems || [],
      RightItems: ac.rightItems || [],
      Mapping: buildMappingFromCorrectAnswer(ac),
    };
  }

  // ========================
  // PART 4 – Listening Group
  // ========================
  const p4 = parts.find((p) => p.Sequence === 4);
  if (p4 && p4.Questions.length) {
    r.part4 = {
      PartID: p4.ID,
      Type: 'listening-questions-group',
      groups: p4.Questions.map((q, index) => {
        const ac = getAC(q);

        const list = ac.groupContent?.listContent || [];

        return {
          id: index + 1,
          instruction: ac.content || q.Content,
          audioUrl: audioOf(q),
          subQuestions: list.map((it) => ({
            id: it.ID,
            content: it.content,
            options: it.options || [],
            correctAnswer: it.correctAnswer || null,
          })),
        };
      }),
    };
  }

  return r;
}

function buildReadingDetail(section) {
  const result = {
    SectionID: section.ID,
    SectionName: section.Name,
    SkillName: 'READING',

    part1: null,
    part2A: null,
    part2B: null,
    part3: null,
    part4: null,
  };

  const parts = [...(section.Parts || [])].sort(
    (a, b) => a.Sequence - b.Sequence
  );

  for (const part of parts) {
    const q = part.Questions?.[0];
    if (!q) continue;

    const ac = q.AnswerContent || {};

    /* ======================================================
       PART 1 — dropdown-list (fill-in-blank)
       ====================================================== */
    if (part.Sequence === 1) {
      result.part1 = {
        PartID: part.ID,
        PartName: part.Content,
        Type: 'dropdown-list',
        Content: q.Content,
        Blanks: ac.options || [],
        CorrectAnswers: ac.correctAnswer || [],
      };
    }

    /* ======================================================
       PART 2A — ordering
       ====================================================== */
    if (part.Sequence === 2) {
      result.part2A = {
        PartID: part.ID,
        PartName: part.Content,
        Type: 'ordering',
        Intro: q.Content,
        Items: ac.options || [],
        CorrectOrder: (ac.correctAnswer || []).map((x) => x.key),
      };
    }

    /* ======================================================
       PART 2B — ordering
       ====================================================== */
    if (part.Sequence === 3) {
      result.part2B = {
        PartID: part.ID,
        PartName: part.Content,
        Type: 'ordering',
        Intro: q.Content,
        Items: ac.options || [],
        CorrectOrder: (ac.correctAnswer || []).map((x) => x.key),
      };
    }

    /* ======================================================
       PART 3 — dropdown-matching (leftItems, rightItems, correctAnswer)
       ====================================================== */
    if (part.Sequence === 4) {
      result.part3 = {
        PartID: part.ID,
        PartName: part.Content,
        Type: 'dropdown-matching',
        Content: q.Content,

        LeftItems: ac.leftItems || [],
        RightItems: ac.rightItems || [],

        Mapping: (ac.correctAnswer || []).map((m, i) => ({
          leftIndex: i,
          rightValue: m.value,
        })),
      };
    }

    /* ======================================================
       PART 4 — matching (full-matching)
       ====================================================== */
    if (part.Sequence === 5) {
      result.part4 = {
        PartID: part.ID,
        PartName: part.Content,
        Type: 'full-matching',
        Content: q.Content,

        LeftItems: ac.leftItems || [],
        RightItems: ac.rightItems || [],

        Mapping: (ac.correctAnswer || []).map((m, idx) => ({
          leftIndex: idx,
          rightValue: m.right,
        })),
      };
    }
  }

  return result;
}

function buildWritingDetail(section) {
  const partsBySeq = {};
  section.Parts.forEach((p) => {
    partsBySeq[p.Sequence] = p;
  });

  // PART 1 — Short Answers (5 câu)
  const p1 = partsBySeq[1];
  const part1 = p1
    ? {
        PartID: p1.ID,
        PartName: p1.Content,
        Questions: p1.Questions.map((q) => ({
          id: q.ID,
          question: q.Content,
        })),
      }
    : null;

  // PART 2 — Form Filling (1 câu)
  const p2 = partsBySeq[2];
  const part2 = p2
    ? {
        PartID: p2.ID,
        PartName: p2.Content,
        question: p2.Questions[0]?.Content || '',
        note: p2.Questions[0]?.SubContent || '',
      }
    : null;

  // PART 3 — Chat Room (n câu)
  const p3 = partsBySeq[3];
  const part3 = p3
    ? {
        PartID: p3.ID,
        PartName: p3.Content,
        chats: p3.Questions.map((q) => {
          const [speaker, ...rest] = q.Content.split(':');
          return {
            id: q.ID,
            speaker: speaker?.trim(),
            question: rest.join(':').trim(),
            note: q.SubContent,
          };
        }),
      }
    : null;

  // PART 4 — Email Writing (2 câu)
  const p4 = partsBySeq[4];
  const part4 = p4
    ? {
        PartID: p4.ID,
        PartName: p4.Content,
        emailText: p4.SubContent,
        q1: p4.Questions[0]?.Content || '',
        q1_note: p4.Questions[0]?.SubContent || '',
        q2: p4.Questions[1]?.Content || '',
        q2_note: p4.Questions[1]?.SubContent || '',
      }
    : null;

  return {
    SectionID: section.ID,
    SectionName: section.Name,
    SkillName: 'WRITING',
    part1,
    part2,
    part3,
    part4,
  };
}

function buildSpeakingDetail(section) {
  // Sort theo Sequence
  const sorted = [...section.Parts].sort((a, b) => a.Sequence - b.Sequence);

  const result = {
    SectionID: section.ID,
    SectionName: section.Name,
    SkillName: 'SPEAKING',
  };

  sorted.forEach((part, index) => {
    const key = `part${index + 1}`;

    const questions = part.Questions?.map((q) => q.Content) || [];

    const image =
      part.Questions?.[0]?.ImageKeys?.length > 0
        ? part.Questions[0].ImageKeys[0]
        : null;

    result[key] = {
      PartID: part.ID,
      PartName: part.Content, // Ví dụ: "Part 1", "Part 2"
      SubContent: part.SubContent, // Ví dụ: "Short Q&A"
      Image: image,
      Questions: questions,
      Sequence: part.Sequence,
    };
  });

  return result;
}

function buildGrammarVocabDetail(section) {
  const result = {
    SectionID: section.ID,
    SectionName: section.Name,
    SkillName: 'GRAMMAR AND VOCABULARY',
    part1: null,
    part2: null,
  };

  if (!section?.Parts?.length) return result;

  // sort part by sequence
  const parts = [...section.Parts].sort((a, b) => a.Sequence - b.Sequence);

  /* -------------------------------------------------------
     PART 1 — MULTIPLE CHOICE (Sequence = 1)
  ------------------------------------------------------- */
  const p1 = parts.find((p) => p.Sequence === 1);
  if (p1) {
    result.part1 = {
      PartID: p1.ID,
      PartName: p1.Content,
      questions: (p1.Questions || [])
        .sort((a, b) => a.Sequence - b.Sequence)
        .map((q) => {
          const answer = q.AnswerContent || {};
          return {
            QuestionID: q.ID,
            Sequence: q.Sequence,
            instruction: q.Content,
            options: answer.options || [],
            correctAnswer: answer.correctAnswer || null,
          };
        }),
    };
  }

  /* -------------------------------------------------------
     PART 2 — MATCHING (Sequence = 2)
  ------------------------------------------------------- */
  const p2 = parts.find((p) => p.Sequence === 2);
  if (p2) {
    // Convert each question → matching group
    result.part2 = {
      PartID: p2.ID,
      PartName: p2.Content,
      groups: (p2.Questions || [])
        .sort((a, b) => a.Sequence - b.Sequence)
        .map((q) => {
          const answer = q.AnswerContent || {};
          return {
            GroupID: q.ID,
            Sequence: q.Sequence,
            content: q.Content,
            leftItems: answer.leftItems || [],
            rightItems: answer.rightItems || [],
            mapping: (answer.correctAnswer || []).map((m) => ({
              left: m.left,
              right: m.right,
            })),
          };
        }),
    };
  }

  return result;
}

/* ============================================================
   GET SECTION DETAIL BY SKILL
   API: GET /sections/:id?skillName=LISTENING
   ============================================================ */
async function getSectionDetail(req) {
  try {
    const { id } = req.params;
    const skillName = req.query.skillName?.toUpperCase();

    if (!id) {
      return { status: 400, message: 'Section ID is required' };
    }

    if (!skillName) {
      return {
        status: 400,
        message:
          'skillName query param is required. Example: ?skillName=LISTENING',
      };
    }

    // Fetch Section + Parts + Questions
    const section = await Section.findOne({
      where: { ID: id },
      include: [
        {
          model: Part,
          as: 'Parts',
          include: [{ model: Question, as: 'Questions' }],
          order: [['Sequence', 'ASC']],
        },
      ],
    });

    if (!section) {
      return { status: 404, message: `Section with id ${id} not found` };
    }

    switch (skillName) {
      case 'LISTENING':
        return {
          status: 200,
          message: 'Listening detail fetched successfully',
          data: buildListeningDetail(section),
        };

      case 'READING':
        return {
          status: 200,
          message: 'Reading detail fetched successfully',
          data: buildReadingDetail(section),
        };

      case 'WRITING':
        return {
          status: 200,
          message: 'Writing detail fetched successfully',
          data: buildWritingDetail(section),
        };

      case 'SPEAKING':
        return {
          status: 200,
          message: 'Speaking detail fetched successfully',
          data: buildSpeakingDetail(section),
        };

      case 'GRAMMAR AND VOCABULARY':
        return {
          status: 200,
          message: 'Gammar and vocabular detail fetched successfully',
          data: buildGrammarVocabDetail(section),
        };

      default:
        return { status: 400, message: `Unsupported skillName: ${skillName}` };
    }
  } catch (error) {
    return {
      status: 500,
      message: `Error fetching section detail: ${error.message}`,
    };
  }
}

module.exports = {
  getAllSection,
  updateSection,
  deleteSection,
  getSectionDetail,
};
