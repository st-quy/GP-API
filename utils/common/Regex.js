// Regex to extract option letter and text, e.g., "A) Option text"
const OPTION_REGEX = /^([A-Z])[.)]\s*(.+)$/i;
// Regex to match a leading number followed by a period and optional whitespace
const LEADING_NUMBER_REGEX = /^\d+\.\s*/;
// Regex to clean up leading number and colon in question text, e.g., "1: Question text"
const QUESTION_TEXT_REGEX = /^\d+: /;

// Split each question block starting with a number + colon (e.g., "1:")
const QUESTION_BLOCK_SPLIT_REGEX = /\n(?=\d+\s*:\s)/;

// Match a question line like "1: What is...?"
const QUESTION_LINE_REGEX = /^\d+\s*:\s?.+$/gm;

// Regex to match option prefixes like "A)", "B.", etc.
const OPTION_PREFIX_REGEX = /^([A-Z])[).]\s*/;

// Regex to split blocks by question numbers like "1.", "2:", etc.
const QUESTION_SPLIT_REGEX = /(?=\d+[.:])/g;

// Regex to parse answer line like "Option 5: 5 | A"
const ANSWER_LINE_REGEX = /Option\s*\d+:\s*(\d+)\s*\|\s*([A-Z])/;

const CORRECT_ANSWER_REGEX = (index) =>
  new RegExp(`Option ${index}: (\\d+) \\| ([A-C])`);

module.exports = {
  OPTION_REGEX,
  LEADING_NUMBER_REGEX,
  QUESTION_TEXT_REGEX,
  OPTION_PREFIX_REGEX,
  QUESTION_BLOCK_SPLIT_REGEX,
  QUESTION_LINE_REGEX,
  QUESTION_SPLIT_REGEX,
  ANSWER_LINE_REGEX,
  CORRECT_ANSWER_REGEX,
};
