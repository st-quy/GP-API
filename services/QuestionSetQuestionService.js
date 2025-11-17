const { QuetionSetQuestion } = require("../models/QuestionSetQuestion");

async function addQuestionToQuestionSet(req) {
  try {
    const { questionSetId, questionId, sequence } = req.body;
    if (!questionSetId || !questionId) {
      return {
        status: 400,
        message: "questionSetId and questionId are required",
      };
    }
    const existingQuestionSetQuestionId = await QuetionSetQuestion.findOne({
      where: {
        questionSetId: questionSetId,
        questionId: questionId,
      },
    });
    if (existingQuestionSetQuestionId) {
      return {
        status: 409,
        message: "This question is already added to the question set",
      };
    }
    const newQuestionSetQuestion = await QuetionSetQuestion.create({
      questionSetId,
      questionId,
      sequence,
    });
    return {
      status: 201,
      message: "Question added to QuestionSet successfully",
      data: newQuestionSetQuestion,
    };
  } catch (error) {
    throw new Error(`Error adding question to QuestionSet: ${error.message}`);
  }
}

async function getQuestionSetQuestionById(req) {
  try {
    const { id } = req.params;
    const QuestionSetQuestion = await QuetionSetQuestion.findByPk(id);
    if (!QuestionSetQuestion) {
      return {
        status: 404,
        message: "QuestionSetQuestion not found",
      };
    }
    return {
      status: 200,
      data: QuestionSetQuestion,
    };
  } catch (error) {
    throw new Error(`Error retrieving QuestionSetQuestion: ${error.message}`);
  }
}

async function getQuestionsByQuestionSetId(req, res) {
  try {
    const { id } = req.params;

    const questionSet = await QuestionSet.findByPk(id);
    if (!questionSet) {
      return res.status(404).json({
        status: 404,
        message: "QuestionSet not found",
      });
    }

    const items = await QuestionSetQuestion.findAll({
      where: { QuestionSetID: id },
      include: [
        {
          model: Question,
          include: [
            { model: Skill },
            { model: Part }
          ]
        }
      ],
      order: [["Sequence", "ASC"]],
    });

    if (!items || items.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "No questions found in this QuestionSet",
      });
    }

    let questions = items.map(index => ({
      sequence: index.Sequence,
      questionSetQuestionId: index.ID,
      ...index.Question.toJSON(),
    }));

    if (questionSet.ShuffleQuestions) {
      const groups = {};

      questions.forEach(q => {
        const key = q.GroupID || q.ID;
        if (!groups[key]) groups[key] = [];
        groups[key].push(q);
      });

      let groupArray = Object.values(groups);

      groupArray = shuffleArray(groupArray);

      questions = groupArray.flat();
    }

    if (questionSet.ShuffleAnswers) {
      questions = questions.map(q => {
        if (q.AnswerContent?.options) {
          const shuffled = shuffleArray(q.AnswerContent.options);
          return {
            ...q,
            AnswerContent: {
              ...q.AnswerContent,
              options: shuffled,
            }
          };
        }
        return q;
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Questions loaded successfully",
      data: {
        questionSet,
        questions
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Error loading questions",
      error: error.message,
    });
  }
}

async function removeQuestionFromQuestionSet(req) {
  try {
    const { questionSetId, questionId } = req.body;
    if (!questionSetId || !questionId) {
      return {
        status: 400,
        message: "questionSetId and questionId are required",
      };
    }
    const QuestionSetQuestion = await QuetionSetQuestion.findOne({
      where: {
        questionSetId: questionSetId,
        questionId: questionId,
      },
    });
    if (!QuestionSetQuestion) {
      return {
        status: 404,
        message: "This question is not found in the question set",
      };
    }
    await QuestionSetQuestion.destroy();
    return {
      status: 200,
      message: "Question removed from QuestionSet successfully",
    };
  } catch (error) {
    throw new Error(
      `Error removing question from QuestionSet: ${error.message}`
    );
  }
}

module.exports = {
  addQuestionToQuestionSet,
  removeQuestionFromQuestionSet,
  getQuestionSetQuestionById,
  getQuestionsByQuestionSetId,
};
