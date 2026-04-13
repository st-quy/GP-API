/**
 * Sanitizes question objects by masking correct answers if the user is a student.
 * ALWAYS masks correct answers for students to protect exam integrity across semesters.
 * We use a placeholder instead of deleting to satisfy frontend schema requirements.
 * @param {Object} question - The question object or resource object to sanitize.
 * @param {boolean} isStudent - Whether the user is a student.
 * @returns {Object} The sanitized object.
 */
const sanitizeQuestion = (question, isStudent) => {
  if (!isStudent || !question) return question;

  // Handle both Sequelize instances and plain objects
  const q = question.dataValues || question;

  const MASK = "hidden";

  // Sanitize AnswerContent (handle both AnswerContent and answerContent)
  const acKey = q.AnswerContent ? 'AnswerContent' : (q.answerContent ? 'answerContent' : null);
  if (acKey) {
    let answerContent = q[acKey];
    if (typeof answerContent === 'string') {
      try { answerContent = JSON.parse(answerContent); } catch (e) {}
    }
    if (answerContent && typeof answerContent === 'object') {
      const newAnswerContent = { ...answerContent };
      
      if (newAnswerContent.correctAnswer !== undefined) {
        if (Array.isArray(newAnswerContent.correctAnswer)) {
          newAnswerContent.correctAnswer = newAnswerContent.correctAnswer.map(item => {
            if (typeof item === 'object' && item !== null) {
              const newItem = { ...item };
              if (newItem.value !== undefined) newItem.value = MASK;
              if (newItem.right !== undefined) newItem.right = MASK;
              return newItem;
            }
            return MASK;
          });
        } else if (typeof newAnswerContent.correctAnswer === 'object' && newAnswerContent.correctAnswer !== null) {
          newAnswerContent.correctAnswer = { ...newAnswerContent.correctAnswer, value: MASK };
        } else {
          newAnswerContent.correctAnswer = MASK;
        }
      }
      
      if (question.dataValues) {
        question.dataValues[acKey] = newAnswerContent;
      } else {
        question[acKey] = newAnswerContent;
      }
    }
  }

  // Sanitize GroupContent (handle both GroupContent and groupContent)
  const gcKey = q.GroupContent ? 'GroupContent' : (q.groupContent ? 'groupContent' : null);
  if (gcKey) {
    let groupContent = q[gcKey];
    if (typeof groupContent === 'string') {
      try { groupContent = JSON.parse(groupContent); } catch (e) {}
    }
    if (groupContent && Array.isArray(groupContent.listContent)) {
      const newGroupContent = { ...groupContent };
      newGroupContent.listContent = groupContent.listContent.map(item => {
        const newItem = { ...item };
        if (newItem.correctAnswer !== undefined) {
          newItem.correctAnswer = MASK;
        }
        return newItem;
      });
      
      if (question.dataValues) {
        question.dataValues[gcKey] = newGroupContent;
      } else {
        question[gcKey] = newGroupContent;
      }
    }
  }

  return question;
};

module.exports = {
  sanitizeQuestion,
};
