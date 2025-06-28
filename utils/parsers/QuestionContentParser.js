const { splitAndTrimLines } = require("../common/StringUtils");

const parseQuestionContent = (contentStr) =>
  splitAndTrimLines(contentStr).map((line) => {
    const [keyPart, opts] = line.split("|").map((s) => s.trim());
    const key = keyPart.match(/\d+/)?.[0];
    const value = opts
      .split("/")
      .map((opt) => opt.split(".").slice(1).join(".").trim());
    return { key, value };
  });

module.exports = { parseQuestionContent };
