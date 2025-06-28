const fs = require("fs");
const path = require("path");
const juice = require("juice");
const {
  generateWritingSection,
  generateSpeakingSection,
} = require("./utils/helpers");

const template = require("./templates/student-assessment.js");

function formatDate(dateObj) {
  const date = new Date(dateObj);
  return date.toLocaleDateString("vi-VN");
}

exports.generatePDF = async (
  student,
  className,
  session,
  sessionParticipant,
  result,
) => {
  try {
    const writingHTML = generateWritingSection(result);
    const speakingHTML = generateSpeakingSection(
      result,
      className.className,
      session.sessionName
    );

    const data = {
      studentId: student.studentCode,
      studentEmail: student.email,
      studentFirstName: student.firstName,
      studentLastName: student.lastName,
      studentName: `${student.firstName} ${student.lastName}`,
      phone: student.phone,
      className: className.className,
      status: session.status,
      startDate: formatDate(session.startTime),
      endDate: formatDate(session.endTime),
      sessionName: session.sessionName,
      sessionKey: session.sessionKey,
      GrammarAndVocab: sessionParticipant.GrammarVocab,
      Reading: sessionParticipant.Reading,
      ReadingLevel: sessionParticipant.ReadingLevel,
      Listening: sessionParticipant.Listening,
      ListeningLevel: sessionParticipant.ListeningLevel,
      Writing: sessionParticipant.Writing,
      WritingLevel: sessionParticipant.WritingLevel,
      Speaking: sessionParticipant.Speaking,
      SpeakingLevel: sessionParticipant.SpeakingLevel,
      Total: sessionParticipant.Total,
      Level: sessionParticipant.Level,
      Date: formatDate(sessionParticipant.createdAt),
      writingSection: writingHTML,
      speakingSection: speakingHTML,
    };

    const rawHtml = template(data);
    const inlinedHtml = juice(rawHtml);
    return inlinedHtml;
  } catch (error) {
    console.error("❌ Lỗi khi tạo PDF:", error);
    throw error;
  }
};
