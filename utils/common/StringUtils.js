/**
 * Splits a string into lines, trims each line, and removes empty lines.
 * @param {string} str - Input string to split.
 * @returns {string[]} - Array of trimmed non-empty lines.
 */
function splitAndTrimLines(str) {
  return (str || "")
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

module.exports = {
  splitAndTrimLines,
};
