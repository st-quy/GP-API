const { splitAndTrimLines } = require("../common/StringUtils");

const cleanItems = (lines, isLeft = true) => {
  return lines
    .filter(
      (line) =>
        isLeft
          ? line.match(/^\d+\./) // match "1.", "2.", etc. on the left side
          : line.match(/^[A-J]\./) // match "A.", "B.", etc. on the right side
    )
    .map((line) => {
      if (isLeft) {
        return line.replace(/^\d+\.\s*/, "").trim();
      } else {
        return line.replace(/^[A-J]\.\s*/, "").trim();
      }
    });
};

const parseMatchingAnswers = (correctStr, questionContent) => {
  const sections = questionContent.split(/Options:/i);

  if (sections.length !== 2) return [];

  const leftItems = cleanItems(splitAndTrimLines(sections[0]));
  const rightItems = cleanItems(splitAndTrimLines(sections[1]), false);

  return splitAndTrimLines(correctStr)
    .map((line) => {
      const [leftNum, optionLetter] = line.split("|").map((s) => s.trim());
      if (!leftNum || !optionLetter) return null;

      const leftIndex = parseInt(leftNum, 10) - 1;
      const left = leftItems[leftIndex] || "";

      const rightIndex = optionLetter.charCodeAt(0) - "A".charCodeAt(0);
      const right = rightItems[rightIndex] || "";

      return { left, right };
    })
    .filter(Boolean);
};

module.exports = { parseMatchingAnswers };
