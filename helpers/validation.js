function validateDropdownPart(part) {
  if (!Array.isArray(part.AnswerContent?.options)) {
    throw new Error(`Part "${part.PartName}" dropdown-list missing options[]`);
  }
  if (!Array.isArray(part.AnswerContent?.correctAnswer)) {
    throw new Error(`Part "${part.PartName}" missing correctAnswer[]`);
  }
}

function validateOrderingPart(part) {
  if (!Array.isArray(part.AnswerContent?.options)) {
    throw new Error(`Part "${part.PartName}" ordering missing options[]`);
  }
  if (!Array.isArray(part.AnswerContent?.correctAnswer)) {
    throw new Error(`Part "${part.PartName}" ordering missing correctAnswer[]`);
  }
}

function validateMatchingPart(part) {
  const ac = part.AnswerContent;
  if (!Array.isArray(ac?.leftItems)) {
    throw new Error(`Part "${part.PartName}" matching missing leftItems[]`);
  }
  if (!Array.isArray(ac?.rightItems)) {
    throw new Error(`Part "${part.PartName}" matching missing rightItems[]`);
  }
  if (!Array.isArray(ac?.correctAnswer)) {
    throw new Error(`Part "${part.PartName}" matching missing correctAnswer[]`);
  }
}
function validatePartStructure(part) {
  if (!part.PartName) throw new Error(`PartName is required`);
  if (!part.Type) throw new Error(`Part "${part.PartName}" missing Type`);
  if (!part.Sequence)
    throw new Error(`Part "${part.PartName}" missing Sequence`);
  if (!part.Content) throw new Error(`Part "${part.PartName}" missing Content`);
  if (!part.AnswerContent)
    throw new Error(`Part "${part.PartName}" missing AnswerContent`);

  switch (part.Type) {
    case 'dropdown-list':
      validateDropdownPart(part);
      break;
    case 'ordering':
      validateOrderingPart(part);
      break;
    case 'matching':
      validateMatchingPart(part);
      break;
    default:
      throw new Error(`Invalid Type "${part.Type}" for ${part.PartName}`);
  }
}

export { validatePartStructure };
