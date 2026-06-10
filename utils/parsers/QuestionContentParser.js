const { splitAndTrimLines } = require("../common/StringUtils");

const OPTION_LETTER_REGEX = /^[A-Z][.)]\s*/i;
const INLINE_BLANK_REGEX = /(\d+)\.\s*\(([^)]+)\)/g;

const normalizeOptions = (rawOptions) =>
  String(rawOptions || "")
    .split("/")
    .map((opt) => opt.trim().replace(OPTION_LETTER_REGEX, "").trim())
    .filter(Boolean);

const parseQuestionContent = (contentStr) =>
  splitAndTrimLines(contentStr).flatMap((line) => {
    if (line.includes("|")) {
      const [keyPart, opts] = line.split("|").map((s) => s.trim());
      const key = keyPart.match(/\d+/)?.[0];
      if (!key || key === "0") return [];

      return {
        key,
        value: normalizeOptions(opts),
      };
    }

    const blanks = [];
    for (const match of line.matchAll(INLINE_BLANK_REGEX)) {
      const [, key, opts] = match;
      if (!key || key === "0") continue;
      blanks.push({
        key,
        value: normalizeOptions(opts),
      });
    }
    return blanks;
  });

module.exports = { parseQuestionContent };
