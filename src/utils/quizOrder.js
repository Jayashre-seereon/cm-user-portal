// The order the Quiz page lists quizzes in. Shared with global search so both agree
// on which quizzes are "first" (the free preview items).
export const QUIZ_ORDER = [
  "science",
  "commerce",
  "arts and humanities",
  "neutral",
  "competitive",
  "vocational",
];

export function normalizeQuizTitle(title) {
  return String(title || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");
}

export function sortQuizzes(quizzes) {
  return [...quizzes].sort((a, b) => {
    const titleA = normalizeQuizTitle(a.title);
    const titleB = normalizeQuizTitle(b.title);

    const indexA = QUIZ_ORDER.indexOf(titleA);
    const indexB = QUIZ_ORDER.indexOf(titleB);

    // Known quizzes come first in the required order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // Any other quiz goes after the required quizzes
    return titleA.localeCompare(titleB);
  });
}
