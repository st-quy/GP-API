const express = require("express");
const router = express.Router();

// Importing route modules
const userRoutes = require("./UserRoute");
const topicRoutes = require("./TopicRoute");
const ClassRoutes = require("./ClassRoute");
const SessionRoutes = require("./SessionRoute");
const StudentAnswerRoutes = require("./StudentAnswerRoute");
const StudentAnswerDraftRoutes = require("./StudentAnswerDraftRoute");
const Excels = require("./ExcelTemplateRoute");
const File = require("./PresignedUrlRouter");

// Defining routes
router.use("/users", userRoutes);
router.use("/topics", topicRoutes);
router.use("/classes", ClassRoutes);
router.use("/sessions", SessionRoutes);
router.use("/student-answers", StudentAnswerRoutes);
router.use("/student-answer-draft", StudentAnswerDraftRoutes);
router.use("/excel", Excels);
router.use("/session-requests", require("./SessionRequestRoute"));
router.use("/session-participants", require("./SessionParticipantRoute"));
router.use("/send-email", require("./SendMailRouter"));
router.use("/grades", require("./GradeRoute"));
router.use("/presigned-url", File);
router.use("/questions", require("./QuestionRoute"));
router.use("/parts", require("./PartRoute"));
router.use("/topicparts", require("./TopicPartRoute"));
router.use("/question-set", require("./QuestionSetRoute"));
router.use("/question-set-questions", require("./QuestionSetQuestionRoute"));

// Add more routes here as needed
// router.use("/another-route", anotherRoute);

module.exports = router;
