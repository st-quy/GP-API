const { LEADING_NUMBER_REGEX } = require("../common/Regex");
const { splitAndTrimLines } = require("../common/StringUtils");

const parseAnswers = (correctStr, contentStr) => {
  const correctLines = splitAndTrimLines(correctStr);
  const contentLines = splitAndTrimLines(contentStr);

  return correctLines.map((line, i) => {
    const [keyPart, ansLetter] = line.split("|").map((s) => s.trim());
    const key = keyPart.replace(LEADING_NUMBER_REGEX);
    const answer = ansLetter?.toUpperCase();

    const optionsLine = contentLines[i]?.split("|")[1]?.trim() || "";
    const options = Object.fromEntries(
      optionsLine.split("/").map((opt) => {
        const [letter, ...textParts] = opt.split(".");
        return [letter.trim(), textParts.join(".").trim()];
      })
    );

    return { key, value: options[answer] || "" };
  });
};

module.exports = { parseAnswers };
