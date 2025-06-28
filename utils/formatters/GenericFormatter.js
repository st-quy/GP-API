const { splitAndTrimLines } = require("../common/StringUtils");

const formatAnswers = (answersStr) => {
  return splitAndTrimLines(answersStr).map((line) => {
    const parts = line.split(".");
    return parts.slice(1).join(".").trim();
  });
};

const formatCorrectAnswer = (correctAnswerStr, questionContentStr) => {
  const correctAnswers = splitAndTrimLines(correctAnswerStr).map((line) => {
    const [value, key] = line.split("|").map((s) => s.trim());
    return { key, value: parseInt(value, 10) };
  });

  const options = splitAndTrimLines(questionContentStr).map((line) => {
    const [key, ...rest] = line.split(".");
    const answer = rest.join(".").trim();
    return { key: key.trim(), answer };
  });

  return correctAnswers.map((answer) => {
    const matchingOption = options.find((option) => option.key === answer.key);
    return {
      key: matchingOption ? matchingOption.answer : "",
      value: answer.value,
    };
  });
};

module.exports = {
  formatAnswers,
  formatCorrectAnswer,
};
