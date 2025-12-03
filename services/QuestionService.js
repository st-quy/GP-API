const {
  Question,
  TopicPart,
  QuestionSet,
  QuestionSetQuestion,
  Skill,
  Part,
  User,
  sequelize,
  Section,
  SectionPart,
} = require('../models');
const {
  buildSpeakingAnswerContent,
  buildReadingAnswerContent,
} = require('../utils/question-create.util');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

async function getAllQuestions(req) {
  try {
    const {
      page = 1,
      pageSize = 10,
      search,
      skillName,
      partId,
      type,
    } = req.query;

    const limit = Number(pageSize) > 0 ? Number(pageSize) : 10;
    const offset = (Number(page) - 1) * limit;

    const whereQuestion = {};
    const include = [
      {
        model: User,
        as: 'creator',
        attributes: ['ID', 'lastName', 'firstName', 'email'],
      },
      {
        model: User,
        as: 'updater',
        attributes: ['ID', 'lastName', 'firstName', 'email'],
      },
    ];

    if (search) {
      const s = search.trim();
      if (s) {
        whereQuestion.Content = { [Op.iLike]: `%${s}%` };
      }
    }

    // 🔍 Filter by question type
    if (type) {
      whereQuestion.Type = type;
    }

    // --------------------------------------------------
    // PART + SKILL (Skill belongsTo Part)
    // --------------------------------------------------
    const partInclude = {
      model: Part,
      required: !!(partId || skillName),
      include: [
        {
          model: Skill,
          as: 'Skill',
          attributes: ['ID', 'Name'],
          ...(skillName && {
            where: {
              Name: { [Op.iLike]: skillName },
            },
            required: true,
          }),
        },
      ],
    };

    if (partId) {
      partInclude.where = { ID: partId };
      partInclude.required = true;
    }

    include.push(partInclude);

    // --------------------------------------------------
    // Execute query
    // --------------------------------------------------
    const { rows, count } = await Question.findAndCountAll({
      where: whereQuestion,
      include,
      limit,
      offset,
      order: [['updatedAt', 'DESC']],
      distinct: true,
    });

    return {
      status: 200,
      message: 'Questions fetched successfully',
      data: {
        items: rows,
        pagination: {
          page: Number(page),
          pageSize: limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    };
  } catch (error) {
    throw new Error(`Error fetching questions: ${error.message}`);
  }
}

async function createQuestion(req) {
  try {
    const {
      Type,
      AudioKeys,
      ImageKeys,
      SkillID,
      PartID,
      Sequence,
      Content,
      SubContent,
      GroupContent,
      AnswerContent,
      GroupID,
    } = req.body;

    if (!Type || !SkillID || !PartID || !Sequence || !Content || !GroupID) {
      return {
        status: 400,
        message:
          'Type, SkillID, PartID, Sequence, Content, and GroupID are required fields',
      };
    }

    const newQuestion = await Question.create({
      Type,
      AudioKeys,
      ImageKeys,
      SkillID,
      PartID,
      Sequence,
      Content,
      SubContent,
      GroupContent,
      AnswerContent,
      GroupID,
      GroupID,
    });

    return {
      status: 201,
      message: 'Question created successfully',
      data: newQuestion,
    };
  } catch (error) {
    throw new Error(`Error creating question: ${error.message}`);
  }
}

async function createQuestionGroup(req) {
  const t = await sequelize.transaction();

  try {
    const { SkillName, parts } = req.body;
    const userId = req?.user?.userId;

    if (!SkillName || !Array.isArray(parts) || parts.length === 0) {
      await t.rollback();
      return { status: 400, message: 'SkillName and parts[] are required' };
    }

    // 1) Check Skill
    const skill = await Skill.findOne({ where: { Name: SkillName } });
    if (!skill) {
      await t.rollback();
      return { status: 400, message: `Skill "${SkillName}" does not exist` };
    }

    const skillLower = SkillName.toLowerCase();

    const createdParts = [];
    const createdQuestions = [];

    // 2) Lặp từng part FE gửi
    for (const p of parts) {
      if (!p.name) {
        await t.rollback();
        return { status: 400, message: 'Each part must have a name' };
      }

      // Kiểm tra Part đã tồn tại
      const existed = await Part.findOne({
        where: { SkillID: skill.ID, Content: p.name.trim() },
        transaction: t,
      });

      if (existed) {
        await t.rollback();
        return {
          status: 400,
          message: `Part "${p.name}" already exists`,
        };
      }

      // 3) Tạo Part
      const newPart = await Part.create(
        {
          ID: uuidv4(),
          SkillID: skill.ID,
          Content: p.name,
          SubContent: null,
          Sequence: createdParts.length + 1,
          CreatedBy: userId || null,
          UpdatedBy: userId || null,
        },
        { transaction: t }
      );

      createdParts.push(newPart);

      // Validate question list
      if (!Array.isArray(p.questions) || p.questions.length === 0) {
        await t.rollback();
        return { status: 400, message: `Part "${p.name}" must have questions` };
      }

      // 4) Tạo question cho từng part
      for (let i = 0; i < p.questions.length; i++) {
        const q = p.questions[i];

        if (!q.Type || !q.Content) {
          await t.rollback();
          return {
            status: 400,
            message: `Question in part "${p.name}" missing Type or Content`,
          };
        }

        const imageKeys = p.image ? [p.image] : [];

        let answerContent = q.AnswerContent || null;

        if (!answerContent) {
          if (skillLower === 'speaking') {
            answerContent = buildSpeakingAnswerContent(
              { ...q, ImageKeys: imageKeys },
              newPart.ID
            );
          }
          if (skillLower === 'reading') {
            answerContent = buildReadingAnswerContent(q, newPart.ID);
          }
        }

        const newQuestion = await Question.create(
          {
            ID: uuidv4(),
            Type: q.Type,
            AudioKeys: q.AudioKeys || null,
            ImageKeys: imageKeys,
            SkillID: skill.ID,
            PartID: newPart.ID,
            PartContent: p.name,
            Sequence: i + 1,
            Content: q.Content,
            SubContent: q.SubContent || null,
            GroupContent: q.GroupContent || null,
            AnswerContent: answerContent,
            CreatedBy: userId || null,
            UpdatedBy: userId || null,
          },
          { transaction: t }
        );

        createdQuestions.push(newQuestion);
      }
    }

    await t.commit();

    return {
      status: 201,
      message: 'Parts + Questions created successfully',
      data: { parts: createdParts, questions: createdQuestions },
    };
  } catch (err) {
    await t.rollback();
    throw new Error(`Error creating question group: ${err.message}`);
  }
}

async function createSpeakingGroup(req, res) {
  try {
    const { SkillName, SectionName, parts } = req.body;
    const userId = req.user?.userId;

    if (!SkillName || !parts || !SectionName) {
      return {
        status: 400,
        message: 'SkillName, SectionName and parts[] are required',
      };
    }

    const skill = await Skill.findOne({ where: { Name: SkillName } });
    if (!skill) {
      return {
        status: 400,
        message: `Skill "${SkillName}" does not exist`,
      };
    }

    let section = await Section.findOne({ where: { Name: SectionName } });
    if (!section) {
      section = await Section.create(
        {
          ID: uuidv4(),
          SkillID: skill.ID,
          Name: SectionName,
          Description: null,
        },
        { transaction: t }
      );
    }

    const partKeys = Object.keys(parts);

    const result = await sequelize.transaction(async (t) => {
      let createdParts = {};

      // =========== 1) CREATE / UPDATE 4 PART ===============
      for (const key of partKeys) {
        const p = parts[key];

        if (!p || !p.name) {
          throw new Error(`Part "${key}" missing name`);
        }

        let partRow = null;

        // ❗ Nếu FE gửi PartID → Update
        if (p.id) {
          partRow = await Part.findByPk(p.id, { transaction: t });

          if (!partRow) {
            throw new Error(`PartID ${p.id} not found`);
          }

          await partRow.update(
            {
              Content: p.name,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        } else {
          // ❗ Nếu FE không gửi PartID → create 1 lần duy nhất
          partRow = await Part.create(
            {
              ID: uuidv4(),
              SkillID: skill.ID,
              Content: p.name,
              SubContent: null,
              Sequence: p.sequence,
              CreatedBy: userId,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        }

        createdParts[key] = partRow;
      }

      // ============ 2) CREATE QUESTIONS =============
      // Trước khi tạo mới → xoá hết question cũ
      const partIds = Object.values(createdParts).map((p) => p.ID);

      await Question.destroy(
        {
          where: {
            PartID: partIds,
            Type: 'speaking',
          },
        },
        { transaction: t }
      );

      let questionPayload = [];

      // Tạo question cho từng part
      for (const key of partKeys) {
        const p = parts[key];
        const partRow = createdParts[key];

        const imageKeys = p.image ? [p.image] : [];
        const qs = Array.isArray(p.questions) ? p.questions : [];

        qs.forEach((q, idx) => {
          const content = q.value.trim();

          questionPayload.push({
            ID: uuidv4(),
            Type: 'speaking',
            SkillID: skill.ID,
            PartID: partRow.ID,
            Sequence: idx + 1,
            Content: content,
            SubContent: null,
            GroupContent: null,
            ImageKeys: imageKeys,
            AudioKeys: null,
            AnswerContent: buildSpeakingAnswerContent({
              content,
              imageKeys,
              partID: partRow.ID,
            }),
            CreatedBy: userId,
            UpdatedBy: userId,
          });
        });
      }

      await Question.bulkCreate(questionPayload, {
        returning: true,
        transaction: t,
      });

      // ============ 3) LINK SECTION <-> PART =============
      // Xoá mapping cũ
      await SectionPart.destroy(
        {
          where: { SectionID: section.ID },
        },
        { transaction: t }
      );

      // Tạo mapping mới
      await SectionPart.bulkCreate(
        partIds.map((partID, idx) => ({
          ID: uuidv4(),
          SectionID: section.ID,
          PartID: partID,
          Sequence: idx + 1,
        })),
        { transaction: t }
      );

      return createdParts;
    });

    return {
      status: 201,
      message: 'Speaking created successfully',
      parts: result,
    };
  } catch (error) {
    return {
      status: 500,
      message: error.message,
    };
  }
}
async function createReadingGroup(req, res) {
  try {
    const { SkillName, SectionName, parts } = req.body;
    const userId = req.user?.userId;

    if (!SkillName || !parts || !SectionName) {
      return {
        status: 400,
        message: 'SkillName, SectionName and parts[] are required',
      };
    }

    // 0) VALIDATE SKILL
    const skill = await Skill.findOne({ where: { Name: SkillName } });
    if (!skill) {
      return {
        message: `Skill "${SkillName}" does not exist`,
      };
    }

    // 1) VALIDATE 5 PARTS (AUTO VALIDATION)
    // parts.forEach((p) => validatePartStructure(p));

    // -----------------------------------------
    // 1) FIND OR CREATE SECTION
    // -----------------------------------------
    let section = await Section.findOne({
      where: { Name: SectionName },
    });

    if (!section) {
      section = await Section.create({
        ID: uuidv4(),
        SkillID: skill.ID,
        Name: SectionName,
        Description: null,
      });
    }

    // 2) TRANSACTION
    const result = await sequelize.transaction(async (t) => {
      const finalParts = [];

      for (const p of parts) {
        let partRow;

        // =====================
        // 2A) UPDATE EXISTING PART
        // =====================
        if (p.PartID) {
          partRow = await Part.findByPk(p.PartID, { transaction: t });

          if (!partRow) {
            throw new Error(`PartID ${p.PartID} not found`);
          }

          await partRow.update(
            {
              PartName: p.PartName,
              Content: p.Content,
              Type: p.Type,
              Sequence: p.Sequence,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        }

        // =====================
        // 2B) CREATE NEW PART (first time)
        // =====================
        else {
          partRow = await Part.create(
            {
              ID: uuidv4(),
              SkillID: skill.ID,
              Type: p.Type,
              Content: p.PartName,
              Sequence: p.Sequence,
              SubContent: null,
              CreatedBy: userId,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        }

        // =====================
        // ALWAYS REMOVE OLD QUESTIONS
        // =====================
        await Question.destroy(
          {
            where: { PartID: partRow.ID },
          },
          { transaction: t }
        );

        // =====================
        // 3) CREATE QUESTION FOR THIS PART
        // =====================
        await Question.create(
          {
            ID: uuidv4(),
            PartID: partRow.ID,
            Type: p.Type,
            Sequence: 1, // ALWAYS 1 for READING
            Content: p.Content,
            AnswerContent: p.AnswerContent,
            ImageKeys: null,
            AudioKeys: null,
            GroupContent: null,
            CreatedBy: userId,
            UpdatedBy: userId,
          },
          { transaction: t }
        );

        finalParts.push(partRow);
      }

      // -----------------------------------------
      // 3) LINK PARTS ↔ SECTION (SectionPart TABLE)
      // -----------------------------------------
      const partIds = finalParts.map((p) => p.ID);

      // Delete old mapping
      await SectionPart.destroy(
        {
          where: { SectionID: section.ID },
        },
        { transaction: t }
      );

      // Re-create mapping by Sequence
      await SectionPart.bulkCreate(
        finalParts
          .sort((a, b) => a.Sequence - b.Sequence)
          .map((p) => ({
            ID: uuidv4(),
            SectionID: section.ID,
            PartID: p.ID,
            Sequence: p.Sequence,
          })),
        { transaction: t }
      );

      return finalParts;
    });

    return {
      status: 201,
      message: 'Reading parts created/updated successfully',
      parts: result,
    };
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}

async function createWritingGroup(req, res) {
  const t = await sequelize.transaction();
  try {
    const { SectionName, parts } = req.body;
    const userId = req.user?.userId;

    if (!SectionName || !parts) {
      return {
        message: 'SectionName and parts are required',
      };
    }

    // ============ 0) Tìm Skill WRITING ============
    const skill = await Skill.findOne({
      where: { Name: 'WRITING' },
    });

    if (!skill) {
      return {
        message: 'Skill WRITING does not exist',
      };
    }

    // ============ 1) Tạo Section nếu chưa có ============
    let section = await Section.findOne({
      where: { Name: SectionName },
    });

    if (!section) {
      section = await Section.create(
        {
          ID: uuidv4(),
          SkillID: skill.ID,
          Name: SectionName,
          Description: null,
          CreatedBy: userId,
          UpdatedBy: userId,
        },
        { transaction: t }
      );
    }

    // ===================================================
    // 2) Tạo 4 PART (luôn create — không update)
    // ===================================================

    const createdParts = {}; // { part1: PartRow, part2: PartRow, part3: PartRow, part4: PartRow }

    const partDefinitions = [
      { key: 'part1', sequence: 1 },
      { key: 'part2', sequence: 2 },
      { key: 'part3', sequence: 3 },
      { key: 'part4', sequence: 4 },
    ];

    for (const def of partDefinitions) {
      const p = parts[def.key];

      if (!p || !p.name) {
        throw new Error(`Missing name for ${def.key}`);
      }

      const newPart = await Part.create(
        {
          ID: uuidv4(),
          SkillID: skill.ID,
          Content: p.name,
          SubContent: p.subContent || null,
          Sequence: def.sequence,
          CreatedBy: userId,
          UpdatedBy: userId,
        },
        { transaction: t }
      );

      createdParts[def.key] = newPart;
    }

    const partIds = Object.values(createdParts).map((x) => x.ID);

    // ===================================================
    // 3) Xóa question cũ của toàn bộ 4 part
    // ===================================================
    await Question.destroy(
      {
        where: {
          PartID: partIds,
          Type: 'writing',
        },
      },
      { transaction: t }
    );

    // ===================================================
    // 4) CREATE ALL QUESTIONS
    // ===================================================
    const bulkQuestions = [];

    // ---------- PART 1: Short Answers ----------
    if (parts.part1?.questions) {
      parts.part1.questions.forEach((q, idx) => {
        bulkQuestions.push({
          ID: uuidv4(),
          Type: 'writing',
          SkillID: skill.ID,
          PartID: createdParts.part1.ID,
          Sequence: idx + 1,
          Content: q.question,
          SubContent: null,
          GroupContent: null,
          AudioKeys: null,
          ImageKeys: null,
          AnswerContent: null,
          CreatedBy: userId,
          UpdatedBy: userId,
        });
      });
    }

    // ---------- PART 2: Form Filling ----------
    if (parts.part2?.question) {
      bulkQuestions.push({
        ID: uuidv4(),
        Type: 'writing',
        SkillID: skill.ID,
        PartID: createdParts.part2.ID,
        Sequence: 1,
        Content: parts.part2.question,
        SubContent: '',
        GroupContent: null,
        AudioKeys: null,
        ImageKeys: null,
        AnswerContent: null,
        CreatedBy: userId,
        UpdatedBy: userId,
      });
    }

    // ---------- PART 3: Chat Room ----------
    if (parts.part3?.chats) {
      parts.part3.chats.forEach((c, idx) => {
        bulkQuestions.push({
          ID: uuidv4(),
          Type: 'writing',
          SkillID: skill.ID,
          PartID: createdParts.part3.ID,
          Sequence: idx + 1,
          Content: `${c.speaker}: ${c.question}`,
          SubContent: '',
          GroupContent: null,
          AudioKeys: null,
          ImageKeys: null,
          AnswerContent: null,
          CreatedBy: userId,
          UpdatedBy: userId,
        });
      });
    }

    // ---------- PART 4: Email Writing ----------
    if (parts.part4?.q1) {
      bulkQuestions.push({
        ID: uuidv4(),
        Type: 'writing',
        SkillID: skill.ID,
        PartID: createdParts.part4.ID,
        Sequence: 1,
        Content: parts.part4.q1,
        SubContent: `* (Up to ${parts.part4.q1_wordLimit} words allowed)`,
        GroupContent: null,
        AudioKeys: null,
        ImageKeys: null,
        AnswerContent: null,
        CreatedBy: userId,
        UpdatedBy: userId,
      });
    }

    if (parts.part4?.q2) {
      bulkQuestions.push({
        ID: uuidv4(),
        Type: 'writing',
        SkillID: skill.ID,
        PartID: createdParts.part4.ID,
        Sequence: 2,
        Content: parts.part4.q2,
        SubContent: `* (Up to ${parts.part4.q2_wordLimit} words allowed)`,
        GroupContent: null,
        AudioKeys: null,
        ImageKeys: null,
        AnswerContent: null,
        CreatedBy: userId,
        UpdatedBy: userId,
      });
    }

    // Create all questions
    await Question.bulkCreate(bulkQuestions, { transaction: t });

    // ===================================================
    // 5) Re-link Section ↔ Parts
    // ===================================================
    await SectionPart.destroy(
      { where: { SectionID: section.ID } },
      { transaction: t }
    );

    await SectionPart.bulkCreate(
      partIds.map((pid, idx) => ({
        ID: uuidv4(),
        SectionID: section.ID,
        PartID: pid,
        Sequence: idx + 1,
      })),
      { transaction: t }
    );

    await t.commit();

    return {
      status: 201,
      message: 'Writing group created successfully',
      parts: createdParts,
    };
  } catch (err) {
    await t.rollback();
    return {
      message: err.message,
    };
  }
}
async function createListeningGroup(req, res) {
  try {
    const { SkillName, SectionName, parts } = req.body;
    const userId = req.user?.userId;

    if (!SkillName || !SectionName || !parts) {
      return {
        status: 400,
        message: 'SkillName, SectionName and parts{} are required',
      };
    }

    const skill = await Skill.findOne({ where: { Name: SkillName } });
    if (!skill) {
      return {
        status: 400,
        message: `Skill "${SkillName}" does not exist`,
      };
    }

    // ======================================
    //  SECTION CREATE / UPDATE
    // ======================================
    let section = await Section.findOne({ where: { Name: SectionName } });

    if (!section) {
      section = await Section.create({
        ID: uuidv4(),
        SkillID: skill.ID,
        Name: SectionName,
        Description: null,
      });
    }

    const partKeys = Object.keys(parts);

    const result = await sequelize.transaction(async (t) => {
      let createdParts = {};

      // =====================================================
      // 1) CREATE / UPDATE PART (4 part)
      // =====================================================
      for (const key of partKeys) {
        const p = parts[key];

        if (!p || !p.name) throw new Error(`Part "${key}" missing name`);

        let partRow = null;

        if (p.id) {
          // UPDATE
          partRow = await Part.findByPk(p.id, { transaction: t });

          if (!partRow) throw new Error(`PartID ${p.id} not found`);

          await partRow.update(
            {
              Content: p.name,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        } else {
          // CREATE
          partRow = await Part.create(
            {
              ID: uuidv4(),
              SkillID: skill.ID,
              Content: p.name,
              SubContent: null,
              Sequence: p.sequence, // FE gửi sequence 1-4
              CreatedBy: userId,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        }

        createdParts[key] = partRow;
      }

      // =====================================================
      // 2) DELETE OLD QUESTIONS OF THESE PARTS
      // =====================================================
      const partIds = Object.values(createdParts).map((p) => p.ID);

      await Question.destroy(
        {
          where: {
            PartID: partIds,
          },
        },
        { transaction: t }
      );

      // =====================================================
      // 3) BUILD QUESTION PAYLOAD FOR EACH PART
      // =====================================================
      let questionPayload = [];

      for (const key of partKeys) {
        const partData = parts[key];
        const partRow = createdParts[key];

        const qs = Array.isArray(partData.questions) ? partData.questions : [];

        qs.forEach((q, idx) => {
          const questionId = uuidv4();

          questionPayload.push({
            ID: questionId,
            Type: q.Type, // multiple-choice | dropdown-list | listening-questions-group
            SkillID: skill.ID,
            PartID: partRow.ID,
            Sequence: idx + 1,
            Content: q.Content,
            SubContent: q.SubContent || null,
            GroupContent: q.GroupContent || null,
            ImageKeys: null,
            AudioKeys: q.AudioKeys || null,
            AnswerContent: JSON.stringify(q.AnswerContent), // FE đã build đúng format
            CreatedBy: userId,
            UpdatedBy: userId,
          });
        });
      }

      // CREATE ALL QUESTIONS
      await Question.bulkCreate(questionPayload, {
        returning: true,
        transaction: t,
      });

      // =====================================================
      // 4) UPDATE SECTION PART MAPPING
      // =====================================================
      await SectionPart.destroy(
        {
          where: { SectionID: section.ID },
        },
        { transaction: t }
      );

      await SectionPart.bulkCreate(
        partIds.map((partID, idx) => ({
          ID: uuidv4(),
          SectionID: section.ID,
          PartID: partID,
          Sequence: idx + 1,
        })),
        { transaction: t }
      );

      return createdParts;
    });

    return {
      status: 201,
      message: 'Listening created successfully',
      parts: result,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: error.message,
    };
  }
}

async function createGrammarAndVocabGroup(req, res) {
  try {
    const { SkillName, SectionName, parts } = req.body;
    const userId = req.user?.userId;

    if (!SkillName || !SectionName || !parts) {
      return {
        status: 400,
        message: 'SkillName, SectionName and parts are required',
      };
    }

    // ================================
    // 0. VALIDATE SKILL
    // ================================
    const skill = await Skill.findOne({ where: { Name: SkillName } });
    if (!skill) {
      return {
        status: 400,
        message: `Skill "${SkillName}" does not exist`,
      };
    }

    // ================================
    // 1. CREATE / FIND SECTION
    // ================================
    let section = await Section.findOne({ where: { Name: SectionName } });

    if (!section) {
      section = await Section.create({
        ID: uuidv4(),
        SkillID: skill.ID,
        Name: SectionName,
        Description: null,
      });
    }

    // ================================
    // 2. TRANSACTION
    // ================================
    const result = await sequelize.transaction(async (t) => {
      let createdParts = [];

      // Convert FE parts OBJECT → ARRAY
      const partList = Object.values(parts);

      // ============================================
      // 2A. CREATE / UPDATE PARTS
      // ============================================
      for (let i = 0; i < partList.length; i++) {
        const FE = partList[i];

        if (!FE.name) throw new Error(`Part[${i}] missing "name"`);

        let partRow;

        if (FE.PartID) {
          // UPDATE PART
          partRow = await Part.findByPk(FE.PartID, { transaction: t });
          if (!partRow)
            throw new Error(`PartID ${FE.PartID} not found for update`);

          await partRow.update(
            {
              Content: FE.name,
              SubContent: null,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        } else {
          // CREATE PART
          partRow = await Part.create(
            {
              ID: uuidv4(),
              SkillID: skill.ID,
              Content: FE.name,
              SubContent: null,
              Sequence: FE.sequence ?? i + 1,
              CreatedBy: userId,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        }

        createdParts.push({ FE, DB: partRow });
      }

      // ============================================
      // 2B. DELETE OLD QUESTIONS OF THESE PARTS
      // ============================================
      const partIds = createdParts.map((p) => p.DB.ID);

      await Question.destroy({
        where: { PartID: partIds },
        transaction: t,
      });

      // ============================================
      // 2C. INSERT NEW QUESTIONS
      // ============================================
      const questionPayload = [];

      for (let i = 0; i < createdParts.length; i++) {
        const { FE, DB } = createdParts[i];

        const questions = FE.questions || [];

        questions.forEach((q, idx) => {
          questionPayload.push({
            ID: uuidv4(),
            Type: q.Type, // multiple-choice | matching
            SkillID: skill.ID,
            PartID: DB.ID,
            Sequence: idx + 1,
            Content: q.Content,
            SubContent: q.SubContent || null,
            GroupContent: q.GroupContent || null,
            AudioKeys: q.AudioKeys || null,
            ImageKeys: q.ImageKeys || null,
            AnswerContent: q.AnswerContent,
            CreatedBy: userId,
            UpdatedBy: userId,
          });
        });
      }

      if (questionPayload.length > 0) {
        await Question.bulkCreate(questionPayload, {
          returning: true,
          transaction: t,
        });
      }

      // ============================================
      // 2D. UPDATE SECTION-PART MAPPING
      // ============================================
      await SectionPart.destroy({
        where: { SectionID: section.ID },
        transaction: t,
      });

      const newMappings = createdParts.map((p, idx) => ({
        ID: uuidv4(),
        SectionID: section.ID,
        PartID: p.DB.ID,
        Sequence: idx + 1,
      }));

      await SectionPart.bulkCreate(newMappings, {
        returning: true,
        transaction: t,
      });

      return createdParts.map((p) => p.DB);
    });

    return {
      status: 201,
      message: 'Grammar & Vocabulary created successfully',
      parts: result,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: error.message,
    };
  }
}

async function getQuestionsByPartID(req) {
  try {
    const { partId } = req.params;

    if (!partId) {
      return { status: 400, message: 'PartID is required' };
    }

    const questions = await Question.findAll({
      where: { PartID: partId },
      order: [['createdAt', 'DESC']],
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    if (!questions || questions.length === 0) {
      return {
        status: 404,
        message: 'No questions found for this part',
      };
    }

    return {
      status: 200,
      message: `Found questions for PartID: ${partId}`,
      data: questions,
    };
  } catch (error) {
    throw new Error(`Error fetching questions: ${error.message}`);
  }
}

async function getQuestionByID(req) {
  try {
    const { questionId } = req.params;

    const question = await Question.findByPk(questionId, {
      include: [
        {
          model: Part,
          include: [
            {
              model: Skill,
              as: 'Skill',
              attributes: ['ID', 'Name'],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['ID', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'updater',
          attributes: ['ID', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!question) {
      return {
        status: 404,
        message: 'Question not found',
      };
    }

    return {
      status: 200,
      message: 'Question retrieved successfully',
      data: question,
    };
  } catch (error) {
    throw new Error(`Error fetching question: ${error.message}`);
  }
}

async function getQuestionsByQuestionSetID(req) {
  try {
    const { questionSetId } = req.params;
    const { questionType, skillName } = req.query;

    const questionFilter = {};
    if (questionType) questionFilter.Type = questionType;

    const skillFilter = {};
    if (skillName) skillFilter.Name = skillName;

    const questionSet = await QuestionSet.findOne({
      where: { ID: questionSetId },
      include: [
        {
          model: QuestionSetQuestion,
          as: 'Questions',
          include: [
            {
              model: Question,
              as: 'Question',
              where: questionFilter,
              include: [
                { model: Skill, as: 'Skill', where: skillFilter },
                { model: Part, as: 'Part' },
              ],
            },
          ],
          order: [['Sequence', 'ASC']],
        },
      ],
      order: [
        [{ model: QuestionSetQuestion, as: 'Questions' }, 'Sequence', 'ASC'],
      ],
    });

    if (!questionSet) {
      return {
        status: 404,
        message: `QuestionSet with id ${questionSetId} not found`,
      };
    }

    const questions = questionSet.Questions.map((item) => ({
      ...item.Question.dataValues,
      Sequence: item.Sequence,
    }));

    const orderedQuestions = _.sortBy(questions, ['Sequence']);

    return {
      status: 200,
      message: 'Questions fetched successfully',
      data: {
        questionSetId,
        shuffleQuestions: questionSet.ShuffleQuestions,
        shuffleAnswers: questionSet.ShuffleAnswers,
        questions: orderedQuestions,
      },
    };
  } catch (error) {
    throw new Error(
      `Error fetching questions for QuestionSet: ${error.message}`
    );
  }
}

async function getQuestionsByTopicID(req) {
  try {
    const { TopicPartId, PartID } = req.params;
    const { TopicID } = req.query;

    const questions = await Question.findAll({
      include: [
        {
          model: TopicPart,
          where: {
            ID: TopicPartId,
            TopicID: TopicID,
          },
        },
      ],
      where: { PartID: PartID },
      order: [['createdAt', 'DESC']],
      raw: true,
    });
    if (!questions || questions.length === 0) {
      return {
        status: 404,
        message: 'No questions found for this topic part',
      };
    } else {
      return {
        status: 200,
        message: `Found questions for TopicPartID: ${TopicPartId} and PartID: ${PartID}`,
        data: questions,
      };
    }
  } catch (error) {
    throw new Error(`Error fetching questions: ${error.message}`);
  }
}

async function updateQuestion(req) {
  try {
    const { questionId } = req.params;
    const updatedData = req.body;

    const question = await Question.findByPk(questionId);
    if (!question) {
      return {
        status: 404,
        message: 'Question not found',
      };
    }

    await question.update(updatedData);

    return {
      status: 200,
      message: 'Question updated successfully',
      data: question,
    };
  } catch (error) {
    throw new Error(`Error updating question: ${error.message}`);
  }
}

async function deleteQuestion(req) {
  try {
    const { questionId } = req.params;

    const deletedRows = await Question.destroy({
      where: { ID: questionId },
    });

    if (deletedRows === 0) {
      return {
        status: 404,
        message: 'Question not found',
      };
    }

    return {
      status: 200,
      message: `Question with ID ${questionId} deleted successfully`,
    };
  } catch (error) {
    throw new Error(`Error deleting question: ${error.message}`);
  }
}

module.exports = {
  getAllQuestions,
  createQuestion,
  createQuestionGroup,
  getQuestionByID,
  updateQuestion,
  deleteQuestion,
  getQuestionsByPartID,
  getQuestionsByTopicID,
  getQuestionsByQuestionSetID,
  createSpeakingGroup,
  createReadingGroup,
  createWritingGroup,
  createListeningGroup,
  createGrammarAndVocabGroup,
};
