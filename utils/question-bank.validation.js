const MAX_QUESTION_BANK_TEXT_LENGTH = 255;
const QUESTION_BANK_TEXT_REGEX = /^[a-zA-Z0-9 ,.\-_()"':?\n]*$/;

function validateText(value, fieldName, { required = true } = {}) {
  if (value == null || value === '') {
    return required ? `${fieldName} is required` : null;
  }

  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return required ? `${fieldName} is required` : null;
  }

  if (trimmed.length > MAX_QUESTION_BANK_TEXT_LENGTH) {
    return `${fieldName} must be at most ${MAX_QUESTION_BANK_TEXT_LENGTH} characters`;
  }

  if (!QUESTION_BANK_TEXT_REGEX.test(trimmed)) {
    return `${fieldName} contains invalid characters`;
  }

  return null;
}

function validateSpeakingPayload({ SectionName, parts }) {
  let error =
    validateText(SectionName, 'SectionName') ||
    (!parts || typeof parts !== 'object' ? 'parts are required' : null);

  if (error) return error;

  for (const [partKey, part] of Object.entries(parts)) {
    error = validateText(part?.name, `${partKey} name`);
    if (error) return error;

    const questions = Array.isArray(part?.questions) ? part.questions : [];
    for (let index = 0; index < questions.length; index += 1) {
      const content =
        questions[index]?.value ?? questions[index]?.content ?? questions[index]?.Content;
      error = validateText(
        content,
        `${partKey} question ${index + 1}`
      );
      if (error) return error;
    }
  }

  return null;
}

function validateWritingPayload({ SectionName, parts }) {
  let error =
    validateText(SectionName, 'SectionName') ||
    (!parts || typeof parts !== 'object' ? 'parts are required' : null);

  if (error) return error;

  error = validateText(parts.part1?.name, 'part1 name');
  if (error) return error;
  for (let index = 0; index < (parts.part1?.questions || []).length; index += 1) {
    error = validateText(
      parts.part1.questions[index]?.question,
      `part1 question ${index + 1}`
    );
    if (error) return error;
  }

  error =
    validateText(parts.part2?.name, 'part2 name') ||
    validateText(parts.part2?.question, 'part2 question');
  if (error) return error;

  error = validateText(parts.part3?.name, 'part3 name');
  if (error) return error;
  for (let index = 0; index < (parts.part3?.chats || []).length; index += 1) {
    error =
      validateText(parts.part3.chats[index]?.speaker, `part3 speaker ${index + 1}`) ||
      validateText(parts.part3.chats[index]?.question, `part3 question ${index + 1}`);
    if (error) return error;
  }

  error =
    validateText(parts.part4?.name, 'part4 name') ||
    validateText(parts.part4?.subContent, 'part4 subContent') ||
    validateText(parts.part4?.q1, 'part4 question 1') ||
    validateText(parts.part4?.q2, 'part4 question 2');
  if (error) return error;

  return null;
}

function validateListeningPayload({ SectionName, parts }) {
  let error =
    validateText(SectionName, 'SectionName') ||
    (!parts || typeof parts !== 'object' ? 'parts are required' : null);

  if (error) return error;

  for (const [partKey, part] of Object.entries(parts)) {
    error = validateText(part?.name, `${partKey} name`);
    if (error) return error;

    const questions = Array.isArray(part?.questions) ? part.questions : [];

    for (let qIndex = 0; qIndex < questions.length; qIndex += 1) {
      const question = questions[qIndex];
      error = validateText(question?.Content, `${partKey} question ${qIndex + 1}`);
      if (error) return error;

      const options = question?.AnswerContent?.options || [];
      for (let optIndex = 0; optIndex < options.length; optIndex += 1) {
        const optionValue =
          typeof options[optIndex] === 'string'
            ? options[optIndex]
            : options[optIndex]?.value;
        error = validateText(
          optionValue,
          `${partKey} question ${qIndex + 1} option ${optIndex + 1}`
        );
        if (error) return error;
      }

      const leftItems = question?.AnswerContent?.leftItems || [];
      for (let leftIndex = 0; leftIndex < leftItems.length; leftIndex += 1) {
        error = validateText(
          leftItems[leftIndex],
          `${partKey} question ${qIndex + 1} left item ${leftIndex + 1}`
        );
        if (error) return error;
      }

      const rightItems = question?.AnswerContent?.rightItems || [];
      for (let rightIndex = 0; rightIndex < rightItems.length; rightIndex += 1) {
        error = validateText(
          rightItems[rightIndex],
          `${partKey} question ${qIndex + 1} right item ${rightIndex + 1}`
        );
        if (error) return error;
      }

      const listContent =
        question?.AnswerContent?.groupContent?.listContent || [];
      for (let subIndex = 0; subIndex < listContent.length; subIndex += 1) {
        const subQuestion = listContent[subIndex];
        error = validateText(
          subQuestion?.content,
          `${partKey} question ${qIndex + 1} sub-question ${subIndex + 1}`
        );
        if (error) return error;

        for (let optIndex = 0; optIndex < (subQuestion?.options || []).length; optIndex += 1) {
          error = validateText(
            subQuestion.options[optIndex],
            `${partKey} question ${qIndex + 1} sub-question ${subIndex + 1} option ${optIndex + 1}`
          );
          if (error) return error;
        }
      }
    }
  }

  return null;
}

module.exports = {
  MAX_QUESTION_BANK_TEXT_LENGTH,
  QUESTION_BANK_TEXT_REGEX,
  validateSpeakingPayload,
  validateWritingPayload,
  validateListeningPayload,
};
