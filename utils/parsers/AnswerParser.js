const { splitAndTrimLines } = require("../common/StringUtils");
const { parseQuestionContent } = require("./QuestionContentParser");

const letterToIndex = (letter) =>
  String(letter || "").trim().toUpperCase().charCodeAt(0) - 65;

const parseAnswers = (correctStr, contentStr) => {
  const correctLines = splitAndTrimLines(correctStr);
  const optionsByKey = new Map(
    parseQuestionContent(contentStr).map((item) => [String(item.key), item.value])
  );

  return correctLines.flatMap((line) => {
    const [keyPart, ansLetter] = line.split("|").map((s) => s.trim());
    const key = keyPart.match(/\d+/)?.[0];
    if (!key || key === "0") return [];

    const options = optionsByKey.get(key);
    if (!options) return [];

    const index = letterToIndex(ansLetter);
    return {
      key,
      value: options[index] || "",
    };
  });
};

module.exports = { parseAnswers };
