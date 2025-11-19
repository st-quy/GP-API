module.exports = {
  SESSION_REQUEST_STATUS: {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
  },
  skillMapping: {
    READING: "Reading",
    LISTENING: "Listening",
    WRITING: "Writing",
    SPEAKING: "Speaking",
    "GRAMMAR AND VOCABULARY": "GrammarVocab",
  },
  skillIDMapping: {
    READING: "",
    LISTENING: "",
    WRITING: "",
    SPEAKING: "",
    GRAMMAR_VOCAB: "",
  },
  questionTypeMapping:{
    WRITING: "writing",
    SPEAKING: "speaking",
    MULTIPLE_CHOICE: "multiple-choice",
    ORDERING: "ordering",
    DROPDOWN_LIST: "dropdown-list",
    MATCHING: "matching",
    LISTENING_QUESTION_GROUP: "listening-question-group",
  },
  skillMappingLevel: {
    READING: "ReadingLevel",
    LISTENING: "ListeningLevel",
    WRITING: "WritingLevel",
    SPEAKING: "SpeakingLevel",
  },
  pointsPerQuestion: {
    listening: 2,
    GrammarVocab: 1,
    reading: 50 / 29,
  },
  level: {
    X: "X",
    A1: "A1",
    A2: "A2",
    B1: "B1",
    B2: "B2",
    C: "C",
  },
};
