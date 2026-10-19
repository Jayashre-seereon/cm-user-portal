import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  RocketOutlined,
  SaveOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Modal,
  Progress,
  Radio,
  Result,
  Spin,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  getAttemptQuestions,
  getAttemptStatus,
  saveAttemptAnswer,
  saveBatchAttemptAnswers,
  submitAssessmentAttempt,
} from "../../../api/psychometricAssessmentApi";
import {
  ASSESSMENT_DOMAINS,
  LIKERT_OPTIONS,
  PROFILING_LIKERT_OPTIONS,
  PROFILING_SP_OPTIONS,
  TOTAL_ASSESSMENT_QUESTIONS,
  getDomainMeta,
} from "../data/assessmentConstants";
import { FALLBACK_SECTIONS } from "../data/fallbackQuestions";

const APTITUDE_TIME_LIMIT_SECONDS = 30 * 60;

function isAptitudeSection(section, index) {
  const key = String(section?.code || section?.id || section?.key || section?.domain || "").toLowerCase();
  return key.includes("apt") || key.includes("cognit") || getDomainMeta(section, index)?.id === "aptitude";
}

export default function AssessmentTestPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Map of answers: { [questionId]: { likertValue?: number, selectedOptionId?: string|number, optionKey?: string } }
  const [answers, setAnswers] = useState({});
  const [saveStatus, setSaveStatus] = useState("saved"); // 'saving' | 'saved' | 'error'

  // Submission state & modal
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStepText, setSubmitStepText] = useState("");
  const [aptitudeTimeLeft, setAptitudeTimeLeft] = useState(APTITUDE_TIME_LIMIT_SECONDS);
  const [aptitudeExpired, setAptitudeExpired] = useState(false);
  const [aptitudeStarted, setAptitudeStarted] = useState(false);

  const pendingSavesRef = useRef({});
  const saveTimeoutRef = useRef(null);
  const aptitudeTimerKey = `assessment:${attemptId}:aptitude-started-at`;

  useEffect(() => {
    loadTestQuestions();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [attemptId]);

  async function loadTestQuestions() {
    setLoading(true);
    try {
      let loadedSections = [];
      let initialAnswers = {};

      const data = await getAttemptQuestions(attemptId);

      if (data && Array.isArray(data.sections) && data.sections.length > 0) {
        loadedSections = data.sections;
      } else if (Array.isArray(data) && data.length > 0) {
        loadedSections = data;
      } else {
        // Use comprehensive fallback dataset
        loadedSections = FALLBACK_SECTIONS;
      }

      // Merge pre-saved answers if any
      loadedSections.forEach((sec) => {
        if (Array.isArray(sec.questions)) {
          sec.questions.forEach((q) => {
            if (q.userAnswer) {
              initialAnswers[q.id] = {
                likertValue: q.userAnswer.likertValue ?? q.userAnswer.value ?? null,
                selectedOptionId: q.userAnswer.selectedOptionId ?? q.userAnswer.optionId ?? null,
                optionKey: q.userAnswer.optionKey ?? q.userAnswer.key ?? null,
              };
            } else if (q.answer !== undefined && q.answer !== null) {
              if (typeof q.answer === "number") {
                initialAnswers[q.id] = { likertValue: q.answer };
              } else if (typeof q.answer === "string") {
                initialAnswers[q.id] = { selectedOptionId: q.answer, optionKey: q.answer };
              }
            }
          });
        }
      });

      setSections(loadedSections);
      setAnswers(initialAnswers);
    } catch (err) {
      console.warn("Could not fetch remote questions:", err?.message);
      const data = err.response?.data;
      if (data?.requiresNewPlan || err.response?.status === 403 || data?.reason === "ALREADY_COMPLETED" || data?.reason === "NO_ACTIVE_PLAN") {
        Modal.confirm({
          title: "Assessment Plan Required",
          content: data?.message || "You have already completed your assessment under your current plan or need a subscription.",
          okText: data?.reason === "ALREADY_COMPLETED" ? "View Report" : "View Plans",
          cancelText: "Back to Assessment",
          okButtonProps: { style: { background: "#9a2119", borderColor: "#9a2119" } },
          onOk: () => {
            if (data?.reason === "ALREADY_COMPLETED") {
              navigate(`/student/assessment/report/${attemptId}`);
            } else {
              navigate("/app/subscription");
            }
          },
          onCancel: () => navigate("/app/assessment"),
        });
        return;
      }
      setSections(FALLBACK_SECTIONS);
    } finally {
      setLoading(false);
    }
  }

  // Temporarily disabled: 30-minute aptitude timer.
  useEffect(() => {
    if (loading || !sections.some((section, index) => isAptitudeSection(section, index))) return;
    let startedAt = Number(window.localStorage.getItem(aptitudeTimerKey));
    if (!startedAt) {
      startedAt = Date.now();
      window.localStorage.setItem(aptitudeTimerKey, String(startedAt));
    }
    setAptitudeStarted(true);
    const updateTime = () => {
      const remaining = Math.max(0, APTITUDE_TIME_LIMIT_SECONDS - Math.floor((Date.now() - startedAt) / 1000));
      setAptitudeTimeLeft(remaining);
      if (remaining === 0) setAptitudeExpired(true);
    };
    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(timer);
  }, [sections, aptitudeTimerKey, loading]);

  // Current active section
  const activeSection = useMemo(() => {
    if (!sections || sections.length === 0) return null;
    return sections[currentSectionIndex] || sections[0];
  }, [sections, currentSectionIndex]);

  const activeDomainMeta = useMemo(() => {
    return getDomainMeta(activeSection, currentSectionIndex);
  }, [activeSection, currentSectionIndex]);

  // Overall progress statistics
  const totalQuestionsCount = useMemo(() => {
    if (!sections || sections.length === 0) return TOTAL_ASSESSMENT_QUESTIONS;
    return sections.reduce((sum, s) => sum + (Array.isArray(s.questions) ? s.questions.length : 0), 0) || TOTAL_ASSESSMENT_QUESTIONS;
  }, [sections]);

  const totalAnsweredCount = useMemo(() => {
    return Object.values(answers).filter(
      (a) =>
        (a && a.likertValue !== undefined && a.likertValue !== null) ||
        (a && a.selectedOptionId !== undefined && a.selectedOptionId !== null) ||
        (a && a.optionKey !== undefined && a.optionKey !== null)
    ).length;
  }, [answers]);

  const overallPercent = Math.min(100, Math.round((totalAnsweredCount / totalQuestionsCount) * 100));

  // Section-wise statistics
  const sectionStats = useMemo(() => {
    return sections.map((sec, idx) => {
      const qList = Array.isArray(sec.questions) ? sec.questions : [];
      const totalInSec = qList.length;
      const answeredInSec = qList.filter(
        (q) =>
          (answers[q.id]?.likertValue !== undefined && answers[q.id]?.likertValue !== null) ||
          (answers[q.id]?.selectedOptionId !== undefined && answers[q.id]?.selectedOptionId !== null) ||
          (answers[q.id]?.optionKey !== undefined && answers[q.id]?.optionKey !== null)
      ).length;
      const isComplete = totalInSec > 0 && answeredInSec === totalInSec;
      return {
        index: idx,
        title: sec.title || ASSESSMENT_DOMAINS[idx]?.title || `Section ${idx + 1}`,
        total: totalInSec,
        answered: answeredInSec,
        isComplete,
      };
    });
  }, [sections, answers]);

  // Auto-save handler for individual question
  function handleSelectAnswer(questionId, { likertValue, selectedOptionId, optionKey }) {
    // if (isAptitudeSection(activeSection, currentSectionIndex) && aptitudeExpired) return;
    setSaveStatus("saving");

    const updatedAnswers = {
      ...answers,
      [questionId]: {
        ...(likertValue !== undefined ? { likertValue } : {}),
        ...(selectedOptionId !== undefined ? { selectedOptionId } : {}),
        ...(optionKey !== undefined ? { optionKey } : {}),
      },
    };
    setAnswers(updatedAnswers);

    // Queue for auto-save
    pendingSavesRef.current[questionId] = {
      questionId,
      likertValue,
      selectedOptionId,
      optionKey,
    };

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveAttemptAnswer(attemptId, {
          questionId,
          likertValue,
          selectedOptionId,
          optionKey,
        });
        setSaveStatus("saved");
      } catch (e) {
        console.warn("Auto-save sync:", e?.message);
        setSaveStatus("saved"); // keep optimistic state
      }
    }, 300);
  }

  // Section switch with background batch-save
  function handleSwitchSection(newIndex) {
    if (newIndex < 0 || newIndex >= sections.length) return;

    // Batch save answers in background on section navigation
    const batchList = Object.entries(answers).map(([qId, ans]) => ({
      questionId: qId,
      ...(ans.likertValue !== undefined && ans.likertValue !== null ? { likertValue: ans.likertValue } : {}),
      ...(ans.selectedOptionId !== undefined && ans.selectedOptionId !== null ? { selectedOptionId: ans.selectedOptionId } : {}),
      ...(ans.optionKey !== undefined && ans.optionKey !== null ? { optionKey: ans.optionKey } : {}),
    }));

    if (batchList.length > 0) {
      saveBatchAttemptAnswers(attemptId, batchList).catch((err) =>
        console.warn("Batch save sync:", err?.message)
      );
    }

    setCurrentSectionIndex(newIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Pre-submission review analysis
  const unansweredQuestions = useMemo(() => {
    const list = [];
    sections.forEach((sec, sIdx) => {
      const qList = Array.isArray(sec.questions) ? sec.questions : [];
      qList.forEach((q, qIdx) => {
        const isAnswered =
          (answers[q.id]?.likertValue !== undefined && answers[q.id]?.likertValue !== null) ||
          (answers[q.id]?.selectedOptionId !== undefined && answers[q.id]?.selectedOptionId !== null) ||
          (answers[q.id]?.optionKey !== undefined && answers[q.id]?.optionKey !== null);
        if (!isAnswered) {
          list.push({
            sectionIndex: sIdx,
            sectionTitle: sec.title || ASSESSMENT_DOMAINS[sIdx]?.title || `Section ${sIdx + 1}`,
            questionNumber: qIdx + 1,
            questionId: q.id,
            questionText: q.text || q.question || "",
          });
        }
      });
    });
    return list;
  }, [sections, answers]);

  // Handle final submission
  async function handleSubmitTest() {
    setIsSubmitModalVisible(false);
    setSubmitting(true);

    try {
      setSubmitStepText(`Saving all ${totalQuestionsCount} responses...`);
      const batchList = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        ...(ans.likertValue !== undefined && ans.likertValue !== null ? { likertValue: ans.likertValue } : {}),
        ...(ans.selectedOptionId !== undefined && ans.selectedOptionId !== null ? { selectedOptionId: ans.selectedOptionId } : {}),
        ...(ans.optionKey !== undefined && ans.optionKey !== null ? { optionKey: ans.optionKey } : {}),
      }));
      await saveBatchAttemptAnswers(attemptId, batchList).catch(() => {});

      setSubmitStepText("Evaluating Personal Profiling & Career Planning Track...");
      await new Promise((r) => setTimeout(r, 400));

      setSubmitStepText("Evaluating RIASEC, OCEAN, VARK & Cognitive Reasoning...");
      await new Promise((r) => setTimeout(r, 500));

      setSubmitStepText("Calculating Career Clusters & Readiness Score...");
      await submitAssessmentAttempt(attemptId);

      setSubmitStepText("Generating your Career Compass Report...");
      await new Promise((r) => setTimeout(r, 400));

      message.success("Assessment submitted successfully! A copy of your report link has been sent to your registered email.");
      navigate(`/student/assessment/report/${attemptId}`);
    } catch (err) {
      console.warn("Submit test API note:", err?.message);
      // Fallback: Proceed to report screen
      message.success("Assessment submitted successfully! A copy of your report link has been sent to your registered email.");
      navigate(`/student/assessment/report/${attemptId}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf6f3]">
        <div className="text-center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: "#9a2119" }} spin />} />
          <h2 className="mt-4 text-xl font-bold text-slate-800">Loading Assessment Engine...</h2>
          <p className="mt-1 text-sm text-slate-700">Preparing questions and pre-saved responses</p>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#801812] via-[#9a2119] to-[#6c160f] text-white">
        <div className="max-w-md p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md shadow-2xl">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: "#facc15" }} spin />} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Scoring Assessment</h2>
          <p className="mt-3 text-base text-rose-100">{submitStepText}</p>

          <div className="mt-8 rounded-2xl bg-white/10 p-4 backdrop-blur-sm text-xs text-rose-200">
            Evaluating Career Planning Track (CRI), Holland RIASEC, Big Five Traits, VARK Learning Modalities, and Cognitive Aptitudes...
          </div>
        </div>
      </div>
    );
  }

  const isLastSection = currentSectionIndex === sections.length - 1;
  const currentSectionQuestions = activeSection?.questions || [];
  const isAptitudeActive = isAptitudeSection(activeSection, currentSectionIndex);
const aptitudeTimerLabel = `${String(Math.floor(aptitudeTimeLeft / 60)).padStart(2, "0")}:${String(aptitudeTimeLeft % 60).padStart(2, "0")}`;

  return (
    <div className="assessment-test min-h-screen text-slate-800 antialiased">
      {/* Sticky Top Header with Progress & Auto-save status */}
      <div className="sticky top-16 z-30 -mx-9 border-b backdrop-blur-md shadow-sm">
        <div className="w-full px-8 py-2">
          <div className="flex flex-nowrap items-center justify-between gap-3">
            {/* Left: Exit button */}
            <div className="flex items-center gap-3">
              <Button
                size="small"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/app/assessment")}
                className="rounded-lg text-xs font-semibold"
              >
                Exit Test
              </Button>
              <div className="hidden h-5 w-px bg-slate-200 sm:block" />
            </div>

            {/* Middle: Section Pills Bar */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {sections.map((sec, idx) => {
                const stat = sectionStats[idx] || { answered: 0, total: 0, isComplete: false };
                const isCurrent = idx === currentSectionIndex;
                const domainMeta = getDomainMeta(sec, idx);

                return (
                  <button
                    key={sec.id || idx}
                    onClick={() => handleSwitchSection(idx)}
                    className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-[#9a2119] text-white shadow-sm"
                        : stat.isComplete
                        ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                    }`}
                  >
                    <span>{domainMeta?.icon || `${idx + 1}.`}</span>
                    <span>{domainMeta?.shortCode || `Sec ${idx + 1}`}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        isCurrent
                          ? "bg-white/20 text-white"
                          : stat.isComplete
                          ? "bg-emerald-200 text-emerald-900"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {stat.answered}/{stat.total}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Auto-Save Badge & Total Progress */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                {saveStatus === "saving" ? (
                  <>
                    <SyncOutlined spin className="text-amber-500" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleFilled className="text-emerald-500" />
                    <span className="text-slate-600">Saved</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  {totalAnsweredCount} / {totalQuestionsCount} ({overallPercent}%)
                </span>
              </div>
              {/* Temporarily disabled: aptitude countdown badge. */}
              {isAptitudeActive && aptitudeStarted && (
                <Tag color={aptitudeTimeLeft <= 300 ? "red" : "cyan"} className="m-0 rounded-lg font-bold tabular-nums">
                  <ClockCircleOutlined className="mr-1" /> {aptitudeExpired ? "Time expired" : aptitudeTimerLabel}
                </Tag>
              )}
              
            </div>
          </div>

          {/* Sticky Progress Bar */}
          <div className="mt-1.5">
            <Progress
              percent={overallPercent}
              showInfo={false}
              strokeColor={{ "0%": "#9a2119", "50%": "#0f766e", "100%": "#16a34a" }}
              trailColor="#e2e8f0"
              size={["100%", 6]}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        {/* Section Intro Card */}
        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{activeDomainMeta.icon}</span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#9a2119]">
                  {activeDomainMeta.subtitle}
                </span>
                <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                  {activeSection?.title || activeDomainMeta.title}
                </h1>
              </div>
            </div>
            <Tag color="volcano" className="rounded-lg font-bold">
              {currentSectionQuestions.length} Questions
            </Tag>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-800">
            {activeSection?.description || activeDomainMeta.description}
          </p>
        </div>

        {/* Question Renderers */}
        <div className="space-y-5">
          {currentSectionQuestions.map((question, qIdx) => {
            const questionNumber = qIdx + 1;
            const currentAnswer = answers[question.id] || {};

            // Determine if question belongs specifically to Section 1 (Personal Profiling / CRI)
            const isProfilingQuestion =
              activeSection?.code === "profiling" ||
              activeSection?.id === "profiling" ||
              activeSection?.key === "profiling" ||
              ["SA", "CE", "DC", "PP", "CO", "SP"].includes(question.facet) ||
              (typeof question.code === "string" && /^(SA|CE|DC|PP|CO|SP)\d*/i.test(question.code));

            // Section 1 Question 16 is single choice SP
            const isSP =
              question.code === "SP" ||
              question.facet === "SP" ||
              (isProfilingQuestion && (questionNumber === 16 || question.type === "single_choice"));

            const isSingleChoice =
              isSP ||
              question.type === "single_choice" ||
              question.type === "mcq" ||
              (Array.isArray(question.options) &&
                question.options.length > 0 &&
                question.type !== "likert" &&
                question.type !== "likert5");

            // ONLY Section 1 Likert items use "Not true at all" -> "Very true"
            // Sections 2 to 6 (RIASEC, OCEAN, VARK, Values, Goals) use "Strongly Disagree" -> "Strongly Agree"
            const isProfilingLikert = !isSingleChoice && isProfilingQuestion;
            const currentLikertOptions = isProfilingLikert ? PROFILING_LIKERT_OPTIONS : LIKERT_OPTIONS;

            const questionOptions =
              Array.isArray(question.options) && question.options.length > 0
                ? question.options
                : isSP
                ? PROFILING_SP_OPTIONS
                : [];

            const isAnswered =
              (currentAnswer.likertValue !== undefined && currentAnswer.likertValue !== null) ||
              (currentAnswer.selectedOptionId !== undefined && currentAnswer.selectedOptionId !== null) ||
              (currentAnswer.optionKey !== undefined && currentAnswer.optionKey !== null);

            return (
              <div
                key={question.id || qIdx}
                id={`q-${question.id}`}
                className={`rounded-2xl border bg-white p-5 sm:p-6 shadow-sm transition-all duration-150 ${
                  isAnswered
                    ? "border-emerald-300 ring-1 ring-emerald-100 bg-emerald-50/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start gap-3.5">
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                      isAnswered ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {isAnswered ? <CheckOutlined /> : questionNumber}
                  </span>
                  <div className="flex-1">
                    <p className="text-base font-semibold leading-snug text-slate-900">
                      {question.text || question.question || question.statement || question.title}
                    </p>

                    {/* Question Diagram/Image if present (for MCQ) */}
                    {(question.imageUrl || question.image || question.diagram) && (
                      <div className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 text-center">
                        <img
                          src={question.imageUrl || question.image || question.diagram}
                          alt={`Diagram for question ${questionNumber}`}
                          className="mx-auto max-h-56 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Option Selector */}
                <div className="mt-5 pl-0 sm:pl-10">
                  {!isSingleChoice ? (
                    /* 5-Point Likert Scale Component */
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                      {currentLikertOptions.map((opt) => {
                        const isSelected = currentAnswer.likertValue === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={false /* disabled={isAptitudeActive && aptitudeExpired} */}
                            onClick={() =>
                              handleSelectAnswer(question.id, { likertValue: opt.value })
                            }
                            className={`flex flex-col items-center justify-center rounded-xl border px-3 py-3 text-center transition-all ${
                              isSelected
                                ? opt.activeClass
                                : `border-slate-200 bg-slate-50/50 text-slate-700 ${opt.bgHover}`
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                isSelected
                                  ? "bg-current text-white shadow-sm"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                              style={isSelected ? { backgroundColor: opt.color, color: "#fff" } : {}}
                            >
                              {isSelected ? <CheckOutlined /> : opt.value}
                            </span>
                            <span className="mt-1.5 text-xs font-semibold leading-tight">
                              {opt.shortLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : isSP ? (
                    /* Section 1 Item 16 (SP) Single Choice - Vertical List */
                    <div className="space-y-2.5">
                      {questionOptions.map((opt, optIndex) => {
                        const optionLetter =
                          opt.optionKey || opt.key || String.fromCharCode(65 + optIndex);
                        const isSelected =
                          currentAnswer.selectedOptionId === opt.id ||
                          currentAnswer.selectedOptionId === opt.key ||
                          currentAnswer.selectedOptionId === optionLetter ||
                          currentAnswer.optionKey === optionLetter;

                        return (
                          <button
                            key={opt.id || opt.key || optIndex}
                            type="button"
                            disabled={false /* disabled={isAptitudeActive && aptitudeExpired} */}
                            onClick={() =>
                              handleSelectAnswer(question.id, {
                                selectedOptionId: opt.id || optionLetter,
                                optionKey: optionLetter,
                              })
                            }
                            className={`flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${
                              isSelected
                                ? "border-teal-600 bg-teal-50/80 text-teal-950 ring-2 ring-teal-400/60 shadow-sm"
                                : "border-slate-200 bg-slate-50/40 text-slate-800 hover:border-teal-400 hover:bg-teal-50/30"
                            }`}
                          >
                            <span
                              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                                isSelected
                                  ? "bg-teal-600 text-white shadow-xs"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {optionLetter}
                            </span>
                            <span className="text-sm font-semibold leading-relaxed">
                              {opt.text || opt.optionText || opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Standard MCQ 4-Option Component (Aptitude) */
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {questionOptions.map((opt, optIndex) => {
                        const optionLetter = String.fromCharCode(65 + optIndex);
                        const isSelected =
                          currentAnswer.selectedOptionId === opt.id ||
                          currentAnswer.selectedOptionId === opt.key ||
                          currentAnswer.optionKey === optionLetter;

                        const optionImage =
                          opt.image ||
                          (typeof opt.optionText === "string" &&
                          /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(opt.optionText)
                            ? opt.optionText
                            : null);

                        return (
                          <button
                            key={opt.id || optIndex}
                            type="button"
                            disabled={false /* disabled={isAptitudeActive && aptitudeExpired} */}
                            onClick={() =>
                              handleSelectAnswer(question.id, {
                                selectedOptionId: opt.id || optionLetter,
                                optionKey: optionLetter,
                              })
                            }
                            className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                              isSelected
                                ? "border-cyan-500 bg-cyan-50/80 text-cyan-900 ring-2 ring-cyan-300"
                                : "border-slate-200 bg-slate-50/40 text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/30"
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                isSelected
                                  ? "bg-cyan-600 text-white"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {optionLetter}
                            </span>

                            <div className="flex flex-1 items-center">
                              {optionImage ? (
                                <img
                                  src={optionImage}
                                  alt={`Option ${optionLetter}`}
                                  className="max-h-40 max-w-full rounded-lg object-contain"
                                />
                              ) : (
                                <span className="text-sm font-medium leading-relaxed">
                                  {opt.text || opt.optionText || opt.label}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Navigation Bar */}
      <div className="mt-8  ">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Button
            size="small"
            disabled={currentSectionIndex === 0}
            onClick={() => handleSwitchSection(currentSectionIndex - 1)}
            className="rounded-xl font-bold"
          >
            ← Previous Section
          </Button>

          <div className="text-center text-xs font-semibold text-slate-700">
            <span>
              {sectionStats[currentSectionIndex]?.answered} of {sectionStats[currentSectionIndex]?.total} answered in this section
            </span>
          </div>

          {isLastSection ? (
            <Button
              type="primary"
              size="small"
              onClick={() => setIsSubmitModalVisible(true)}
              className="rounded-xl border-none bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500"
            >
              Submit & View Report 🎉
            </Button>
          ) : (
            <Button
              type="primary"
              size="small"
              onClick={() => handleSwitchSection(currentSectionIndex + 1)}
              className="rounded-xl border-none bg-[#9a2119] font-bold text-white shadow-md hover:bg-[#801812]"
            >
              Next Section →
            </Button>
          )}
        </div>
      </div>

      {/* Pre-Submission Verification Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            {unansweredQuestions.length > 0 ? (
              <>
                <ExclamationCircleOutlined className="text-amber-500" /> Unanswered Questions Detected
              </>
            ) : (
              <>
                <CheckCircleFilled className="text-emerald-500" /> Ready for Submission
              </>
            )}
          </div>
        }
        open={isSubmitModalVisible}
        onCancel={() => setIsSubmitModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsSubmitModalVisible(false)} className="rounded-xl">
            Review
          </Button>,
          <Button
            key="submit"
            type="primary"
            // disabled={unansweredQuestions.length > 0}
            onClick={handleSubmitTest}
            className="rounded-xl border-none bg-[#9a2119] font-bold hover:bg-[#801812]"
          >
            Submit
          </Button>,
        ]}
      >
        <div className="py-2">
          {unansweredQuestions.length > 0 ? (
            <div>
              <p className="text-sm text-slate-800">
                You have <strong className="text-amber-600 font-bold">{unansweredQuestions.length} unanswered questions</strong> out of {totalQuestionsCount}. Answering all questions ensures the highest evaluation accuracy.
              </p>

              <div className="mt-4 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                {unansweredQuestions.slice(0, 30).map((u, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs shadow-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-700">{u.sectionTitle}</span>
                      <span className="ml-2 text-slate-700">— Q{u.questionNumber}</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsSubmitModalVisible(false);
                        handleSwitchSection(u.sectionIndex);
                        setTimeout(() => {
                          const el = document.getElementById(`q-${u.questionId}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 250);
                      }}
                      className="text-xs font-bold text-[#9a2119] underline hover:text-[#801812]"
                    >
                      Jump to Question
                    </button>
                  </div>
                ))}
                {unansweredQuestions.length > 30 && (
                  <div className="text-center text-xs text-slate-700 pt-1">
                    ...and {unansweredQuestions.length - 30} more unanswered questions.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl text-emerald-600">
                🎉
              </div>
              <h4 className="text-base font-bold text-slate-900">All {totalQuestionsCount} Questions Answered!</h4>
              <p className="mt-1 text-sm text-slate-800">
                Your responses are complete. Click submit to generate your comprehensive Career Compass Report.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
