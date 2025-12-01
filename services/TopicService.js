const {
  QuestionSet,
  QuestionSetQuestion,
  Question,
  Skill,
  Part,
  Topic,
} = require('../models');
const { Op } = require('sequelize');

// // This section is for handling shuffle from backend, uncomment if you want to use this instead of doing this in frontend.

// const shuffleArray = (array) => {
//   const shuffled = [...array];
//   for (let i = shuffled.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//   }
//   return shuffled;
// };

// const shuffleQuestionAnswers = (question, skillNameFromPart) => {
//   if (!question) return question;

//   // Clone to avoid accidental mutation side effects
//   const q = { ...question };

//   const type = (q.Type || q.type || '').toLowerCase();
//   const skill =
//     (skillNameFromPart ||
//       q.Skill?.Name ||
//       q.skill?.name ||
//       '').toLowerCase();

//   // --- CASE 1 & 2: dropdown list / matching + listening or grammar ---
//   // leftItems: ["1. Speaker A …", "2. Speaker B ...", ...]
//   // rightItems: ["travels by bike.", "travels by car.", ...]

//   if (
//     (type === 'dropdown_list' || type === 'matching') &&
//     (skill === 'listening' || skill === 'grammar and vocabulary')
//   ) {
//     if (Array.isArray(q.leftItems) && Array.isArray(q.rightItems)) {
//       if (q.leftItems.length === q.rightItems.length) {
//         const indices = q.leftItems.map((_, idx) => idx);
//         const shuffledIdx = shuffleArray(indices);

//         const newLeft = [];
//         const newRight = [];
//         shuffledIdx.forEach((i) => {
//           newLeft.push(q.leftItems[i]);
//           newRight.push(q.rightItems[i]);
//         });

//         q.leftItems = newLeft;
//         q.rightItems = newRight;
//       }
//     }
//   }

//   // --- CASE 3: multiple choice + grammar ---
//   // options: [{ key: "A", value: "should" }, ...]
//   if (
//     type === 'multiple_choice' &&
//     skill === 'grammar and vocabulary' &&
//     Array.isArray(q.options)
//   ) {
//     const correctKey = q.correctAnswer;
//     const originalCorrectOption = q.options.find(
//       (opt) => opt.key === correctKey
//     );

//     const shuffledOptions = shuffleArray([...q.options]);

//     const KEY_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
//     shuffledOptions.forEach((opt, idx) => {
//       opt.key = KEY_LABELS[idx];
//     });

//     q.options = shuffledOptions;

//     if (originalCorrectOption) {
//       const newIndex = q.options.findIndex(
//         (opt) => opt.value === originalCorrectOption.value
//       );
//       if (newIndex !== -1) {
//         q.correctAnswer = q.options[newIndex].key;
//       }
//     }
//   }

//   // --- CASE 4: multiple choice + listening ---
//   // options: ["Cold and wet", "Hot and sunny", ...]
//   if (
//     type === 'multiple_choice' &&
//     skill === 'listening' &&
//     Array.isArray(q.options)
//   ) {
//     q.options = shuffleArray(q.options);
//   }

//   return q;
// };

const getQuestionsByQuestionSetId = async (req) => {
  try {
    const { questionSetId } = req.params;

    const questionSet = await QuestionSet.findByPk(questionSetId, {
      include: [
        {
          model: QuestionSetQuestion,
          as: 'Questions',
          include: [
            {
              model: Question,
              as: 'Question',
              include: [
                { model: Skill, as: 'Skill' },
                { model: Part, as: 'Part' },
              ],
            },
          ],
        },
      ],
    });

    if (!questionSet) {
      return res.status(404).json({ message: 'QuestionSet not found' });
    }

    let questions = questionSet.Questions.map((item) => ({
      ...item.Question.dataValues,
      Sequence: item.Sequence,
    }));

    return {
      questionSetId,
      shuffleQuestions: questionSet.ShuffleQuestions,
      shuffleAnswers: questionSet.ShuffleAnswers,
      questions,
    };
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createTopic = async (req) => {
  try {
    const { Name } = req.body;
    if (!Name) {
      throw new Error('Topic Name is required');
    }
    const newTopic = await Topic.create({
      Name,
    });
    return {
      status: 201,
      message: 'Topic created successfully',
      data: newTopic,
    };
  } catch (error) {
    throw new Error(`Error creating topic: ${error.message}`);
  }
};

const getAllTopics = async () => {
  try {
    const topics = await Topic.findAll();

    return {
      status: 200,
      message: 'Get all topic successfully',
      data: topics,
    };
  } catch (error) {
    throw new Error(`Error get all topic: ${error.message}`);
  }
};

const getTopicWithRelations = async (req, res) => {
  try {
    const topicId = req.params.id;
    const { questionType, skillName } = req.query;

    const questionWhere = {};
    if (questionType) {
      questionWhere.Type = questionType;
    }

    const skillWhere = {};
    if (skillName) {
      skillWhere.Name = skillName;
    }

    const topic = await Topic.findOne({
      where: { ID: topicId },
      include: [
        {
          model: Part,
          as: 'Parts',
          include: [
            {
              model: Skill,
              as: 'Skill',
              ...(skillName && {
                where: skillWhere,
                required: true,
              }),
            },
            {
              model: Question,
              ...(questionType && {
                where: questionWhere,
                required: true,
              }),
            },
          ],
        },
      ],
      order: [
        // sort Part theo Sequence
        [{ model: Part, as: 'Parts' }, 'Sequence', 'ASC'],
        // sort Question trong mỗi Part theo Sequence
        [{ model: Part, as: 'Parts' }, { model: Question }, 'Sequence', 'ASC'],
      ],
      distinct: true, // tránh duplicate khi join M:N
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Convert Sequelize instance -> plain object (loại bỏ circular)
    const plainTopic = topic.get({ plain: true });
    return plainTopic;
  } catch (error) {
    console.error('Error fetching topic with relations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getTopicByName = async (req, res) => {
  const { name } = req.query;
  try {
    const topic = await Topic.findOne({
      where: {
        Name: {
          [Op.iLike]: `%${name}%`,
        },
      },
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    return res.status(200).json({
      message: 'Get topic by name successfully',
      data: topic,
    });
  } catch (error) {
    console.error('Error fetching topic by name:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

async function addPartToTopic(req, res) {
  try {
    const { topicId, partId } = req.body;

    const topic = await Topic.findByPk(topicId);
    const part = await Part.findByPk(partId);

    if (!topic || !part) {
      return res.status(404).json({ message: 'Topic or Part not found' });
    }

    await topic.addPart(part);

    return res.status(200).json({
      message: 'Part added to Topic successfully',
    });
  } catch (error) {
    console.error('Error adding Part to Topic:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function removePartFromTopic(req, res) {
  try {
    const { topicId, partId } = req.body;

    const topic = await Topic.findByPk(topicId);
    const part = await Part.findByPk(partId);

    if (!topic || !part) {
      return res.status(404).json({ message: 'Topic or Part not found' });
    }

    await topic.removePart(part);

    return res.status(200).json({
      message: 'Part removed from Topic successfully',
    });
  } catch (error) {
    console.error('Error removing Part from Topic:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getAllTopics,
  createTopic,
  addPartToTopic,
  removePartFromTopic,
  getTopicWithRelations,
  getTopicByName,
  getQuestionsByQuestionSetId,
};
