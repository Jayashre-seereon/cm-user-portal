import { useEffect, useMemo, useState } from "react";
import {
  FileTextOutlined,
  TeamOutlined,
  LinkOutlined,
  RiseOutlined,
  MedicineBoxOutlined,
  CodeOutlined,
  BankOutlined,
  BulbOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
   LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { Alert } from "antd";
import { ModuleScreen, PageHero } from "../../../components/ui";
import { quizCatalog as fallbackQuizCatalog, sampleQuizQuestions } from "../../../data/careermapData";
import { getQuizzes, submitQuiz } from "../../../api/quizApi";
import {
  UnlockRedirectModal,
  usePortalNavigation,
} from "../../portal/components/portalPageShared";
import { useAppState } from "../../../state/AppStateContext";
const QUIZ_ICONS = [
  <FileTextOutlined key="file" />,
  <MedicineBoxOutlined key="medicine" />,
  <BankOutlined key="bank" />,
  <CodeOutlined key="code" />,
  <TeamOutlined key="team" />,
  <RiseOutlined key="rise" />,
  <LinkOutlined key="link" />,
  <BulbOutlined key="bulb" />,
];
const QUIZ_ORDER = [
  "science",
  "commerce",
  "arts and humanities",
  "neutral",
  "competitive",
  "vocational",
];
const SCORE_MESSAGES = [
  "Keep practicing and you will get there.",
  "You are building momentum.",
  "Not bad, almost there.",
  "Great work, you are on track.",
  "Perfect score, outstanding.",
];
function normalizeQuizTitle(title) {
  return String(title || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");
}

function sortQuizzes(quizzes) {
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
function mapFallbackQuestions(quizIndex = 0) {
  return sampleQuizQuestions.map((question, index) => ({
    id: `fallback-${quizIndex}-${index}`,
    question: question.q,
    quizId: `fallback-${quizIndex}`,
    options: question.options.map((option, optionIndex) => ({
      id: `fallback-${quizIndex}-${index}-${optionIndex}`,
      text: option,
    })),
  }));
}

function buildFallbackQuizzes() {
  return fallbackQuizCatalog.map((quiz, index) => ({
    id: `fallback-${index}`,
    title: quiz.title,
    type: "Quiz",
    duration: quiz.questions || sampleQuizQuestions.length,
    from: null,
    to: null,
    questions: mapFallbackQuestions(index),
    raw: quiz,
  }));
}

function getQuestionText(question) {
  return question?.question || question?.q || "";
}

function getOptionText(option) {
  return option?.text || option || "";
}

function normalizeQuizQuestions(quiz) {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];

  if (!questions.length) {
    return [];
  }

  return questions.map((question, index) => ({
    id: String(question?.id ?? `${quiz?.id || "quiz"}-${index}`),
    question: getQuestionText(question),
    quizId: question?.quizId ?? quiz?.id ?? null,
    options: Array.isArray(question?.options)
      ? question.options.map((option, optionIndex) => ({
          id: String(option?.id ?? `${quiz?.id || "quiz"}-${index}-${optionIndex}`),
          text: getOptionText(option),
          isCorrect: Boolean(option?.isCorrect),
        }))
      : [],
  }));
}

function getQuizQuestions(quiz) {
  const normalized = normalizeQuizQuestions(quiz);

  if (normalized.length) {
    return normalized;
  }

  return mapFallbackQuestions(Number(quiz?.id || 0));
}

function getQuizTitle(quiz) {
  return quiz?.title || "Quiz";
}

function getQuizMeta(quiz) {
  const questions = getQuizQuestions(quiz);
  return {
    title: getQuizTitle(quiz),
    questions,
    count: questions.length || quiz?.questions?.length || sampleQuizQuestions.length,
  };
}

export default function QuizPage() {
 const { navigate, location } = usePortalNavigation();
const { isUnlocked } = useAppState();

const accessStatus = location.state?.accessStatus || "preview";
const unlocked =
  accessStatus === "full" || isUnlocked("quiz");
  const [unlockModalItem, setUnlockModalItem] = useState(null);
 const [quizzes, setQuizzes] = useState(
  sortQuizzes(buildFallbackQuizzes())
); const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadQuizzes() {
      try {
        setLoading(true);
        setLoadError("");
        const items = await getQuizzes();

       if (active) {
  setQuizzes(
    sortQuizzes(items.length ? items : buildFallbackQuizzes())
  );
}
      } catch (error) {
        if (active) {
          setLoadError(error?.response?.data?.message || error?.message || "Failed to load quizzes.");
        setQuizzes(sortQuizzes(buildFallbackQuizzes()));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadQuizzes();
    return () => {
      active = false;
    };
  }, []);

  const activeQuiz = useMemo(() => quizzes.find((quiz) => String(quiz.id) === String(activeQuizId)) || null, [activeQuizId, quizzes]);
  const quizMeta = useMemo(() => (activeQuiz ? getQuizMeta(activeQuiz) : null), [activeQuiz]);
  const questions = quizMeta?.questions || [];
  const totalQ = questions.length || sampleQuizQuestions.length;
  const score = answers.filter((answer, index) => {
    const selected = answer;
    const correctOption = questions[index]?.options?.find((option) => option.isCorrect);
    return Boolean(correctOption && selected && String(selected) === String(correctOption.id));
  }).length;

  useEffect(() => {
    if (!activeQuiz) {
      return;
    }

    setCurrent(0);
    setAnswers(Array(getQuizMeta(activeQuiz).questions.length).fill(null));
    setCompleted(false);
    setResult(null);
  }, [activeQuiz]);

  const resetQuiz = () => {
    setActiveQuizId(null);
    setCurrent(0);
    setAnswers([]);
    setCompleted(false);
    setResult(null);
    setSubmitting(false);
  };

  const startQuiz = (quiz) => {
    setActiveQuizId(quiz.id);
  };

  const handleFinish = async () => {
    const payloadAnswers = questions.map((question, index) => ({
      questionId: Number(question.id) || question.id,
      selectedOption: answers[index],
    }));

    setSubmitting(true);

    try {
      const response = await submitQuiz({
        quizId: activeQuiz?.id,
        answers: payloadAnswers,
      });

      setResult(response || { score: `${score}/${totalQ}`, total: totalQ, correct: score, wrong: totalQ - score });
    } catch (error) {
      setResult({
        score: `${score}/${totalQ}`,
        total: totalQ,
        correct: score,
        wrong: totalQ - score,
        message: error?.response?.data?.message || error?.message || "Quiz submitted locally.",
      });
    } finally {
      setSubmitting(false);
      setCompleted(true);
    }
  };

  if (completed) {
    const finalScore = result?.score || `${score}/${totalQ}`;
    const correct = result?.correct ?? score;
    const wrong = result?.wrong ?? Math.max(totalQ - score, 0);

    return (
      <ModuleScreen maxWidthClass="max-w-sm" className="space-y-6">
        <PageHero backOnly onBack={resetQuiz} />

        <div className="px-4 py-12 text-center">
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
            style={{ background: "#fdf0ef", color: "#9a2119" }}
          >
            <CheckCircleOutlined />
          </div>

          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9a2119" }}>
            Quiz complete
          </p>

          <p className="mb-2 text-5xl font-bold tracking-tight text-gray-900">
            {finalScore}
          </p>

          <p className="mb-2 text-sm text-gray-400">{SCORE_MESSAGES[Math.min(correct, SCORE_MESSAGES.length - 1)]}</p>
          <p className="mb-8 text-xs text-gray-400">
            Correct: {correct} | Wrong: {wrong}
          </p>

          <button
            onClick={resetQuiz}
            className="w-full max-w-[280px] rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85"
            style={{ background: "#9a2119" }}
          >
            Try another quiz
          </button>
        </div>
      </ModuleScreen>
    );
  }

  if (activeQuiz) {
    const question = questions[current];
    const progress = questions.length ? ((current + 1) / questions.length) * 100 : 0;
    const isLast = current === questions.length - 1;

    return (
      <ModuleScreen maxWidthClass="max-w-3xl" className="space-y-5">
        <div className="flex items-center justify-between">
          <PageHero backOnly onBack={resetQuiz} />
          <span className="text-xs font-semibold text-[#b8837e]">
            {current + 1} / {questions.length}
          </span>
        </div>

        <div className="h-[3px] overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "#9a2119" }}
          />
        </div>

        <div className="rounded-[24px] border border-[#f0e4e2] bg-white p-5 shadow-sm md:p-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#9a2119]">
            {quizMeta?.title || "Quiz"}
          </p>

          <h2 className="mb-6 text-xl font-black leading-snug text-[#1a0a09] md:text-2xl">
            {question?.question || "Question not available."}
          </h2>

          <div className="mb-6 flex flex-col gap-3">
            {(question?.options || []).map((option, index) => {
              const selected = String(answers[current] || "") === String(option.id);

              return (
                <button
                  key={option.id || `${question?.id}-${index}`}
                  onClick={() => {
                    const next = [...answers];
                    next[current] = option.id;
                    setAnswers(next);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm transition-all"
                  style={{
                    border: `1.5px solid ${selected ? "#9a2119" : "#ede8e5"}`,
                    background: selected ? "#fdf0ef" : "#fff",
                    color: selected ? "#9a2119" : "#1a1512",
                    fontWeight: selected ? 600 : 400,
                  }}
                >
                  <span
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-[11px] font-bold"
                    style={{
                      background: selected ? "#9a2119" : "#f3eeec",
                      color: selected ? "#fff" : "#7a6e68",
                    }}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option.text}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (isLast) {
                handleFinish();
              } else {
                setCurrent((value) => value + 1);
              }
            }}
            disabled={answers[current] === null || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
            style={{ background: "#9a2119" }}
          >
            {submitting ? (
              <>
                <LoadingOutlined />
                Submitting
              </>
            ) : (
              <>
                {isLast ? "Finish quiz" : "Next question"}
                <ArrowRightOutlined />
              </>
            )}
          </button>
        </div>
      </ModuleScreen>
    );
  }

  return (
    <ModuleScreen className="space-y-5">
      {loadError ? <Alert type="warning" message={loadError} showIcon style={{ borderRadius: 16 }} /> : null}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-black tracking-tight text-[#1a0a09]">Choose your quiz</h1>
          <p className="mt-1 mb-0 text-xs text-[#b8837e]">Quizzes Not Available</p>
        </div>
        <PageHero backOnly onBack={() => navigate(-1)} className="shrink-0" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <div className="col-span-full rounded-[24px] border border-[#f0e4e2] bg-white p-5 text-sm text-muted">
            Loading quizzes...
          </div>
        ) : null}

  {quizzes.map((quiz, index) => {
  const meta = getQuizMeta(quiz);

  const isPreviewMode = accessStatus === "preview";
  const isFree = !isPreviewMode || index < 4;

  return (
            <div
              key={quiz.id || quiz.title}
              className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#fff",
                border: "1.5px solid #e8dcd9",
                boxShadow: "none",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.borderColor = "#9a2119";
                event.currentTarget.style.boxShadow = "0 6px 24px rgba(154,33,25,0.10)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.borderColor = "#e8dcd9";
                event.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                className="absolute left-0 right-0 top-0 h-[3px]"
                style={{ background: "#9a2119", borderRadius: "16px 16px 0 0" }}
              />

              <div
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-5 transition-all duration-300 group-hover:scale-110 group-hover:opacity-10"
                style={{ background: "#9a2119" }}
              />

              <div
                className="relative mb-5 flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{ background: "#fdf0ef", color: "#9a2119" }}
              >
                {QUIZ_ICONS[index % QUIZ_ICONS.length]}
              </div>

              <p className="relative mb-1.5 text-[15px] font-bold tracking-tight" style={{ color: "#1a1512" }}>
                {meta.title}
              </p>
              <p className="relative mb-5 text-[13px] leading-relaxed" style={{ color: "#6b6560" }}>
                {quiz.type || "Quiz"}
              </p>
{!unlocked ? (
  <div
    className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full ${
      isFree ? "bg-green-50" : "bg-red-50"
    }`}
  >
    {isFree ? (
      <UnlockOutlined className="text-green-600" />
    ) : (
      <LockOutlined className="text-red-500" />
    )}
  </div>
) : null}
              <div className="relative flex items-center justify-between border-t border-[#f0e4e2] pt-3">
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide"
                  style={{
                    background: "#fdf0ef",
                    color: "#9a2119",
                    border: "1px solid #f5cdc9",
                  }}
                >
                  {meta.count} questions
                </span>

                <button
  onClick={() => {
    if (!isFree) {
      setUnlockModalItem(meta.title);
      return;
    }

    startQuiz(quiz);
  }}
  className="flex items-center gap-1 text-sm font-bold text-[#9a2119] transition-colors hover:text-[#7a1a13]"
>
  {isFree ? "Explore" : "Locked"}
  <ArrowRightOutlined />
</button>
              </div>
            </div>
          );
        })}
      </div>
      <UnlockRedirectModal
  open={Boolean(unlockModalItem)}
  title="Unlock Quiz"
  itemLabel={unlockModalItem}
  description="Your free quiz access has already been used. Subscribe to unlock"
  onCancel={() => setUnlockModalItem(null)}
  onConfirm={() => {
    setUnlockModalItem(null);
    navigate(
      `/app/subscription?returnTo=${encodeURIComponent(location.pathname)}`
    );
  }}
/>
    </ModuleScreen>
  );
}
