const {
  QUESTION_BLOCK_SPLIT_REGEX,
  OPTION_PREFIX_REGEX,
  OPTION_REGEX,
  CORRECT_ANSWER_REGEX,
  QUESTION_SPLIT_REGEX,
  ANSWER_LINE_REGEX,
} = require("../common/Regex");

const { splitAndTrimLines } = require("../common/StringUtils");

const formatQuestionContent = (questionContent) => {
  const lines = splitAndTrimLines(questionContent);

  let firstOptions = null;
  let allOptionsSame = true;
  const leftItems = [];

  for (const line of lines) {
    const [left, right] = line.split("|").map((part) => part.trim());

    if (left) leftItems.push(left);

    if (right) {
      const options = right
        .split("/")
        .map((option) => option.split(".")[1]?.trim());

      if (!firstOptions) {
        firstOptions = options;
      } else if (JSON.stringify(firstOptions) !== JSON.stringify(options)) {
        allOptionsSame = false;
      }
    }
  }

  return {
    leftItems,
    rightItems: allOptionsSame && firstOptions ? firstOptions : [],
  };
};

const formatQuestionToJson = (
  question,
  questionContent,
  rawAnswerText,
  partID,
  type
) => {
  const parseCorrectAnswers = (rawText) => {
    const lines = rawText.split("\n").filter(Boolean);

    return lines
      .map((line) => {
        const match = line.match(ANSWER_LINE_REGEX);
        if (match) {
          const id = parseInt(match[1], 10);
          const answer = match[2];
          return { id, answer };
        }
        return null;
      })
      .filter(Boolean);
  };

  const correctAnswers = parseCorrectAnswers(rawAnswerText);

  const cleanedContent = questionContent.replace(/Option\s*\d+:/g, "").trim();

  const blocks = cleanedContent
    .split(QUESTION_SPLIT_REGEX)
    .map((block) => block.trim())
    .filter(Boolean);

  return {
    title: question,
    audioKey: "",
    listContent: blocks.map((block, index) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const questionLine =
        lines.find((line) => /^\d+[.:]/.test(line)) || lines[0] || "";
      const questionText = questionLine.replace(/^\d+[.:]\s*/, "").trim();

      const questionIDMatch = questionLine.match(/^(\d+)[.:]/);
      const questionID = questionIDMatch
        ? parseInt(questionIDMatch[1], 10)
        : index + 1;

      const optionLines = lines.filter((line) => /^[A-Z][).]/.test(line));
      const options = optionLines.map((line) => {
        const match = line.match(OPTION_PREFIX_REGEX);
        return match ? line.replace(OPTION_PREFIX_REGEX, "").trim() : line;
      });

      const correctEntry = correctAnswers.find(
        (item) => item.id === questionID
      );
      const correctLetter = correctEntry ? correctEntry.answer : "";

      let correctAnswerText = "";
      if (correctLetter) {
        const optionLine = optionLines.find(
          (line) =>
            line.startsWith(correctLetter + ")") ||
            line.startsWith(correctLetter + ".")
        );
        if (optionLine) {
          correctAnswerText = optionLine
            .replace(OPTION_PREFIX_REGEX, "")
            .trim();
        }
      }

      return {
        ID: questionID,
        content: questionText,
        options: options,
        type: type,
        correctAnswer: correctAnswerText,
        partID: partID,
      };
    }),
  };
};

const formatTitleWithAudio = (title) => {
  return {
    title: title || "",
    audioKey: "",
  };
};

module.exports = {
  formatQuestionContent,
  formatQuestionToJson,
  formatTitleWithAudio,
};
