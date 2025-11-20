// utils/speaking.util.js

/**
 * Build AnswerContent JSON for Speaking question
 */
function buildSpeakingAnswerContent(q, partID) {
  return {
    content: q.Content,
    groupContent: q.GroupContent ?? null,
    options: null,
    correctAnswer: null,
    partID,
    type: 'speaking',
    ImageKeys: q.ImageKeys ?? [],
  };
}

module.exports = {
  buildSpeakingAnswerContent,
};
