const { OPTION_REGEX } = require("../common/Regex");

const { splitAndTrimLines } = require("../common/StringUtils");

const formatMultipleChoice = (questionContent, correctAnswer) => {
  const options = splitAndTrimLines(questionContent)
    .map((line) => {
      const match = line.match(OPTION_REGEX);
      if (!match) return null;
      return { key: match[1].toUpperCase(), value: match[2].trim() };
    })
    .filter(Boolean);

  const correct = correctAnswer.trim().toUpperCase();
  const correctOption = options.find((opt) => opt.key === correct);

  return {
    options,
    correctAnswer: correctOption ? correctOption.value : null,
  };
};

const formatMultipleChoiceWithAudio = (questionContent, correctAnswer) => {
  const options = splitAndTrimLines(questionContent)
    .map((line) => {
      const match = line.match(OPTION_REGEX);
      if (!match) return null;
      return match[2].trim(); 
    })
    .filter(Boolean);

  const correct = correctAnswer.trim().toUpperCase();

  const allOptions = splitAndTrimLines(questionContent)
    .map((line) => {
      const match = line.match(OPTION_REGEX);
      if (!match) return null;
      return { key: match[1].toUpperCase(), value: match[2].trim() };
    })
    .filter(Boolean);

  const correctOption = allOptions.find((opt) => opt.key === correct);

  return {
    options,
    correctAnswer: correctOption ? correctOption.value : null,
  };
};

module.exports = { formatMultipleChoice, formatMultipleChoiceWithAudio };
