// Survey rules as plain functions (no React), so they're easy to unit test.

/**
 * Toggle an option in a multi-select answer.
 * If `exclusive` is set (e.g. "none"), picking it clears everything else,
 * and picking anything else clears it.
 */
export function toggleMulti(selected = [], option, exclusive) {
  if (selected.includes(option)) {
    return selected.filter((o) => o !== option);
  }
  if (option === exclusive) {
    return [option];
  }
  return [...selected.filter((o) => o !== exclusive), option];
}

/** Has this question been fully answered? (Controls whether "Next" is enabled.) */
export function isAnswered(question, answer) {
  switch (question.type) {
    case 'single':
      return typeof answer === 'string' && question.options.includes(answer);
    case 'multi':
      return Array.isArray(answer) && answer.length > 0;
    case 'yesno':
      return question.items.every((item) => answer?.[item] === 'yes' || answer?.[item] === 'no');
    default:
      return false;
  }
}

/** True if ANY safety answer is "yes", meaning we should suggest seeing a doctor. */
export function needsDoctorCheck(answers) {
  return Object.values(answers?.safety ?? {}).includes('yes');
}

/** Index of the first unanswered question, or -1 if all are answered. */
export function firstUnansweredIndex(questions, answers) {
  return questions.findIndex((q) => !isAnswered(q, answers?.[q.id]));
}
