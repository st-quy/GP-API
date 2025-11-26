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
function buildReadingAnswerContent(q, partID) {
  switch (q.Type) {
    case 'dropdown-list':
      return {
        content: q.Content,
        options: q.options || [],
        correctAnswer: q.correctAnswer || [],
        partID,
        type: 'dropdown-list',
      };

    case 'matching':
      return {
        content: q.Content,
        leftItems: q.leftItems || [],
        rightItems: q.rightItems || [],
        correctAnswer: q.correctAnswer || [],
        partID,
        type: 'matching',
      };

    case 'ordering':
      return {
        content: q.Content,
        options: q.options || [],
        correctAnswer: q.correctAnswer || [],
        partID,
        type: 'ordering',
      };

    default:
      // nếu FE gửi type lạ thì fallback dùng luôn AnswerContent FE gửi
      return q.AnswerContent || null;
  }
}

module.exports = {
  buildSpeakingAnswerContent,
  buildReadingAnswerContent,
};
