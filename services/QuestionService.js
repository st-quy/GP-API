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
const {
  validateSpeakingPayload,
  validateWritingPayload,
  validateListeningPayload,
} = require('../utils/question-bank.validation');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const Response = require('./ServiceResponse');
const { logActivity } = require('./ActivityLogService');

function normalizeTags(input) {
  if (input === null || input === undefined) return [];

  const raw = Array.isArray(input) ? input : String(input).split(',');

  return [...new Set(raw.map((tag) => String(tag).trim()).filter(Boolean))];
}

function parseTagsQuery(tagsQuery) {
  if (!tagsQuery) return [];

  if (Array.isArray(tagsQuery)) {
    return normalizeTags(tagsQuery.flatMap((value) => String(value).split(',')));
  }

  return normalizeTags(tagsQuery);
}

async function getAllQuestions(req) {
  try {
    const {
      page = 1,
      pageSize = 10,
      search,
      skillName,
      partId,
      type,
      tags,
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

    // Tag-based filtering is currently disabled because the Question model/DB
    // schema does not yet define a Tags column. Once Tags is added to the
    // model and migrated, this can be re-enabled.
    // const parsedTags = parseTagsQuery(tags);
    // if (parsedTags.length > 0) {
    //   whereQuestion.Tags = { [Op.overlap]: parsedTags };
    // }

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
      Tags,
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
      Tags: normalizeTags(Tags),
    });

    const userIdFromReq = req.user?.userId || null;
    logActivity({
      userId: userIdFromReq,
      action: 'create',
      entityType: 'question',
      entityID: newQuestion.ID,
      entityName: Content?.substring(0, 50) || 'Question',
      details: `Question created (Type: ${Type})`,
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
    const { SkillName, parts, Status, tags, Tags } = req.body;
    const normalizedTags = tags || Tags;
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
            Tags: normalizeTags([...(q.Tags || q.tags || []), ...(normalizedTags || [])]),
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

async function createSpeakingGroup(req) {
  try {
    const { SkillName, SectionName, Description, parts, Status, tags, Tags } = req.body;
    const normalizedTags = tags || Tags;
    const userId = req.user?.userId;

    // For drafts, be more lenient with validation
    if (Status === 'draft') {
      if (!SkillName || !parts) {
        return {
          status: 400,
          message: 'SkillName and parts are required',
        };
      }
    } else {
      if (!SkillName || !parts || !SectionName) {
        return {
          status: 400,
          message: 'SkillName, SectionName and parts[] are required',
        };
      }

      const speakingValidationError = validateSpeakingPayload({
        SectionName,
        parts,
      });
      if (speakingValidationError) {
        return {
          status: 400,
          message: speakingValidationError,
        };
      }
    }

    const skill = await Skill.findOne({ where: { Name: SkillName } });
    if (!skill) {
      return {
        status: 400,
        message: `Skill "${SkillName}" does not exist`,
      };
    }

    const result = await sequelize.transaction(async (t) => {
      /* =====================================================
         1) CREATE SECTION (INSIDE TRANSACTION)
      ===================================================== */
      const section = await Section.create(
        {
          ID: uuidv4(),
          SkillID: skill.ID,
          Name: SectionName || 'Untitled Draft',
          Description: Description?.trim() || null,
          Status: Status || 'draft',
        },
        { transaction: t }
      );

      /* =====================================================
         2) CREATE / UPDATE PARTS
      ===================================================== */
      // Handle both object and array formats
      const partsArray = Array.isArray(parts) ? parts : Object.values(parts);
      const createdParts = {};
      const partIds = [];

      for (let i = 0; i < partsArray.length; i++) {
        const p = partsArray[i];
        if (!p) continue;

        const hasQuestions = Array.isArray(p.questions) && p.questions.some((q) => q?.value?.trim() || q?.content?.trim());
        const hasName = p.name && p.name.trim();

        // Skip parts that have neither a name nor questions (true empty parts)
        if (!hasName && !hasQuestions) {
          continue;
        }

        // Ensure part has a name (use default for drafts)
        const partName = p.name || `Part ${p.sequence || (i + 1)}`;

        let partRow = null;

        if (p.id) {
          // Update
          partRow = await Part.findByPk(p.id, { transaction: t });

          if (!partRow) {
            throw new Error(`PartID ${p.id} not found`);
          }

          await partRow.update(
            {
              Content: partName,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        } else {
          // Create
          partRow = await Part.create(
            {
              ID: uuidv4(),
              SkillID: skill.ID,
              Content: partName,
              SubContent: null,
              Sequence: p.sequence || (i + 1),
              CreatedBy: userId,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        }

        createdParts[i] = partRow;
        partIds.push(partRow.ID);
      }

      /* =====================================================
         3) DELETE OLD QUESTIONS
      ===================================================== */
      if (partIds.length > 0) {
        await Question.destroy(
          {
            where: {
              PartID: partIds,
              Type: 'speaking',
            },
          },
          { transaction: t }
        );
      }

      /* =====================================================
         4) CREATE NEW QUESTIONS
      ===================================================== */
      let questionPayload = [];

      for (let i = 0; i < partsArray.length; i++) {
        const p = partsArray[i];
        if (!p) continue;
        const partRow = createdParts[i];
        if (!partRow) continue;

        const imageKeys = p.image ? [p.image] : [];
        const qs = Array.isArray(p.questions) ? p.questions : [];

        qs.forEach((q, idx) => {
          const content = q?.value?.trim() || '';

          // Skip empty questions for drafts
          if (!content && Status === 'draft') {
            return;
          }

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
            Tags: normalizeTags(q?.Tags || q?.tags || p?.Tags || p?.tags),
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

      /* =====================================================
         5) LINK SECTION <-> PART
      ===================================================== */
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

async function createReadingGroup(req) {
  try {
    const { SkillName, SectionName, Description, parts, Status, tags, Tags } = req.body;
    const normalizedTags = tags || Tags;
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
    // 1) CREATE SECTION
    // -----------------------------------------
      const section = await Section.create({
        ID: uuidv4(),
        SkillID: skill.ID,
        Name: SectionName,
        Description: Description?.trim() || null,
        Status: Status || 'draft',
      });

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
        // 3) UPSERT QUESTION FOR THIS PART
        // =====================
        // Try to find existing question first to preserve ID and reduce churn
        const existingQuestion = await Question.findOne({
          where: { PartID: partRow.ID },
          transaction: t,
        });

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
            Tags: normalizeTags([...(p.Tags || p.tags || []), ...(normalizedTags || [])]),
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
    throw error;
  }
}

async function createWritingGroup(req) {
  const t = await sequelize.transaction();

  try {
    const { SectionName, Description, parts, tags, Tags } = req.body;
    const normalizedTags = tags || Tags;
    const userId = req.user?.userId;

    if (!SectionName || !parts) {
      await t.rollback();
      return { message: 'SectionName and parts are required' };
    }

    const writingValidationError = validateWritingPayload({
      SectionName,
      parts,
    });
    if (writingValidationError) {
      await t.rollback();
      return {
        status: 400,
        message: writingValidationError,
      };
    }

    // ================================================
    // 0) Skill WRITING
    // ================================================
    const skill = await Skill.findOne({
      where: { Name: 'WRITING' },
    });

    if (!skill) {
      await t.rollback();
      return { message: 'Skill WRITING does not exist' };
    }

    // ================================================
    // 1) CREATE SECTION
    // ================================================
    const section = await Section.create(
        {
          ID: uuidv4(),
          SkillID: skill.ID,
          Name: SectionName,
          Description: Description?.trim() || null,
          Status: Status || 'draft',
          CreatedBy: userId,
          UpdatedBy: userId,
        },
        { transaction: t }
      );

    // ================================================
    // 2) ALWAYS CREATE 4 PARTS (no update)
    // ================================================
    const createdParts = {};
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

      const partRow = await Part.create(
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

      createdParts[def.key] = partRow;
    }

    const partIds = Object.values(createdParts).map((x) => x.ID);

    // ================================================
    // 4) CREATE QUESTIONS FOR 4 PARTS
    // ================================================
    const bulkQuestions = [];

    /** ---------------------------
     * PART 1 — SHORT ANSWERS
     * -------------------------- */
    if (Array.isArray(parts.part1?.questions)) {
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
          Tags: normalizeTags([...(c.Tags || c.tags || []), ...(normalizedTags || [])]),
          CreatedBy: userId,
          UpdatedBy: userId,
        });
      });
    }

    /** ---------------------------
     * PART 2 — FORM FILLING
     * -------------------------- */
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
        Tags: normalizeTags([...(parts.part2?.Tags || parts.part2?.tags || []), ...(normalizedTags || [])]),
        CreatedBy: userId,
        UpdatedBy: userId,
      });
    }

    /** ---------------------------
     * PART 3 — CHAT ROOM
     * -------------------------- */
    if (Array.isArray(parts.part3?.chats)) {
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
          Tags: normalizeTags([...(c.Tags || c.tags || []), ...(normalizedTags || [])]),
          CreatedBy: userId,
          UpdatedBy: userId,
        });
      });
    }

    /** ---------------------------
     * PART 4 — EMAIL WRITING
     * -------------------------- */
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
        Tags: normalizeTags([...(parts.part4?.q1_tags || parts.part4?.q1Tags || parts.part4?.Tags || parts.part4?.tags || []), ...(normalizedTags || [])]),
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
        Tags: normalizeTags([...(parts.part4?.q2_tags || parts.part4?.q2Tags || parts.part4?.Tags || parts.part4?.tags || []), ...(normalizedTags || [])]),
        CreatedBy: userId,
        UpdatedBy: userId,
      });
    }

    // ================================================
    // Write to DB
    // ================================================
    if (bulkQuestions.length > 0) {
      await Question.bulkCreate(bulkQuestions, { transaction: t });
    }

    // ================================================
    // 5) RELINK SECTION <-> PARTS
    // ================================================
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

async function createListeningGroup(req) {
  try {
    const { SkillName, SectionName, Description, parts, Status, tags, Tags } = req.body;
    const normalizedTags = tags || Tags;
    const userId = req.user?.userId;

    if (!SkillName || !SectionName || !parts) {
      return {
        status: 400,
        message: 'SkillName, SectionName and parts{} are required',
      };
    }

    const listeningValidationError = validateListeningPayload({
      SectionName,
      parts,
    });
    if (listeningValidationError) {
      return {
        status: 400,
        message: listeningValidationError,
      };
    }

    // =====================================================
    // 0) Validate Skill
    // =====================================================
    const skill = await Skill.findOne({ where: { Name: SkillName } });

    if (!skill) {
      return {
        status: 400,
        message: `Skill "${SkillName}" does not exist`,
      };
    }

    // =====================================================
    // 🔥 Transaction start
    // =====================================================
    const result = await sequelize.transaction(async (t) => {
      // =====================================================
      // 1) Create Section
      // =====================================================
      const section = await Section.create(
        {
          ID: uuidv4(),
          SkillID: skill.ID,
          Name: SectionName,
          Description: Description?.trim() || null,
          CreatedBy: userId,
          UpdatedBy: userId,
        },
        { transaction: t }
      );

      // =====================================================
      // 2) Create / Update 4 PARTS
      // =====================================================
      const partKeys = Object.keys(parts); // part1 → part4
      let createdParts = {};

      for (const key of partKeys) {
        const p = parts[key];

        if (!p || !p.name) {
          throw new Error(`Part "${key}" missing name`);
        }

        let partRow = null;

        if (p.id) {
          // UPDATE
          partRow = await Part.findByPk(p.id, { transaction: t });

          if (!partRow) {
            throw new Error(`PartID ${p.id} not found`);
          }

          await partRow.update(
            {
              Content: p.name,
              Sequence: p.sequence,
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
              Sequence: p.sequence, // FE gửi sequence chuẩn
              CreatedBy: userId,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        }

        createdParts[key] = partRow;
      }

      const partIds = Object.values(createdParts).map((p) => p.ID);

      // =====================================================
      // 3) DELETE OLD LISTENING QUESTIONS (Type = listening)
      // =====================================================
      await Question.destroy(
        {
          where: {
            PartID: partIds,
            Type: [
              'listening',
              'multiple-choice',
              'dropdown-list',
              'listening-questions-group',
            ],
          },
        },
        { transaction: t }
      );

      // =====================================================
      // 4) BUILD NEW QUESTIONS
      // =====================================================
      let questionPayload = [];

      for (const key of partKeys) {
        const p = parts[key];
        const partRow = createdParts[key];

        const qs = Array.isArray(p.questions) ? p.questions : [];

        qs.forEach((q, idx) => {
          questionPayload.push({
            ID: uuidv4(),
            Type: q.Type, // multiple-choice | dropdown-list | listening-questions-group
            SkillID: skill.ID,
            PartID: partRow.ID,
            Sequence: idx + 1,
            Content: q.Content || '',
            SubContent: q.SubContent || null,
            GroupContent: q.GroupContent || null,
            ImageKeys: q.ImageKeys || null,
            AudioKeys: q.AudioKeys || null,
            Tags: normalizeTags([...(q.Tags || q.tags || []), ...(normalizedTags || [])]),
            AnswerContent: q.AnswerContent || null, // Không stringify → Sequelize JSON column tự nhận
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

      // =====================================================
      // 5) UPDATE SECTION ↔ PART MAPPING
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

    // =====================================================
    // 6) SUCCESS
    // =====================================================
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

async function createGrammarAndVocabGroup(req) {
  try {
    const { SkillName, SectionName, Description, parts, Status, tags, Tags } = req.body;
    const normalizedTags = tags || Tags;
    const userId = req.user?.userId;

    if (!SkillName || !SectionName || !parts) {
      return {
        status: 400,
        message: 'SkillName, SectionName and parts are required',
      };
    }

    // =======================================
    // 0) VALIDATE SKILL
    // =======================================
    const skill = await Skill.findOne({ where: { Name: SkillName } });

    if (!skill) {
      return {
        status: 400,
        message: `Skill "${SkillName}" does not exist`,
      };
    }

    // =======================================
    // TRANSACTION
    // =======================================
    const result = await sequelize.transaction(async (t) => {
      // =======================================
      // 1) CREATE SECTION
      // =======================================
      const section = await Section.create(
        {
          ID: uuidv4(),
          SkillID: skill.ID,
          Name: SectionName,
          Description: Description?.trim() || null,
          Status: Status || 'draft',
          CreatedBy: userId,
          UpdatedBy: userId,
        },
        { transaction: t }
      );

      // =======================================
      // 2) PREPARE PART LIST
      // =======================================
      let createdParts = [];
      const partList = Object.values(parts); // FE gửi dạng object → convert array

      // =======================================
      // 2A) CREATE / UPDATE PARTS
      // =======================================
      for (let i = 0; i < partList.length; i++) {
        const FE = partList[i];

        if (!FE.name) throw new Error(`Part[${i}] missing "name"`);

        let partRow;

        if (FE.PartID) {
          // UPDATE PART
          partRow = await Part.findByPk(FE.PartID, { transaction: t });
          if (!partRow) throw new Error(`PartID ${FE.PartID} not found`);

          await partRow.update(
            {
              Content: FE.name,
              SubContent: FE.subContent || null,
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
              SubContent: FE.subContent || null,
              Sequence: FE.sequence ?? i + 1,
              CreatedBy: userId,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        }

        createdParts.push({ FE, DB: partRow });
      }

      const partIds = createdParts.map((p) => p.DB.ID);

      // =======================================
      // 3) DELETE OLD QUESTIONS
      // =======================================
      await Question.destroy(
        {
          where: {
            PartID: partIds,
            Type: ['multiple-choice', 'matching', 'grammar-vocabulary'],
          },
        },
        { transaction: t }
      );

      // =======================================
      // 4) INSERT NEW QUESTIONS
      // =======================================
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
            Tags: normalizeTags([...(q.Tags || q.tags || []), ...(normalizedTags || [])]),
            AnswerContent: q.AnswerContent, // FE đã build chuẩn → không stringify
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

      // =======================================
      // 5) UPDATE SECTION <-> PART MAPPING
      // =======================================
      await SectionPart.destroy(
        { where: { SectionID: section.ID } },
        { transaction: t }
      );

      await SectionPart.bulkCreate(
        createdParts.map((p, idx) => ({
          ID: uuidv4(),
          SectionID: section.ID,
          PartID: p.DB.ID,
          Sequence: idx + 1,
        })),
        { transaction: t }
      );

      return createdParts.map((p) => p.DB);
    });

    // =======================================
    // SUCCESS
    // =======================================
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

    const orderedQuestions = questions.sort((a, b) => (a.Sequence || 0) - (b.Sequence || 0));

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
    const updatedData = { ...req.body };

    if (
      Object.prototype.hasOwnProperty.call(updatedData, 'Tags') ||
      Object.prototype.hasOwnProperty.call(updatedData, 'tags')
    ) {
      updatedData.Tags = normalizeTags(updatedData.Tags || updatedData.tags);
      delete updatedData.tags;
    }

    const question = await Question.findByPk(questionId);
    if (!question) {
      return {
        status: 404,
        message: 'Question not found',
      };
    }

    await question.update(updatedData);

    const userIdFromReq = req.user?.userId || null;
    logActivity({
      userId: userIdFromReq,
      action: 'update',
      entityType: 'question',
      entityID: questionId,
      entityName: question.Content?.substring(0, 50) || 'Question',
      details: `Question updated (Type: ${question.Type})`,
    });

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

    const question = await Question.findByPk(questionId);
    const questionName = question ? (question.Content?.substring(0, 50) || 'Question') : questionId;
    const userIdFromReq = req.user?.userId || null;

    const deletedRows = await Question.destroy({
      where: { ID: questionId },
    });

    if (deletedRows === 0) {
      return {
        status: 404,
        message: 'Question not found',
      };
    }

    logActivity({
      userId: userIdFromReq,
      action: 'delete',
      entityType: 'question',
      entityID: questionId,
      entityName: questionName,
      details: `Question deleted (Type: ${question?.Type || 'unknown'})`,
    });

    return {
      status: 200,
      message: `Question with ID ${questionId} deleted successfully`,
    };
  } catch (error) {
    throw new Error(`Error deleting question: ${error.message}`);
  }
}

function extractWordLimit(text) {
  if (!text) return null;
  const m = text.match(/\d+/);
  return m ? Number(m[0]) : null;
}

async function getQuestionGroupDetail(req) {
  try {
    const { skillName, sectionId } = req.query;
    console.info(`[GetDetail] Fetching detail for Skill: ${skillName}, Section: ${sectionId}`);

    if (!skillName || !sectionId) {
      return Response.badRequest('skillName and sectionId are required');
    }

    const skillLower = skillName.toLowerCase();

    // ================================
    // 1) Fetch section + parts + questions
    // ================================
    const section = await Section.findByPk(sectionId, {
      include: [
        {
          model: Part,
          as: 'Parts',
          include: [
            {
              model: Question,
              as: 'Questions',
            },
          ],
        },
      ],
    });

    if (!section) {
      console.warn(`[GetDetail] Section ${sectionId} not found`);
      return Response.notFound('Section not found');
    }

    console.info(`[GetDetail] Found section: ${section.Name} with ${section.Parts?.length || 0} parts`);

    const sortedParts = (section.Parts || []).sort((a, b) => (a.Sequence || 0) - (b.Sequence || 0));

    const payload = {
      SectionID: section.ID,
      SectionName: section.Name,
      Description: section.Description || '',
    };

    // ================================
    // 2) Build payload per skill
    // ================================
    if (skillLower === 'speaking') {
      sortedParts.forEach((p, idx) => {
        const firstQ = p.Questions?.[0];
        const partSequence = p.SectionPart?.Sequence || p.Sequence || (idx + 1);
        payload[`part${idx + 1}`] = {
          id: p.ID,
          name: p.Content,
          sequence: partSequence,
          image: firstQ?.ImageKeys?.[0] || null,
          questions: p.Questions,
        };
      });

      return Response.success(payload, 'Speaking detail retrieved');
    }

    if (skillLower === 'listening') {
      sortedParts.forEach((p, idx) => {
        payload[`part${idx + 1}`] = {
          id: p.ID,
          name: p.Content,
          sequence: p.SectionPart.Sequence,
          questions: p.Questions.map((q) => ({
            ID: q.ID,
            Type: q.Type,
            Content: q.Content,
            SubContent: q.SubContent,
            AudioKeys: q.AudioKeys,
            ImageKeys: q.ImageKeys,
            GroupContent: q.GroupContent,
            AnswerContent: q.AnswerContent,
            Tags: q.Tags,
          })),
        };
      });

      return Response.success(payload, 'Listening detail retrieved');
    }

    if (skillLower === 'reading') {
      sortedParts.forEach((p, idx) => {
        const q = p.Questions[0];
        payload[`part${idx + 1}`] = {
          PartID: p.ID,
          PartName: p.Content,
          Type: q.Type,
          Sequence: p.SectionPart.Sequence,
          Content: q.Content,
          AnswerContent: q.AnswerContent,
          Tags: q.Tags,
        };
      });

      return Response.success(payload, 'Reading detail retrieved');
    }

    if (skillLower === 'writing') {
      sortedParts.forEach((p, idx) => {
        const qs = p.Questions;
        const key = `part${idx + 1}`;
        const base = {
          PartID: p.ID,
          name: p.Content,
          sequence: p.SectionPart.Sequence,
        };

        if (idx === 0) {
          base.questions = qs.map((q) => ({ question: q.Content }));
        }

        if (idx === 1) {
          base.question = qs[0]?.Content || '';
        }

        if (idx === 2) {
          base.chats = qs.map((q) => {
            const [speaker, ...rest] = q.Content.split(':');
            return {
              speaker: speaker.trim(),
              question: rest.join(':').trim(),
            };
          });
        }

        if (idx === 3) {
          base.q1 = qs[0]?.Content || '';
          base.q1_wordLimit = extractWordLimit(qs[0]?.SubContent);
          base.q2 = qs[1]?.Content || '';
          base.q2_wordLimit = extractWordLimit(qs[1]?.SubContent);
          base.emailText = p.SubContent || '';
        }

        payload[key] = base;
      });

      return Response.success(payload, 'Writing detail retrieved');
    }

    if (skillLower === 'grammar and vocabulary') {
      sortedParts.forEach((p, idx) => {
        payload[`part${idx + 1}`] = {
          PartID: p.ID,
          name: p.Content,
          sequence: p.SectionPart.Sequence,
          questions: p.Questions.map((q) => ({
            ID: q.ID,
            Type: q.Type,
            Content: q.Content,
            AnswerContent: q.AnswerContent,
            Tags: q.Tags,
          })),
        };
      });

      return Response.success(payload, 'Grammar & Vocabulary detail retrieved');
    }

    return Response.badRequest('Unsupported skillName');
  } catch (err) {
    return Response.error(err.message);
  }
}

async function updateSpeakingGroup(sectionId, payload) {
  const t = await sequelize.transaction();

  try {
    // Check if section is archived
    const existingSection = await Section.findByPk(sectionId);
    if (existingSection && existingSection.Status === 'archived') {
      await t.rollback();
      return { status: 403, message: 'Cannot update an archived section' };
    }

    const { SectionName, Description, parts, userId, Status, tags, Tags } = payload;
    const normalizedTags = tags || Tags;

    const isDraft = Status === 'draft';
    if (!isDraft) {
      const speakingValidationError = validateSpeakingPayload({
        SectionName,
        parts,
      });
      if (speakingValidationError) {
        await t.rollback();
        return {
          status: 400,
          message: speakingValidationError,
        };
      }
    }

    /** =============================
     * 1. Update Section
     * ============================= */
    const updateData = { Name: SectionName, Description: Description?.trim() || null };
    if (payload.Status) {
      updateData.Status = payload.Status;
    }
    await Section.update(
      updateData,
      { where: { ID: sectionId }, transaction: t }
    );

    /** =============================
     * 2. Lấy Part + Question hiện tại
     * ============================= */
    const section = await Section.findOne({
      where: { ID: sectionId },
      include: [
        {
          model: Part,
          as: 'Parts',
          include: [{ model: Question, as: 'Questions' }],
          through: { attributes: [] },
        },
      ],
      transaction: t,
    });

    const existingParts = section.Parts || [];

    const existingPartMap = existingParts.reduce((map, p) => {
      map[p.ID] = p;
      return map;
    }, {});

    // Map by Sequence as a fallback (critical for when FE loses IDs)
    const existingPartSequenceMap = existingParts.reduce((map, p) => {
      map[p.Sequence] = p;
      return map;
    }, {});

    /** =============================
     * 3. LOOP các Part FE gửi lên
     * ============================= */
    console.info(`[Speaking Update] Processing ${Object.keys(parts).length} parts for Section ${sectionId}`);
    
    for (const key of Object.keys(parts)) {
      const incoming = parts[key];
      const incomingId = incoming.id;
      const incomingSequence = incoming.sequence;
      
      let partRow = existingPartMap[incomingId] || existingPartSequenceMap[incomingSequence];
      let partId;

      /** =============================
       * 3.1 Upsert Part
       * ============================= */
      if (partRow) {
        // UPDATE existing part - preserve existing name if draft sends undefined
        const updateFields = {
          Sequence: incomingSequence,
          UpdatedBy: userId,
        };
        if (incoming.name) {
          updateFields.Content = incoming.name;
        }
        await partRow.update(updateFields, { transaction: t });
        partId = partRow.ID;
        console.info(`[Speaking Update]   -> Updated Part: ${key} (ID: ${partId})`);
      } else {
        // CREATE new part - use default name for drafts
        const partName = incoming.name || `Part ${incomingSequence || (key.replace('part', ''))}`;
        partRow = await Part.create(
          {
            ID: uuidv4(),
            SkillID: section.SkillID,
            Content: partName,
            Sequence: incomingSequence,
            CreatedBy: userId,
            UpdatedBy: userId,
          },
          { transaction: t }
        );
        partId = partRow.ID;

        // Link to Section
        await SectionPart.create(
          {
            ID: uuidv4(),
            SectionID: sectionId,
            PartID: partId,
          },
          { transaction: t }
        );
        console.info(`[Speaking Update]   -> Created NEW Part: ${key} (ID: ${partId})`);
      }

      // Map existing questions for this part by Sequence
      const oldQuestions = partRow.Questions || [];
      const existingQuestionSequenceMap = oldQuestions.reduce((map, q) => {
        map[q.Sequence] = q;
        return map;
      }, {});

      const newItems = incoming.questions || [];
      const imageKeys = incoming.image ? [incoming.image] : [];

      /** =============================
       * 3.2 Upsert Questions by Sequence
       * ============================= */
      console.info(`[Speaking Update]     -> Upserting ${newItems.length} questions for part ${partId}`);
      
      const activeQuestionIds = [];

      for (const q of newItems) {
        const qSequence = q.sequence || 1;
        const qContent = q.content || q.value || '';
        
        // Skip empty questions for draft updates
        if (isDraft && !qContent.trim()) {
          continue;
        }
        
        // Find by ID or Fallback to Sequence
        let questionRow = oldQuestions.find(oldQ => oldQ.ID === q.id) || existingQuestionSequenceMap[qSequence];

        const baseData = {
          Type: q.type || 'speaking',
          Sequence: qSequence,
          Content: qContent,
          ImageKeys: imageKeys,
          Tags: normalizeTags([...(q.Tags || q.tags || []), ...(normalizedTags || [])]),
        };

        if (questionRow) {
          console.info(`[Speaking Update]       -> Updating question (Sequence: ${qSequence})`);
          await questionRow.update(baseData, { transaction: t });
          activeQuestionIds.push(questionRow.ID);
        } else {
          console.info(`[Speaking Update]       -> Creating new question (Sequence: ${qSequence})`);
          const newQ = await Question.create(
            {
              ID: uuidv4(),
              PartID: partId,
              CreatedBy: userId,
              ...baseData,
            },
            { transaction: t }
          );
          activeQuestionIds.push(newQ.ID);
        }
      }

      /** =============================
       * 3.3 Cleanup removed questions
       * ============================= */
      await Question.destroy({
        where: {
          PartID: partId,
          ID: { [Op.notIn]: activeQuestionIds }
        },
        transaction: t
      });
    }

    await t.commit();
    return {
      status: 200,
      message: 'Speaking group updated successfully',
    };
  } catch (error) {
    await t.rollback();
    console.error('[Speaking Update Error]', error);
    throw error;
  }
}

async function updateReadingGroup(sectionId, payload) {
  const t = await sequelize.transaction();

  try {
    // Check if section is archived
    const existingSection = await Section.findByPk(sectionId);
    if (existingSection && existingSection.Status === 'archived') {
      await t.rollback();
      return { status: 403, message: 'Cannot update an archived section' };
    }

    const { SectionName, Description, parts, userId, Status, tags, Tags } = payload;
    const normalizedTags = tags || Tags;

    const isDraft = Status === 'draft';

    if (!isDraft) {
      if (!SectionName || !Array.isArray(parts)) {
        throw new Error('SectionName and parts are required');
      }
    }

    // 1) Update SECTION
    const updateData = { Name: SectionName, Description: Description?.trim() || null };
    if (Status) updateData.Status = Status;
    console.log('[READING UPDATE] Updating section with Status:', Status);
    await Section.update(
      updateData,
      { where: { ID: sectionId }, transaction: t }
    );

    // 2) Load existing parts
    const section = await Section.findOne({
      where: { ID: sectionId },
      include: [
        {
          model: Part,
          as: 'Parts',
          include: [{ model: Question, as: 'Questions' }],
          through: { attributes: [] },
        },
      ],
      transaction: t,
    });

    if (!section) throw new Error('Section not found');

    const existingParts = section.Parts || [];
    const existingPartMap = {};
    const partSeqMap = {};

    existingParts.forEach((p) => {
      existingPartMap[p.ID] = p;
      partSeqMap[p.Sequence] = p;
    });

    const incomingPartIds = parts.map((p) => p.PartID).filter((id) => !!id);

    const existingPartIds = existingParts.map((p) => p.ID);

    // 3) Delete parts that are truly removed (only for published)
    if (!isDraft) {
      const removedPartIds = existingPartIds.filter(
        (id) => !incomingPartIds.includes(id)
      );

      if (removedPartIds.length > 0) {
        await Question.destroy({
          where: { PartID: removedPartIds },
          transaction: t,
        });

        await SectionPart.destroy({
          where: { SectionID: sectionId, PartID: removedPartIds },
          transaction: t,
        });

        await Part.destroy({
          where: { ID: removedPartIds },
          transaction: t,
        });
      }
    }

    const finalParts = [];

    // 4) Process all incoming parts
    for (const p of parts) {
      console.log('[READING UPDATE] Processing part:', p.PartName, 'PartID:', p.PartID, 'Sequence:', p.Sequence);
      // Skip empty parts for drafts
      if (isDraft && !p.PartName?.trim() && !p.Content?.trim()) {
        continue;
      }

      let partRow;

      // UPDATE existing
      if (p.PartID && existingPartMap[p.PartID]) {
        partRow = existingPartMap[p.PartID];
        await partRow.update(
          {
            Type: p.Type,
            Content: p.PartName,
            Sequence: p.Sequence,
          },
          { transaction: t }
        );
      } else if (isDraft && !p.PartID) {
        // For drafts: find by sequence or create new
        const existingBySeq = partSeqMap[p.Sequence];
        if (existingBySeq) {
          partRow = existingBySeq;
          await partRow.update(
            {
              Type: p.Type,
              Content: p.PartName || partRow.Content,
              Sequence: p.Sequence,
            },
            { transaction: t }
          );
        } else {
          partRow = await Part.create(
            {
              ID: uuidv4(),
              SkillID: section.SkillID,
              Type: p.Type,
              Content: p.PartName || `Part ${p.Sequence}`,
              Sequence: p.Sequence,
              CreatedBy: userId,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
          await SectionPart.create(
            { SectionID: sectionId, PartID: partRow.ID, Sequence: p.Sequence },
            { transaction: t }
          );
        }
      } else if (!p.PartID) {
        throw new Error(`Missing PartID for part`);
      } else {
        throw new Error(`PartID ${p.PartID} not found`);
      }

      // 5) Update/create single question per part
      const oldQ = await Question.findOne({
        where: { PartID: partRow.ID },
        transaction: t,
      });

      const qContent = p.Content || '';
      if (isDraft && !qContent.trim() && !p.AnswerContent) {
        // Skip empty questions for drafts
        finalParts.push(partRow);
        continue;
      }

      if (oldQ) {
        const updatePayload = {
          Type: p.Type,
          Content: qContent,
          AnswerContent: p.AnswerContent,
        };

        updatePayload.Tags = normalizeTags([...(p.Tags || p.tags || []), ...(normalizedTags || [])]);

        await oldQ.update(updatePayload, { transaction: t });
      } else {
        const createPayload = {
          ID: uuidv4(),
          PartID: partRow.ID,
          Type: p.Type,
          Sequence: 1,
          Content: qContent,
          AnswerContent: p.AnswerContent,
        };

        createPayload.Tags = normalizeTags([...(p.Tags || p.tags || []), ...(normalizedTags || [])]);

        await Question.create(createPayload, { transaction: t });
      }

      finalParts.push(partRow);
    }

    // 6) Update SectionPart mapping
    for (const part of finalParts) {
      const mapping = await SectionPart.findOne({
        where: { SectionID: sectionId, PartID: part.ID },
        transaction: t,
      });

      if (mapping) {
        await mapping.update({ Sequence: part.Sequence }, { transaction: t });
      } else {
        await SectionPart.create(
          {
            ID: uuidv4(),
            SectionID: sectionId,
            PartID: part.ID,
            Sequence: part.Sequence,
          },
          { transaction: t }
        );
      }
    }

    await t.commit();

    return { status: 200, message: 'Reading group updated successfully' };
  } catch (error) {
    await t.rollback();
    console.error(error);
    return { status: 500, message: error.message };
  }
}

async function updateWritingGroup(sectionId, payload) {
  const t = await sequelize.transaction();

  try {
    // Check if section is archived
    const existingSection = await Section.findByPk(sectionId);
    if (existingSection && existingSection.Status === 'archived') {
      await t.rollback();
      return { status: 403, message: 'Cannot update an archived section' };
    }

    const { SectionName, Description, parts, userId, Status, tags, Tags } = payload;
    const normalizedTags = tags || Tags;

    const isDraft = Status === 'draft';

    if (!isDraft) {
      if (!SectionName || !parts) {
        throw new Error('SectionName and parts are required');
      }

      const writingValidationError = validateWritingPayload({
        SectionName,
        parts,
      });
      if (writingValidationError) {
        await t.rollback();
        return {
          status: 400,
          message: writingValidationError,
        };
      }
    }

    // ================================================
    // 1) UPDATE SECTION
    // ================================================
    const updateData = { Name: SectionName, Description: Description?.trim() || null };
    if (Status) {
      updateData.Status = Status;
    }
    await Section.update(
      updateData,
      { where: { ID: sectionId }, transaction: t }
    );

    // Load existing section + parts
    const section = await Section.findOne({
      where: { ID: sectionId },
      include: [
        {
          model: Part,
          as: 'Parts',
          include: [{ model: Question, as: 'Questions' }],
          through: { attributes: [] },
        },
      ],
      transaction: t,
    });

    if (!section) throw new Error('Section not found');

    const oldParts = section.Parts || [];
    const oldPartMap = {};
    oldParts.forEach((p) => (oldPartMap[p.ID] = p));

    // ================================================
    // 2) UPDATE ALL 4 PARTS (name + subContent)
    // ================================================
    const updatedParts = {};
    const partSeqMap = {};
    oldParts.forEach((p) => { partSeqMap[p.Sequence] = p; });

    for (const key of ['part1', 'part2', 'part3', 'part4']) {
      const incoming = parts[key];
      const seqNum = parseInt(key.replace('part', ''));

      // For drafts, skip parts that don't exist yet
      if (!incoming) {
        if (isDraft) continue;
        throw new Error(`Missing data for ${key}`);
      }

      // For drafts, allow missing PartID (create new part)
      if (!isDraft && !incoming.PartID) {
        throw new Error(`Missing PartID for ${key}`);
      }

      if (incoming.PartID) {
        const dbPart = oldPartMap[incoming.PartID];
        if (!dbPart) throw new Error(`PartID ${incoming.PartID} not found`);

        await dbPart.update(
          {
            Content: incoming.name,
            SubContent: incoming.subContent || null,
          },
          { transaction: t }
        );

        updatedParts[key] = dbPart;
      } else if (isDraft) {
        // For drafts: find existing part by sequence first, then create if none
        let dbPart = partSeqMap[seqNum];

        if (dbPart) {
          // Update existing part
          await dbPart.update(
            {
              Content: incoming.name || dbPart.Content,
              SubContent: incoming.subContent || dbPart.SubContent || null,
            },
            { transaction: t }
          );
          updatedParts[key] = dbPart;
        } else {
          // Create new part for draft
          const newPart = await Part.create(
            {
              ID: uuidv4(),
              SkillID: section.SkillID,
              Content: incoming.name || `${key.charAt(0).toUpperCase() + key.slice(1)}`,
              SubContent: incoming.subContent || null,
              Sequence: seqNum,
              CreatedBy: userId,
              UpdatedBy: userId,
            },
            { transaction: t }
          );

          // Link part to section via SectionPart
          await SectionPart.create(
            {
              SectionID: sectionId,
              PartID: newPart.ID,
              Sequence: seqNum,
            },
            { transaction: t }
          );

          updatedParts[key] = newPart;
        }
      }
    }

    // ================================================
    // 3) DELETE OLD QUESTIONS (for drafts, delete all; for published, delete by part)
    // ================================================
    const partIds = Object.values(updatedParts).map((p) => p.ID);
    if (partIds.length > 0) {
      await Question.destroy({
        where: { PartID: partIds },
        transaction: t,
      });
    }

    // ================================================
    // 4) RE-CREATE NEW QUESTIONS
    // ================================================
    const bulkQuestions = [];

    /** ------------ PART 1 ------------- */
    if (updatedParts.part1 && Array.isArray(parts.part1?.questions)) {
      parts.part1.questions.forEach((q, idx) => {
        const content = q.question || '';
        if (isDraft && !content.trim()) return;
        bulkQuestions.push({
          ID: uuidv4(),
          Type: 'writing',
          SkillID: section.SkillID,
          PartID: updatedParts.part1.ID,
          Sequence: idx + 1,
          Content: content,
          SubContent: null,
          GroupContent: null,
          AudioKeys: null,
          ImageKeys: null,
          AnswerContent: null,
          Tags: normalizeTags([...(q.Tags || q.tags || []), ...(normalizedTags || [])]),
          CreatedBy: userId,
          UpdatedBy: userId,
        });
      });
    }

    /** ------------ PART 2 ------------- */
    if (updatedParts.part2 && parts.part2?.question) {
      const content = parts.part2.question;
      if (!isDraft || content.trim()) {
        bulkQuestions.push({
          ID: uuidv4(),
          Type: 'writing',
          SkillID: section.SkillID,
          PartID: updatedParts.part2.ID,
          Sequence: 1,
          Content: content,
          SubContent: '',
          GroupContent: null,
          AudioKeys: null,
          ImageKeys: null,
          AnswerContent: null,
          Tags: normalizeTags([...(parts.part2?.Tags || parts.part2?.tags || []), ...(normalizedTags || [])]),
          CreatedBy: userId,
          UpdatedBy: userId,
        });
      }
    }

    /** ------------ PART 3 ------------- */
    if (updatedParts.part3 && Array.isArray(parts.part3?.chats)) {
      parts.part3.chats.forEach((c, idx) => {
        const content = `${c.speaker}: ${c.question}`;
        if (isDraft && !content.trim()) return;
        bulkQuestions.push({
          ID: uuidv4(),
          Type: 'writing',
          SkillID: section.SkillID,
          PartID: updatedParts.part3.ID,
          Sequence: idx + 1,
          Content: content,
          SubContent: '',
          GroupContent: null,
          AudioKeys: null,
          ImageKeys: null,
          AnswerContent: null,
          Tags: normalizeTags([...(c.Tags || c.tags || []), ...(normalizedTags || [])]),
          CreatedBy: userId,
          UpdatedBy: userId,
        });
      });
    }

    /** ------------ PART 4 ------------- */
    if (updatedParts.part4) {
      if (parts.part4.q1) {
        const content = parts.part4.q1;
        if (!isDraft || content.trim()) {
          bulkQuestions.push({
            ID: uuidv4(),
            Type: 'writing',
            SkillID: section.SkillID,
            PartID: updatedParts.part4.ID,
            Sequence: 1,
            Content: content,
            SubContent: `* (Up to ${parts.part4.q1_wordLimit} words allowed)`,
            GroupContent: null,
            AudioKeys: null,
            ImageKeys: null,
            AnswerContent: null,
            Tags: normalizeTags([...(parts.part4?.q1_tags || parts.part4?.q1Tags || parts.part4?.Tags || parts.part4?.tags || []), ...(normalizedTags || [])]),
            CreatedBy: userId,
            UpdatedBy: userId,
          });
        }
      }

      if (parts.part4.q2) {
        const content = parts.part4.q2;
        if (!isDraft || content.trim()) {
          bulkQuestions.push({
            ID: uuidv4(),
            Type: 'writing',
            SkillID: section.SkillID,
            PartID: updatedParts.part4.ID,
            Sequence: 2,
            Content: content,
            SubContent: `* (Up to ${parts.part4.q2_wordLimit} words allowed)`,
            GroupContent: null,
            AudioKeys: null,
            ImageKeys: null,
            AnswerContent: null,
            Tags: normalizeTags([...(parts.part4?.q2_tags || parts.part4?.q2Tags || parts.part4?.Tags || parts.part4?.tags || []), ...(normalizedTags || [])]),
            CreatedBy: userId,
            UpdatedBy: userId,
          });
        }
      }
    }

    if (bulkQuestions.length > 0) {
      await Question.bulkCreate(bulkQuestions, { transaction: t });
    }

    // ================================================
    // 5) Update SectionPart (sequence = 1 → 4)
    // ================================================
    const partOrder = ['part1', 'part2', 'part3', 'part4'];

    for (let i = 0; i < partOrder.length; i++) {
      const partRow = updatedParts[partOrder[i]];
      if (!partRow) continue;

      await SectionPart.upsert(
        {
          SectionID: sectionId,
          PartID: partRow.ID,
          Sequence: i + 1,
        },
        {
          conflictFields: ['SectionID', 'PartID'],
          transaction: t,
        }
      );
    }

    await t.commit();

    return { status: 200, message: 'Writing group updated successfully' };
  } catch (error) {
    await t.rollback();
    console.error(error);
    return { status: 500, message: error.message };
  }
}

async function updateListeningGroup(sectionId, payload) {
  const t = await sequelize.transaction();

  try {
    // Check if section is archived
    const existingSection = await Section.findByPk(sectionId);
    if (existingSection && existingSection.Status === 'archived') {
      await t.rollback();
      return { status: 403, message: 'Cannot update an archived section' };
    }

    const { SkillName, SectionName, Description, parts, userId, Status, tags, Tags } = payload;
    const normalizedTags = tags || Tags;

    const isDraft = Status === 'draft';

    if (!isDraft) {
      if (!SkillName || !SectionName || !parts) {
        throw new Error('SkillName, SectionName and parts{} are required');
      }

      const listeningValidationError = validateListeningPayload({
        SectionName,
        parts,
      });
      if (listeningValidationError) {
        await t.rollback();
        return {
          status: 400,
          message: listeningValidationError,
        };
      }
    }

    // 1) Validate Skill
    const skill = await Skill.findOne({ where: { Name: SkillName } });
    if (!skill) throw new Error(`Skill "${SkillName}" does not exist`);

    // 2) Load Section + Parts + Questions
    const section = await Section.findOne({
      where: { ID: sectionId },
      include: [
        {
          model: Part,
          as: 'Parts',
          include: [{ model: Question, as: 'Questions' }],
          through: { attributes: [] },
        },
      ],
      transaction: t,
    });

    if (!section) throw new Error('Section not found');

    const oldPartsMap = {};
    const partSeqMap = {};
    section.Parts.forEach((p) => {
      oldPartsMap[p.ID] = p;
      partSeqMap[p.Sequence] = p;
    });

    // =====================================================
    // 3) UPDATE SECTION
    // =====================================================
    const updateData = {
      Name: SectionName,
      Description: Description?.trim() || null,
      UpdatedBy: userId,
    };
    if (Status) updateData.Status = Status;
    await section.update(updateData, { transaction: t });

    // =====================================================
    // 4) UPDATE 4 PARTS
    // =====================================================
    const updatedParts = {};

    for (const key of ['part1', 'part2', 'part3', 'part4']) {
      const incoming = parts[key];
      const seqNum = parseInt(key.replace('part', ''));

      if (!incoming) {
        if (isDraft) continue;
        throw new Error(`Missing data for ${key}`);
      }

      if (incoming.partId && oldPartsMap[incoming.partId]) {
        // Update existing part
        const dbPart = oldPartsMap[incoming.partId];
        await dbPart.update(
          {
            Content: incoming.name,
            Sequence: incoming.sequence || dbPart.Sequence,
            UpdatedBy: userId,
          },
          { transaction: t }
        );
        updatedParts[key] = dbPart;
      } else if (isDraft && !incoming.partId) {
        // For drafts: find by sequence or create new
        const existingBySeq = partSeqMap[seqNum];
        if (existingBySeq) {
          await existingBySeq.update(
            {
              Content: incoming.name || existingBySeq.Content,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
          updatedParts[key] = existingBySeq;
        } else {
          const newPart = await Part.create(
            {
              ID: uuidv4(),
              SkillID: section.SkillID,
              Content: incoming.name || `Part ${seqNum}`,
              Sequence: seqNum,
              CreatedBy: userId,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
          await SectionPart.create(
            { SectionID: sectionId, PartID: newPart.ID, Sequence: seqNum },
            { transaction: t }
          );
          updatedParts[key] = newPart;
        }
      } else if (!incoming.partId) {
        throw new Error(`Missing partId for ${key}`);
      } else {
        throw new Error(`PartID ${incoming.partId} not found`);
      }
    }

    // =====================================================
    // 5) QUESTION SYNC
    // =====================================================
    for (const key of ['part1', 'part2', 'part3', 'part4']) {
      const incoming = parts[key];
      const dbPart = updatedParts[key];
      if (!dbPart) continue;

      const dbQuestions = dbPart.Questions || [];
      const dbQMap = {};
      dbQuestions.forEach((q) => (dbQMap[q.ID] = q));

      const feQuestions = incoming.questions || [];

      // For drafts, skip empty questions
      const filteredQs = isDraft
        ? feQuestions.filter((q) => q.Content?.trim() || q.AnswerContent)
        : feQuestions;

      const feIds = filteredQs.map((q) => q.questionId).filter(Boolean);

      // ===== DELETE questions removed on FE =====
      const deleteIds = dbQuestions
        .filter((q) => !feIds.includes(q.ID))
        .map((q) => q.ID);

      if (deleteIds.length) {
        await Question.destroy(
          { where: { ID: deleteIds } },
          { transaction: t }
        );
      }

      // ===== CREATE OR UPDATE =====
      for (let i = 0; i < filteredQs.length; i++) {
        const q = filteredQs[i];

        if (q.questionId && dbQMap[q.questionId]) {
          // ---------------- UPDATE ----------------
          await dbQMap[q.questionId].update(
            {
              Type: q.Type,
              Content: q.Content,
              SubContent: q.SubContent || null,
              GroupContent: q.AnswerContent?.groupContent || null,
              AudioKeys: q.AudioKeys || null,
              ImageKeys: q.ImageKeys || null,
              AnswerContent: q.AnswerContent || null,
              Tags: normalizeTags([...(q.Tags || q.tags || []), ...(normalizedTags || [])]),
              Sequence: i + 1,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        } else {
          // ---------------- CREATE ----------------
          await Question.create(
            {
              ID: uuidv4(),
              Type: q.Type,
              SkillID: skill.ID,
              PartID: dbPart.ID,
              Sequence: i + 1,
              Content: q.Content,
              SubContent: q.SubContent || null,
              GroupContent: q.AnswerContent?.groupContent || null,
              AudioKeys: q.AudioKeys,
              ImageKeys: q.ImageKeys || null,
              AnswerContent: q.AnswerContent || null,
              Tags: normalizeTags([...(q.Tags || q.tags || []), ...(normalizedTags || [])]),
              CreatedBy: userId,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
        }
      }
    }

    // =====================================================
    // 6) Update SectionPart sequence
    // =====================================================
    const order = ['part1', 'part2', 'part3', 'part4'];
    for (let i = 0; i < order.length; i++) {
      const p = updatedParts[order[i]];
      if (!p) continue;
      await SectionPart.upsert(
        { SectionID: sectionId, PartID: p.ID, Sequence: i + 1 },
        { conflictFields: ['SectionID', 'PartID'], transaction: t }
      );
    }

    await t.commit();
    return {
      status: 200,
      message: 'Listening group updated successfully',
    };
  } catch (err) {
    await t.rollback();
    console.error(err);
    return {
      status: 500,
      message: err.message,
    };
  }
}

async function updateGrammarAndVocabGroup(sectionId, payload) {
  const t = await sequelize.transaction();

  try {
    // Check if section is archived
    const existingSection = await Section.findByPk(sectionId);
    if (existingSection && existingSection.Status === 'archived') {
      await t.rollback();
      return { status: 403, message: 'Cannot update an archived section' };
    }

    const { SkillName, SectionName, Description, parts, userId, Status, tags, Tags } = payload;
    const normalizedTags = tags || Tags;

    const isDraft = Status === 'draft';

    if (!isDraft) {
      if (!SkillName || !SectionName || !parts) {
        throw new Error('SkillName, SectionName and parts{} are required');
      }
    }

    // =====================================================
    // 1) Validate skill
    // =====================================================
    const skill = await Skill.findOne({ where: { Name: SkillName } });
    if (!skill) throw new Error(`Skill "${SkillName}" does not exist`);

    // =====================================================
    // 2) Load Section + Parts + Questions
    // =====================================================
    const section = await Section.findOne({
      where: { ID: sectionId },
      include: [
        {
          model: Part,
          as: 'Parts',
          include: [{ model: Question, as: 'Questions' }],
          through: { attributes: [] },
        },
      ],
      transaction: t,
    });

    if (!section) throw new Error('Section not found');

    const oldPartsMap = {};
    section.Parts.forEach((p) => (oldPartsMap[p.ID] = p));
    const partSeqMap = {};
    section.Parts.forEach((p) => { partSeqMap[p.Sequence] = p; });

    // =====================================================
    // 3) UPDATE SECTION NAME
    // =====================================================
    const updateData = { Name: SectionName, Description: Description?.trim() || null, UpdatedBy: userId };
    if (Status) updateData.Status = Status;
    await section.update(updateData, { transaction: t });

    // =====================================================
    // 4) UPDATE PARTS
    // =====================================================
    const updatedParts = {};

    for (const key of ['part1', 'part2']) {
      const incoming = parts[key];
      const seqNum = key === 'part1' ? 1 : 2;

      if (!incoming) {
        if (isDraft) continue;
        throw new Error(`Missing data for ${key}`);
      }

      if (incoming.id && oldPartsMap[incoming.id]) {
        // Update existing part
        const dbPart = oldPartsMap[incoming.id];
        await dbPart.update(
          {
            Content: incoming.name,
            Sequence: incoming.sequence || dbPart.Sequence,
            UpdatedBy: userId,
          },
          { transaction: t }
        );
        updatedParts[key] = dbPart;
      } else if (isDraft) {
        // For drafts: find existing part by sequence, or create new
        let dbPart = partSeqMap[seqNum];

        if (dbPart) {
          await dbPart.update(
            {
              Content: incoming.name || dbPart.Content,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
          updatedParts[key] = dbPart;
        } else {
          const newPart = await Part.create(
            {
              ID: uuidv4(),
              SkillID: section.SkillID,
              Content: incoming.name || `${key.charAt(0).toUpperCase() + key.slice(1)}`,
              Sequence: seqNum,
              CreatedBy: userId,
              UpdatedBy: userId,
            },
            { transaction: t }
          );
          await SectionPart.create(
            { SectionID: sectionId, PartID: newPart.ID, Sequence: seqNum },
            { transaction: t }
          );
          updatedParts[key] = newPart;
        }
      } else {
        throw new Error(`Missing partId for ${key}`);
      }
    }

    // =====================================================
    // 5) DELETE OLD QUESTIONS
    // =====================================================
    const partIds = Object.values(updatedParts).map((p) => p.ID);
    if (partIds.length > 0) {
      await Question.destroy({ where: { PartID: partIds }, transaction: t });
    }

    // =====================================================
    // 6) CREATE NEW QUESTIONS
    // =====================================================
    const bulkQuestions = [];

    if (updatedParts.part1 && Array.isArray(parts.part1?.questions)) {
      parts.part1.questions.forEach((q, idx) => {
        const content = q.Content || q.content || '';
        if (isDraft && !content.trim()) return;
        bulkQuestions.push({
          ID: uuidv4(),
          Type: q.Type || 'multiple-choice',
          SkillID: section.SkillID,
          PartID: updatedParts.part1.ID,
          Sequence: idx + 1,
          Content: content,
          SubContent: null,
          GroupContent: null,
          ImageKeys: q.ImageKeys || null,
          AudioKeys: null,
          AnswerContent: q.AnswerContent || null,
          Tags: normalizeTags([...(q.Tags || q.tags || []), ...(normalizedTags || [])]),
          CreatedBy: userId,
          UpdatedBy: userId,
        });
      });
    }

    if (updatedParts.part2 && Array.isArray(parts.part2?.questions)) {
      parts.part2.questions.forEach((q, idx) => {
        const content = q.Content || q.content || '';
        if (isDraft && !content.trim()) return;
        bulkQuestions.push({
          ID: uuidv4(),
          Type: q.Type || 'matching',
          SkillID: section.SkillID,
          PartID: updatedParts.part2.ID,
          Sequence: idx + 26,
          Content: content,
          SubContent: q.SubContent || null,
          GroupContent: null,
          ImageKeys: q.ImageKeys || null,
          AudioKeys: null,
          AnswerContent: q.AnswerContent || null,
          Tags: normalizeTags([...(q.Tags || q.tags || []), ...(normalizedTags || [])]),
          CreatedBy: userId,
          UpdatedBy: userId,
        });
      });
    }

    if (bulkQuestions.length > 0) {
      await Question.bulkCreate(bulkQuestions, { transaction: t });
    }

    // =====================================================
    // 7) Update SectionPart
    // =====================================================
    const partOrder = ['part1', 'part2'];
    for (let i = 0; i < partOrder.length; i++) {
      const partRow = updatedParts[partOrder[i]];
      if (!partRow) continue;
      await SectionPart.upsert(
        { SectionID: sectionId, PartID: partRow.ID, Sequence: i + 1 },
        { conflictFields: ['SectionID', 'PartID'], transaction: t }
      );
    }

    await t.commit();
    return { status: 200, message: 'Grammar & Vocab group updated successfully' };
  } catch (error) {
    await t.rollback();
    console.error(error);
    return { status: 500, message: error.message };
  }
}

async function duplicateSection(req) {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.user?.userId || null;

    const originalSection = await Section.findByPk(id, {
      include: [
        {
          model: Part,
          as: 'Parts',
          include: [
            {
              model: Question,
              as: 'Questions',
            },
          ],
        },
        {
          model: Skill,
          as: 'Skill',
        },
      ],
    });

    if (!originalSection) {
      await t.rollback();
      return Response.notFound('Section not found');
    }

    let newName = `${originalSection.Name} (Copy)`;
    let counter = 1;

    let nameExists = true;
    while (nameExists) {
      const existing = await Section.findOne({
        where: { Name: { [Op.iLike]: newName } }
      });
      if (!existing) {
        nameExists = false;
      } else {
        newName = `${originalSection.Name} (Copy ${counter++})`;
      }
    }

    const newSection = await Section.create({
      Name: newName,
      Description: originalSection.Description,
      SkillID: originalSection.SkillID,
      Status: 'draft',
    }, { transaction: t });

    const sortedParts = (originalSection.Parts || []).sort((a, b) => (a.Sequence ?? 0) - (b.Sequence ?? 0));

    for (const originalPart of sortedParts) {
      const newPart = await Part.create({
        Content: originalPart.Content,
        SubContent: originalPart.SubContent,
        Sequence: originalPart.Sequence,
        SkillID: originalPart.SkillID,
      }, { transaction: t });

      await SectionPart.create({
        SectionID: newSection.ID,
        PartID: newPart.ID,
      }, { transaction: t });

      const sortedQuestions = (originalPart.Questions || []).sort((a, b) => (a.Sequence ?? 0) - (b.Sequence ?? 0));

      for (const originalQuestion of sortedQuestions) {
        await Question.create({
          Type: originalQuestion.Type,
          AudioKeys: originalQuestion.AudioKeys,
          ImageKeys: originalQuestion.ImageKeys,
          PartID: newPart.ID,
          Sequence: originalQuestion.Sequence,
          Content: originalQuestion.Content,
          SubContent: originalQuestion.SubContent,
          GroupContent: originalQuestion.GroupContent,
          AnswerContent: originalQuestion.AnswerContent,
          Tags: originalQuestion.Tags,
          CreatedBy: userId,
          UpdatedBy: userId,
        }, { transaction: t });
      }
    }

    await logActivity({
      userId,
      action: 'create',
      entityType: 'section',
      entityID: newSection.ID,
      entityName: newName,
      details: `Question Bank "${newName}" created by duplicating "${originalSection.Name}"`,
    });

    await t.commit();

    return Response.success(newSection, `Question Bank "${originalSection.Name}" duplicated successfully as "${newName}"`, 201);
  } catch (error) {
    await t.rollback();
    return Response.error(`Error duplicating section: ${error.message}`);
  }
}

module.exports = {
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
  getQuestionGroupDetail,
  updateSpeakingGroup,
  updateReadingGroup,
  updateWritingGroup,
  updateListeningGroup,
  updateGrammarAndVocabGroup,
  duplicateSection,
};
