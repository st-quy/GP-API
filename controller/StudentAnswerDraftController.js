const StudentAnswerDraftService = require("../services/StudentAnswerDraftService");

const storeStudentAnswerDraft = async (req, res) => {
  try {
    const { studentId, topicId, studentAnswer } = req.body;
    if (!studentId || !topicId || !studentAnswer) {
      return res.status(400).json({ message: "Invalid data format" });
    }
    const result = await StudentAnswerDraftService.storeStudentAnswerDraft(req);

    res.status(result.status).json({
      message: result.message,
    });
  } catch (error) {
    console.error("Error saving student answer:", error);
    res.status(500).json(error.message);
  }
};

module.exports = { storeStudentAnswerDraft };
