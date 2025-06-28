const { OPTION_REGEX, LEADING_NUMBER_REGEX } = require("../common/Regex");

const { splitAndTrimLines } = require("../common/StringUtils");

const formatMatchingContent = (questionContent) => {
  const lines = splitAndTrimLines(questionContent);

  const leftItems = [];
  const rightItems = [];
  let parsingContents = false;
  let parsingOptions = false;

  lines.forEach((line) => {
    if (line.toLowerCase().startsWith("contents:")) {
      parsingContents = true;
      parsingOptions = false;
      return;
    }
    if (line.toLowerCase().startsWith("options:")) {
      parsingOptions = true;
      parsingContents = false;
      return;
    }

    if (parsingContents) {
      const content = line
        .replace(LEADING_NUMBER_REGEX, "")
        .replace("=", "")
        .trim();
      if (content) leftItems.push(content);
    } else if (parsingOptions) {
      const dotIndex = line.indexOf(".");
      if (dotIndex !== -1) {
        const optionContent = line.slice(dotIndex + 1).trim();
        if (optionContent) rightItems.push(optionContent);
      }
    }
  });

  return { leftItems, rightItems };
};

module.exports = { formatMatchingContent };
