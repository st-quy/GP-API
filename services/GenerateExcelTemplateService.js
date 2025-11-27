const {
  generateExcelTemplate,
} = require('../utils/excel/GenerateExcelTemplate');
const ExcelJS = require('exceljs');
const {
  sequelize,
  Topic,
  Part,
  QuestionSet,
  QuestionSetQuestion,
  TopicPart,
  Skill,
  Question,
} = require('../models');

const {
  formatAnswers,
  formatCorrectAnswer,
} = require('../utils/formatters/GenericFormatter');

const {
  formatQuestionContent,
  formatQuestionToJson,
  formatTitleWithAudio,
} = require('../utils/formatters/GroupQuestionFormatter');

const {
  formatMatchingContent,
} = require('../utils/formatters/MatchingFormatter');

const {
  formatMultipleChoice,
  formatMultipleChoiceWithAudio,
} = require('../utils/formatters/MultipleChoiceFormatter');

const { parseAnswers } = require('../utils/parsers/AnswerParser');

const {
  parseMatchingAnswers,
} = require('../utils/parsers/MatchingAnswerParser');

const {
  parseQuestionContent,
} = require('../utils/parsers/QuestionContentParser');

const generateTemplateFile = async () => {
  try {
    const file = await generateExcelTemplate();
    return file;
  } catch (error) {
    throw new Error('Error generating Excel template: ' + error.message);
  }
};
// Trả về message safe để log / trả về client
const safeErrMsg = (err) => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch (e) {
    return 'Error occurred';
  }
};

// Convert cell Excel về string đơn giản
const asText = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  if (v.text) return v.text;
  if (v.richText) return v.richText.map((i) => i.text).join('');
  return null;
};

// Chuẩn hoá key chung (Part, content, v.v.)
const normKey = (str) => {
  return String(str || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
};

// Chuẩn hoá riêng cho Skill:
// - thay & -> " and "
// - xoá mọi ký tự không phải a-z
// => "Grammar & Vocabulary" và "GRAMMAR AND VOCABULARY" đều thành "grammarandvocabulary"
const normSkillKey = (str) => {
  return String(str || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/&/g, ' and ')
    .replace(/[^a-z]/g, '')
    .trim();
};

// Build key duy nhất cho Question từ object trong code
const buildQuestionKey = ({
  Type,
  PartID,
  Content,
  SubContent,
  AnswerContent,
}) => {
  let answerStr;
  try {
    answerStr = JSON.stringify(AnswerContent ?? null);
  } catch {
    answerStr = String(AnswerContent ?? '');
  }

  return [
    String(Type || '').toLowerCase(),
    String(PartID || ''),
    normKey(Content || ''),
    normKey(SubContent || ''),
    normKey(answerStr || ''),
  ].join('__');
};

// Build key từ record Question lấy trong DB
const buildQuestionKeyFromDb = (q) => {
  let answer = q.AnswerContent;
  if (typeof answer === 'string') {
    try {
      answer = JSON.parse(answer);
    } catch {
      // nếu parse lỗi thì cứ dùng string
    }
  }
  return buildQuestionKey({
    Type: q.Type,
    PartID: q.PartID,
    Content: q.Content,
    SubContent: q.SubContent,
    AnswerContent: answer,
  });
};

// =====================
// Hàm chính
// =====================

const parseExcelBuffer = async (buffer) => {
  // 0) Đọc file & sheet
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];

  if (!sheet) {
    return { status: 400, message: 'No worksheet found in Excel file' };
  }

  // Helper build key Part+SubPart dùng chung toàn hàm
  const buildPartKey = (part, subPart) => {
    const p = normKey(part);
    const s = normKey(subPart || '');
    return `${p}__${s}`;
  };

  // 1) Đọc partsData & topicSet từ sheet (bỏ header row 1)
  const partsRaw = [];
  const topicSet = new Set();

  // Dùng sheet.rowCount cho linh hoạt
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);

    const topic = row.getCell(1).value; // A
    const skill = row.getCell(2).value; // B
    const partVal = row.getCell(3).value; // C
    const subPart = row.getCell(4).value; // D

    if (!partVal || !skill) continue;

    const part =
      isNaN(partVal) && typeof partVal === 'string'
        ? partVal.trim()
        : `Part${partVal}`;

    partsRaw.push({
      topic: topic ? String(topic).trim() : null,
      part: part.trim(),
      subPart: subPart || null,
    });

    if (topic) topicSet.add(String(topic).trim());
  }

  // 2) Validate sớm (trước transaction)
  if (topicSet.size === 0) {
    return { status: 400, message: 'No topic found in file' };
  }
  const topicName = [...topicSet][0];

  const existingTopic = await Topic.findOne({ where: { Name: topicName } });
  if (existingTopic) {
    return { status: 400, message: 'Topic already exists' };
  }

  // 3) Dedupe Part theo CẶP (Part, SubPart) TRONG FILE
  const partsMap = new Map();
  for (const it of partsRaw) {
    const key = buildPartKey(it.part, it.subPart);
    if (!partsMap.has(key)) {
      partsMap.set(key, {
        part: it.part,
        subPart: it.subPart || null,
      });
    }
  }
  const partsData = Array.from(partsMap.values());

  let transaction;

  try {
    // 4) Bắt đầu transaction
    transaction = await sequelize.transaction();

    // 5.1 Tạo Topic
    const createdTopic = await Topic.create(
      { Name: topicName },
      { transaction }
    );
    const topicId = createdTopic.ID;

    // 5.2 Lấy Part đã tồn tại trong DB & chỉ tạo Part mới nếu cặp (Content, SubContent) CHƯA có
    //  (1 Part có thể thuộc nhiều Topic)

    // Load toàn bộ Part hiện có (nếu data lớn thì tối ưu sau bằng where Content IN ...)
    const existingParts = await Part.findAll({ transaction });

    const existingPartIdByKey = new Map(
      existingParts.map((p) => [buildPartKey(p.Content, p.SubContent), p.ID])
    );

    // Map cuối: key (Part, SubPart) -> PartID
    const partIdByKey = new Map();
    const partsToInsert = [];

    for (const { part, subPart } of partsData) {
      const key = buildPartKey(part, subPart);
      const existedId = existingPartIdByKey.get(key);

      if (existedId) {
        // ĐÃ có Part này trong DB → reuse
        partIdByKey.set(key, existedId);
      } else {
        // CHƯA có → chuẩn bị tạo mới
        const match = part.match(/\d+/);
        const sequence = match ? parseInt(match[0], 10) : null;

        partsToInsert.push({
          key,
          data: {
            Content: part,
            SubContent: subPart,
            Sequence: sequence,
          },
        });
      }
    }

    if (partsToInsert.length > 0) {
      const createdParts = await Part.bulkCreate(
        partsToInsert.map((p) => p.data),
        {
          transaction,
          returning: true,
        }
      );

      createdParts.forEach((p, idx) => {
        const key = partsToInsert[idx].key;
        partIdByKey.set(key, p.ID);
      });
    }

    // Build map PartID -> info (Content, SubContent) cho các Part tham gia Topic này
    const partInfoById = new Map();
    for (const { part, subPart } of partsData) {
      const key = buildPartKey(part, subPart);
      const id = partIdByKey.get(key);
      if (!id) continue;
      if (!partInfoById.has(id)) {
        partInfoById.set(id, {
          Content: part,
          SubContent: subPart || null,
        });
      }
    }

    const partIdsInTopic = Array.from(partInfoById.keys());

    // 5.3 Tạo QuestionSet cho từng Part trong Topic
    const questionSetsToCreate = partIdsInTopic.map((partId) => {
      const info = partInfoById.get(partId);
      return {
        Name: `${topicName} - ${info.Content}`,
        Description: info.SubContent || null,
        ShuffleQuestions: false,
        ShuffleAnswers: false,
      };
    });

    const createdQuestionSets = await QuestionSet.bulkCreate(
      questionSetsToCreate,
      {
        transaction,
        returning: true,
      }
    );

    // Map PartID -> QuestionSetID (dựa theo index)
    const questionSetIdByPartId = new Map();
    createdQuestionSets.forEach((qs, idx) => {
      const partId = partIdsInTopic[idx];
      questionSetIdByPartId.set(partId, qs.ID);
    });

    // 5.4 Many-to-many TopicPart, gán luôn QuestionSetID
    if (TopicPart) {
      const tpRows = partIdsInTopic.map((partId) => ({
        TopicID: topicId,
        PartID: partId,
        QuestionSetID: questionSetIdByPartId.get(partId) || null,
      }));
      if (tpRows.length) {
        await TopicPart.bulkCreate(tpRows, {
          transaction,
          ignoreDuplicates: true,
        });
      }
    }

    // 5.5 Lấy danh mục Skill
    const skills = await Skill.findAll({
      attributes: ['ID', 'Name'],
      transaction,
    });

    console.log(
      'Skills in DB:',
      skills.map((s) => ({
        name: s.Name,
        key: normSkillKey(s.Name),
      }))
    );

    const skillIdByKey = new Map(
      skills.map((s) => [normSkillKey(s.Name), s.ID])
    );

    // 5.6 Duyệt sheet lần 2 để build Questions
    const questionsToCreate = [];
    const questionMeta = []; // meta để tạo QuestionSetQuestion
    const foundSkills = new Set();
    const unknownSkillRows = [];

    for (let r = 2; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      // Lấy A..M (1..13)
      let topic = row.getCell(1).value;
      let skillName = row.getCell(2).value;
      const partContent = row.getCell(3).value;
      const subPart = row.getCell(4).value;
      const typeCell = row.getCell(5).value;

      if (!typeCell) continue;
      let type = String(typeCell).toLowerCase().trim();
      const sequenceRaw = row.getCell(6).value;
      const audioLinkRaw = row.getCell(7).value;
      const imageLinkRaw = row.getCell(8).value;
      const question = row.getCell(9).value;
      const questionContent = row.getCell(10).value;
      const correctAnswer = row.getCell(11).value;
      const subQuestion = row.getCell(12).value;
      let groupQuestion = row.getCell(13).value;

      // Bỏ qua hàng trống hoàn toàn
      const allEmpty = [
        topic,
        skillName,
        partContent,
        subPart,
        type,
        sequenceRaw,
        audioLinkRaw,
        imageLinkRaw,
        question,
        questionContent,
        correctAnswer,
        subQuestion,
        groupQuestion,
      ].every((v) => !v);
      if (allEmpty) continue;

      // Lấy PartID theo cặp (Part, SubPart)
      const partKeyForRow = buildPartKey(partContent, subPart);
      const partID = partIdByKey.get(partKeyForRow) || null;

      const skillKey = normSkillKey(skillName);
      const skillID = skillIdByKey.get(skillKey) || null;

      if (skillKey) foundSkills.add(skillKey);
      if (!skillID) {
        console.warn(
          `SkillID not found for row ${r}: raw="${skillName}", key="${skillKey}"`
        );
        unknownSkillRows.push({
          row: r,
          rawSkillName: skillName,
          skillKey,
        });
      }

      const audio = asText(audioLinkRaw);
      const image = asText(imageLinkRaw);

      // sequence cho QuestionSetQuestion (thứ tự trong đề)
      const sequenceForSet =
        sequenceRaw && !isNaN(sequenceRaw) ? parseInt(sequenceRaw, 10) : null;

      let answerContent = {};

      switch (type) {
        case 'dropdown-list': {
          const lines = (questionContent || '')
            .split('\n')
            .map((v) => v.trim())
            .filter(Boolean);
          const optionsAfterPipe = lines.map(
            (line) => line.split('|')[1]?.trim().toLowerCase() || ''
          );
          const allSame =
            optionsAfterPipe.length > 0 &&
            optionsAfterPipe.every((opt) => opt === optionsAfterPipe[0]);
          const groupTitle = audio
            ? formatTitleWithAudio(question, audio)
            : null;

          if (allSame) {
            const { leftItems, rightItems } =
              formatQuestionContent(questionContent);
            answerContent = {
              content: question,
              ...(groupTitle ? { groupContent: groupTitle } : {}),
              leftItems,
              rightItems,
              correctAnswer: parseAnswers(correctAnswer, questionContent),
              partID,
              type,
              ...(audio ? { audioKeys: audio } : {}),
            };
          } else {
            answerContent = {
              content: question,
              ...(groupTitle ? { groupContent: groupTitle } : {}),
              options: parseQuestionContent(questionContent),
              correctAnswer: parseAnswers(correctAnswer, questionContent),
              partID,
              type,
              ...(audio ? { audioKeys: audio } : {}),
            };
          }
          break;
        }

        case 'matching': {
          const { leftItems, rightItems } =
            formatMatchingContent(questionContent);
          const groupTitle = audio
            ? formatTitleWithAudio(question, audio)
            : null;
          answerContent = {
            content: question,
            ...(groupTitle ? { groupContent: groupTitle } : {}),
            leftItems,
            rightItems,
            correctAnswer: parseMatchingAnswers(correctAnswer, questionContent),
            ...(audio ? { audioKeys: audio } : {}),
          };
          break;
        }

        case 'listening-questions-group': {
          const groupContent = formatQuestionToJson(
            question,
            questionContent,
            correctAnswer,
            partID,
            type
          );
          answerContent = {
            content: question,
            groupContent,
            partID,
            type,
            ...(audio ? { audioKeys: audio } : {}),
          };
          break;
        }

        case 'multiple-choice': {
          const groupTitle = audio ? formatTitleWithAudio(question) : null;
          const result = audio
            ? formatMultipleChoiceWithAudio(questionContent, correctAnswer)
            : formatMultipleChoice(questionContent, correctAnswer);

          if (!result.correctAnswer) {
            throw new Error('Correct answer not found in options');
          }

          answerContent = {
            ...(audio ? { content: question } : { title: question }),
            ...(groupTitle ? { groupContent: groupTitle } : {}),
            options: result.options,
            correctAnswer: result.correctAnswer,
            ...(audio ? { partID, type, audioKeys: audio } : {}),
          };
          break;
        }

        case 'ordering': {
          const groupTitle = audio
            ? formatTitleWithAudio(question, audio)
            : null;
          answerContent = {
            content: question,
            ...(groupTitle ? { groupContent: groupTitle } : {}),
            options: formatAnswers(questionContent),
            correctAnswer: formatCorrectAnswer(correctAnswer, questionContent),
            partID,
            type,
            ...(audio ? { audioKeys: audio } : {}),
          };
          break;
        }

        case 'speaking': {
          const groupTitle = audio
            ? formatTitleWithAudio(question, audio)
            : null;
          answerContent = {
            content: question,
            ...(groupTitle ? { groupContent: groupTitle } : {}),
            groupContent: groupTitle,
            options: questionContent,
            correctAnswer,
            partID,
            type,
            ImageKeys: image ? [image] : null,
            ...(audio ? { audioKeys: audio } : {}),
          };
          break;
        }

        case 'writing': {
          // nếu schema yêu cầu object, đổi thành { content: question, correctAnswer }
          answerContent = correctAnswer;
          break;
        }

        default:
          console.warn(`Unknown type: ${type}`);
          continue;
      }

      questionsToCreate.push({
        Type: type,
        AudioKeys: audio || null,
        ImageKeys: image ? [image] : null,
        SkillID: skillID,
        PartID: partID,
        // Sequence ở Question giờ chỉ là nội bộ, có thể để null hoặc dùng sequenceRaw
        Sequence: sequenceForSet,
        Content: question,
        SubContent: subPart ? subPart : null,
        GroupContent: null,
        AnswerContent: answerContent,
      });

      questionMeta.push({
        partID,
        sequenceForSet,
      });
    }

    // 5.6.x Nếu có skill trong file nhưng không tồn tại trong DB → báo lỗi sớm
    if (unknownSkillRows.length > 0) {
      await transaction.rollback();

      const detail = unknownSkillRows
        .map((x) => `row ${x.row}: "${x.rawSkillName}" -> key "${x.skillKey}"`)
        .join('; ');

      return {
        status: 400,
        message: `Unknown skill (not found in DB): ${detail}`,
      };
    }

    // 5.7 Validate đủ skill/type
    const requiredTypes = [
      'writing',
      'speaking',
      'ordering',
      'multiple-choice',
      'listening-questions-group',
      'matching',
      'dropdown-list',
    ];
    const requiredSkills = [
      'speaking',
      'writing',
      'reading',
      'listening',
      'grammarandvocabulary',
    ];

    const foundTypes = new Set(questionsToCreate.map((q) => q.Type));
    const hasAllTypes = requiredTypes.every((t) => foundTypes.has(t));
    const hasAllSkills = requiredSkills.every((s) => foundSkills.has(s));

    if (!hasAllSkills) {
      await transaction.rollback();
      console.error('foundSkills:', Array.from(foundSkills));
      console.error('requiredSkills:', requiredSkills);
      return { status: 400, message: 'Missing skill' };
    }
    if (!hasAllTypes) {
      await transaction.rollback();
      return { status: 400, message: 'Missing type' };
    }

    // 5.8 Validate content theo Part
    const perPart = new Map();
    for (const q of questionsToCreate) {
      if (!q.PartID) continue;
      if (!perPart.has(q.PartID)) perPart.set(q.PartID, []);
      perPart.get(q.PartID).push(q.Content);
    }
    const valid = Array.from(perPart.values()).every(
      (arr) =>
        Array.isArray(arr) &&
        arr.length > 0 &&
        arr.every((c) => String(c || '').trim() !== '')
    );
    if (!valid) {
      await transaction.rollback();
      return {
        status: 400,
        message: 'Some PartIDs have invalid or empty content',
      };
    }

    // 5.9 DEDUPE Question trên DB: chỉ tạo mới nếu chưa tồn tại
    const partIdsUsed = Array.from(
      new Set(questionsToCreate.map((q) => q.PartID).filter((id) => !!id))
    );

    let existingQuestions = [];
    if (partIdsUsed.length > 0) {
      existingQuestions = await Question.findAll({
        where: { PartID: partIdsUsed },
        transaction,
      });
    }

    const existingQuestionIdByKey = new Map(
      existingQuestions.map((q) => [buildQuestionKeyFromDb(q), q.ID])
    );

    // finalQuestionIds: index theo questionsToCreate, giá trị là ID (cũ hoặc mới)
    const finalQuestionIds = new Array(questionsToCreate.length).fill(null);
    const questionsToInsert = [];

    questionsToCreate.forEach((q, idx) => {
      const key = buildQuestionKey(q);
      const existedId = existingQuestionIdByKey.get(key);

      if (existedId) {
        // Question đã tồn tại trong DB -> dùng lại ID, KHÔNG tạo mới
        finalQuestionIds[idx] = existedId;
      } else {
        questionsToInsert.push({
          key,
          index: idx,
          data: q,
        });
      }
    });

    if (questionsToInsert.length > 0) {
      const createdQuestions = await Question.bulkCreate(
        questionsToInsert.map((x) => x.data),
        {
          transaction,
          validate: true,
          returning: true,
        }
      );

      createdQuestions.forEach((q, i) => {
        const { key, index } = questionsToInsert[i];
        finalQuestionIds[index] = q.ID;
        existingQuestionIdByKey.set(key, q.ID);
      });
    }

    // 5.10 Tạo QuestionSetQuestion cho từng Question (dùng finalQuestionIds)
    const qsqRows = [];
    questionMeta.forEach((meta, idx) => {
      const partID = meta.partID;
      if (!partID) return;

      const questionSetID = questionSetIdByPartId.get(partID);
      if (!questionSetID) return;

      const questionID = finalQuestionIds[idx];
      if (!questionID) return;

      qsqRows.push({
        QuestionSetID: questionSetID,
        QuestionID: questionID,
        Sequence: meta.sequenceForSet,
      });
    });

    if (qsqRows.length) {
      await QuestionSetQuestion.bulkCreate(qsqRows, { transaction });
    }

    // 5.11 Done
    await transaction.commit();
    return { status: 200, message: 'Parse Successfully' };
  } catch (error) {
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
      } catch (e) {
        console.error('Error during transaction rollback:', e);
      }
    }
    const msg = safeErrMsg(error);
    console.error('Error while parsing Excel:', error);
    return { status: 500, message: `Error parsing file: ${msg}` };
  }
};

module.exports = { generateTemplateFile, parseExcelBuffer };
