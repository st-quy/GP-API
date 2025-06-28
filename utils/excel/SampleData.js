const DataMultipleChoice = [
  [
    "Write your multiple-choice question here.",
    "",
    "",
    "(A). Option A\n(B). Option B\n(C). Option C",
    "(C)",
    "",
    "",
  ],
  [
    "Write your multiple-choice question here.",
    "",
    "Enter the group question title here.",
    "(A). Option A\n(B). Option B\n(C). Option C",
    "(A)",
    "",
    "",
  ],
];

const DataDropdownList = [
  [
    "Enter your dropdown question content here. For example, an email or short passage with numbered blanks. (1), (2), etc.",
    "",
    "",
    "(1). write question here ... | A. Option A / B. Option B / C. Option C\n(2). write question here ... | A. Option A / B. Option B / C. Option C",
    "(1) | (B)\n(2) | (A)",
    "",
    "",
  ],
  [
    "Example: Four people are talking about their commute. Complete the sentences using dropdown options.",
    "",
    "Repeat the instruction or group question title here.",
    "(1). write question here ... | A. Option A / B. Option B / C. Option C\n(2). write question here ... | A. Option A / B. Option B / C. Option C",
    "(1). write question here ... | A\n(2). write question here ... | B",
    "",
    "",
  ],
];

const DataOrdering = [
  "Write sentences in mixed order that need to be rearranged.",
  "",
  "",
  "(A). Sentence one\n(B). Sentence two\n(C). Sentence three\n(D). Sentence four\n(E). Sentence five",
  "(A) | (3)\n(B) | (1)\n(C) | (5)\n(D) | (2)\n(E) | (4)",
  "",
  "",
];
const DataMatching = [
  "Example: Match the words with their meanings.",
  "Example: big - large",
  "",
  "Contents :\n(1). Your word here.\n(2). Your word here.\n\nOptions :\n(A). Option A\n(B). Option B\n(C). Option C",
  "(1) | (C)\n(2) | (A)",
  "",
  "",
];

const DataWriting = [
  "Write the task prompt here. For example: Write an email to your friend about a topic.",
  "* (You may write up to 75 words without penalty.)",
  "",
  "",
  "",
  "",
  "",
];

const DataSpeaking = [
  "Write the speaking prompt here. For example: Tell me about your favorite movie.",
  "",
  "",
  "",
  "",
  "",
  "may or may not be",
];

const DataListeningGroup = [
  "Write a short instruction or context for the audio.",
  "",
  "",
  "Option 1: \n1: Write question here ... \n(A) ...\n(B) ... \n(C) ... \n  \nOption 2:  \n2: Write question here ... \n(A) ...\n(B) ... \n(C) ...",
  "Option 1:\nQuestion | (1)\nOption 2: \nQuestion | (2)",
  "https://your-audio-link-here.com/audio.mp3",
  "",
];

module.exports = {
  DataMultipleChoice,
  DataDropdownList,
  DataMatching,
  DataOrdering,
  DataListeningGroup,
  DataWriting,
  DataSpeaking,
};
