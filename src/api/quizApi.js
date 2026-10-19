import api from "./axios";

function mapQuizOption(option) {
  return {
    id: String(option?.id ?? ""),
    text: option?.text || "",
    isCorrect: Boolean(option?.isCorrect),
  };
}

function mapQuizQuestion(question) {
  return {
    id: String(question?.id ?? ""),
    question: question?.question || "",
    quizId: question?.quizId ?? null,
    options: Array.isArray(question?.options) ? question.options.map(mapQuizOption) : [],
  };
}

export function mapQuizItem(quiz) {
  return {
    id: String(quiz?.id ?? ""),
    title: quiz?.title || "Untitled Quiz",
    type: quiz?.type || "Quiz",
    duration: quiz?.duration ?? 0,
    from: quiz?.from || null,
    to: quiz?.to || null,
    questions: Array.isArray(quiz?.questions) ? quiz.questions.map(mapQuizQuestion) : [],
    raw: quiz || null,
  };
}

function extractQuizItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (payload?.data && typeof payload.data === "object") {
    return [payload.data];
  }

  if (payload && typeof payload === "object") {
    return [payload];
  }

  return [];
}

export async function getQuizzes() {
  const response = await api.get("/quiz/");
  const items = extractQuizItems(response?.data);

  return items.map(mapQuizItem);
}

export async function getQuizById(quizId) {
  if (quizId === null || quizId === undefined || quizId === "") {
    throw new Error("Quiz id is required.");
  }

  const response = await api.get(`/quiz/user/${quizId}`);
  const quiz = response?.data?.data || response?.data || null;

  return quiz ? mapQuizItem(quiz) : null;
}

export async function submitQuiz(payload) {
  const response = await api.post("/quiz/submit-quiz", payload);
  return response?.data?.data || null;
}
