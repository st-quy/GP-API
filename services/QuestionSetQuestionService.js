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
};
