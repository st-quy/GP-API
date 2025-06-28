const {
  User,
  Class,
  Session,
  SessionParticipant,
  StudentAnswer,
  Question,
  Part,
} = require("../models");
const { generatePDF } = require("../reports/generate-assessment-html");
const { sendMailWithAttachment } = require("./SendEmailService");

const pLimit = require("p-limit").default;

const generateStudentReportAndSendMail = async ({ req, userIds }) => {
  try {
    const { sessionId } = req.body;

    if (!userIds || userIds.length === 0) {
      throw new Error("No students to generate reports for.");
    }

    const limit = pLimit(5);

    const tasks = userIds.map((userId) =>
      limit(() => generateReportAndSendMail(userId, sessionId))
    );

    await Promise.all(tasks);
  } catch (err) {
    throw new Error(`Error generating reports: ${err.message}`);
  }
};

const generateReportAndSendMail = async (userId, sessionId) => {
  try {
    const sessionParticipant = await SessionParticipant.findOne({
      where: {
        UserID: userId,
        SessionID: sessionId,
      },
      attributes: [
        "ID",
        "UserID",
        "SessionID",
        "GrammarVocab",
        "Reading",
        "ReadingLevel",
        "Listening",
        "ListeningLevel",
        "Writing",
        "WritingLevel",
        "Speaking",
        "SpeakingLevel",
        "Total",
        "Level",
        "createdAt",
      ],
      include: [
        {
          model: User,
          attributes: [
            "ID",
            "firstName",
            "lastName",
            "email",
            "phone",
            "studentCode",
          ],
        },
        {
          model: Session,
          attributes: [
            "ID",
            "sessionName",
            "sessionKey",
            "ClassID",
            "startTime",
            "endTime",
            "status",
          ],
        },
      ],
    });

    const sessionInformation = sessionParticipant.Session;
    const studentInformation = sessionParticipant.User;

    const classInformation = await Class.findOne({
      where: { ID: sessionInformation.ClassID },
      attributes: ["ID", "className"],
    });

    const studentAnswers = await StudentAnswer.findAll({
      where: { StudentID: userId, SessionID: sessionId },
      attributes: ["QuestionID", "AnswerText", "AnswerAudio", "Comment"],
      raw: true,
    });

    const questionIDs = studentAnswers.map((sa) => sa.QuestionID);

    const questions = await Question.findAll({
      where: { ID: questionIDs, Type: ["writing", "speaking"] },
      attributes: ["ID", "Content", "Type", "PartID", "ImageKeys", "Sequence"],
      raw: true,
    });

    const answerMap = studentAnswers.reduce((acc, ans) => {
      acc[ans.QuestionID] = ans;
      return acc;
    }, {});

    const partIDs = [...new Set(questions.map((q) => q.PartID))];

    const parts = await Part.findAll({
      where: { ID: partIDs },
      attributes: ["ID", "Content"],
      raw: true,
    });

    const partMap = parts.reduce((acc, part) => {
      acc[part.ID] = part.Content;
      return acc;
    }, {});

    const grouped = questions.reduce((acc, question) => {
      const { ID, Content, Type, PartID, ImageKeys, Sequence } = question;
      const answer = answerMap[ID];

      if (!acc[Type]) acc[Type] = {};
      if (!acc[Type][PartID]) {
        acc[Type][PartID] = {
          PartID,
          ContentPart: partMap[PartID],
          questions: [],
        };
      }

      const questionItem = {
        QuestionID: ID,
        Sequence,
        ContentQuestion: Content,
        Comment: answer?.Comment ?? "",
        ...(Type === "writing" && {
          AnswerText: answer?.AnswerText ?? "",
        }),
        ...(Type === "speaking" && {
          AnswerAudio: answer?.AnswerAudio ?? "",
          ImageUrl: ImageKeys?.[0] ?? "",
        }),
      };

      acc[Type][PartID].questions.push(questionItem);
      return acc;
    }, {});

    const result = Object.entries(grouped).reduce((acc, [type, parts]) => {
      acc[type] = Object.values(parts)
        .map((part) => ({
          ...part,
          questions: part.questions
            .slice()
            .sort((a, b) => a.Sequence - b.Sequence),
        }))
        .sort((a, b) => {
          const getPartNumber = (content) =>
            +(content.match(/PART\s+(\d+)/i)?.[1] || Infinity);
          return getPartNumber(a.ContentPart) - getPartNumber(b.ContentPart);
        });
      return acc;
    }, {});

    const inlinedHtml = await generatePDF(
      studentInformation,
      classInformation,
      sessionInformation,
      sessionParticipant,
      result
    );

    await sendMailWithAttachment({
      to: studentInformation.email,
      studentName: `${studentInformation.firstName} ${studentInformation.lastName}`,
      sessionName: sessionInformation.sessionName,
      htmlContent: inlinedHtml,
    });
  } catch (err) {
    throw new Error(
      `Error generating report and sending mail for user ${userId}: ${err.message}`
    );
  }
};

module.exports = {
  generateStudentReportAndSendMail,
};
