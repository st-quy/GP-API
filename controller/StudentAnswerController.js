const StudentAnswerService = require("../services/StudentAnswerService");

const storeStudentAnswers = async (req, res) => {
  try {
    const { studentId, topicId, questions } = req.body;
    if (!studentId || !topicId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: "Invalid data format" });
    }
    const result = await StudentAnswerService.storeStudentAnswers(req);
    res.status(result.status).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Error saving student answers:", error);
    res.status(500).json(error.message);
  }
};

module.exports = { storeStudentAnswers };
