import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  HistoryOutlined,
  LoadingOutlined,
  LockOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { Button, Card, Empty, Modal, Progress, Spin, Tag, Tooltip, message } from "antd";
import {
  getAssessmentAccessStatus,
  getMyAttempts,
  getPublishedAssessments,
  startAssessmentAttempt,
} from "../../../api/psychometricAssessmentApi";
import { useAuthStore } from "../../../store/authStore";
import {
  ASSESSMENT_DOMAINS,
  ESTIMATED_DURATION_MINS,
  TOTAL_ASSESSMENT_QUESTIONS,
} from "../data/assessmentConstants";

export default function AssessmentLandingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [accessStatus, setAccessStatus] = useState(null);
  const [publishedAssessments, setPublishedAssessments] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [latestCompletedAttempt, setLatestCompletedAttempt] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [accessRes, assessmentsRes, attemptsRes] = await Promise.allSettled([
        getAssessmentAccessStatus(),
        getPublishedAssessments(),
        getMyAttempts(),
      ]);

      if (accessRes.status === "fulfilled" && accessRes.value) {
        setAccessStatus(accessRes.value);
      } else {
        setAccessStatus(null);
      }

      const assessments =
        assessmentsRes.status === "fulfilled" && Array.isArray(assessmentsRes.value)
          ? assessmentsRes.value
          : [];
      setPublishedAssessments(assessments);

      const attempts =
        attemptsRes.status === "fulfilled" && Array.isArray(attemptsRes.value)
          ? attemptsRes.value
          : [];
      setMyAttempts(attempts);

      // Find in-progress attempt if any
      const inProgress = attempts.find(
        (a) => a.status === "in_progress" || a.status === "IN_PROGRESS" || a.isCompleted === false
      );
      setActiveAttempt(inProgress || null);

      // Find latest completed attempt
      const completed = attempts.filter(
        (a) => a.status === "completed" || a.status === "COMPLETED" || a.isCompleted === true || a.report
      );
      if (completed.length > 0) {
        setLatestCompletedAttempt(completed[0]);
      }
    } catch (err) {
      console.error("Error loading assessment landing data:", err);
    } finally {
      setLoading(false);
    }
  }

  function showPlanRequiredModal(customMessage) {
    Modal.confirm({
      title: (
        <div className="flex items-center gap-2 text-base font-bold text-slate-900">
          <LockOutlined className="text-[#8C1814]" />
          <span>Assessment Plan Required</span>
        </div>
      ),
      content: (
        <div className="py-2 text-sm text-slate-700 leading-relaxed space-y-2">
          <p>
            {customMessage ||
              "You have already completed your Psychometric Assessment and generated your 31-page Career Compass Report under your current plan. To retake the assessment and track your new score, please subscribe to an assessment plan."}
          </p>
          <p className="text-xs text-slate-500 font-medium">
            Each subscription plan unlocks a fresh comprehensive evaluation and an updated Career Compass Report.
          </p>
        </div>
      ),
      okText: "View Plans & Pricing",
      cancelText: "Cancel",
      okButtonProps: {
        className: "!bg-[#8C1814] hover:!bg-[#72120F] !border-none !rounded-xl !font-bold !h-10 !px-5",
      },
      cancelButtonProps: {
        className: "!rounded-xl !h-10",
      },
      onOk: () => navigate("/app/subscription"),
    });
  }

  async function handleStartAssessment(forceNew = false) {
    // If in-progress test exists and not forcing new: resume directly
    if (activeAttempt && !forceNew) {
      const attemptId = activeAttempt.id || activeAttempt.attemptId || activeAttempt._id;
      navigate(`/app/assessment/attempt/${attemptId}`);
      return;
    }

    // If accessStatus specifically marks user as blocked:
    if (accessStatus && accessStatus.allowed === false) {
      if (accessStatus.reason === "ALREADY_COMPLETED") {
        showPlanRequiredModal(
          accessStatus.message ||
            "You have already completed your assessment under your current plan. Please subscribe to a new assessment plan to retake the test."
        );
      } else {
        showPlanRequiredModal(
          accessStatus.message || "Assessment is locked. Please purchase an assessment plan to unlock access."
        );
      }
      return;
    }

    try {
      setStarting(true);
      const defaultAssessment = publishedAssessments[0] || {};
      const assessmentId =
        defaultAssessment.id || defaultAssessment._id || defaultAssessment.assessmentId || "default";

      const res = await startAssessmentAttempt(assessmentId);
      const attemptId =
        res?.attemptId || res?.id || res?.data?.attemptId || res?.data?.id || `att_${Date.now()}`;

      message.success("Assessment initialized! Best of luck.");
      navigate(`/app/assessment/attempt/${attemptId}`);
    } catch (error) {
      console.error("Start assessment error:", error);
      const data = error.response?.data;
      if (
        data?.requiresNewPlan ||
        error.response?.status === 403 ||
        data?.reason === "ALREADY_COMPLETED" ||
        data?.reason === "NO_ACTIVE_PLAN"
      ) {
        showPlanRequiredModal(
          data?.message || "Please purchase an assessment plan to take or retake the assessment."
        );
        loadData();
      } else {
        message.error(data?.message || error?.message || "Could not start assessment. Please try again.");
      }
    } finally {
      setStarting(false);
    }
  }

  function handleRetakeClick() {
    if (accessStatus && accessStatus.allowed === false) {
      showPlanRequiredModal(
        accessStatus.reason === "ALREADY_COMPLETED"
          ? "You have already completed your Psychometric Assessment and generated your 31-page Career Compass Report. To retake the assessment and track your new score, please subscribe to an assessment plan."
          : (accessStatus.message || "Please purchase a plan to retake the assessment.")
      );
      return;
    }

    Modal.confirm({
      title: "Start a Fresh Assessment Attempt?",
      content:
        "Starting a new attempt will begin a fresh assessment session. Your past reports will remain preserved in your history.",
      okText: "Yes, Start Fresh Test",
      cancelText: "Cancel",
      okButtonProps: {
        className: "!bg-[#8C1814] hover:!bg-[#72120F] !border-none !rounded-xl !font-bold",
      },
      cancelButtonProps: {
        className: "!rounded-xl",
      },
      onOk: () => handleStartAssessment(true),
    });
  }

  // Determine current access and completion state
  const isAllowed = accessStatus
    ? accessStatus.allowed === true
    : !latestCompletedAttempt || !!activeAttempt;

  const isAlreadyCompleted = accessStatus
    ? accessStatus.allowed === false &&
      (accessStatus.reason === "ALREADY_COMPLETED" || !!accessStatus.completedAttemptId)
    : Boolean(latestCompletedAttempt) && !activeAttempt;

  const isNoActivePlan = accessStatus
    ? accessStatus.allowed === false && accessStatus.reason === "NO_ACTIVE_PLAN"
    : false;

  const completedAttemptId =
    accessStatus?.completedAttemptId ||
    latestCompletedAttempt?.id ||
    latestCompletedAttempt?.attemptId ||
    latestCompletedAttempt?._id ||
    "latest";

  const formattedCompletedDate =
    accessStatus?.completedAt || latestCompletedAttempt?.completedAt
      ? new Date(
          accessStatus?.completedAt || latestCompletedAttempt?.completedAt
        ).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "Recently";

  return (
    <div className="min-h-screen pb-16 pt-4 text-slate-800 antialiased">
      {/* Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Hero Section */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-[#801812] via-[#9a2119] to-[#b32b21] p-8 text-white shadow-xl md:p-12">
          {/* Subtle Background Pattern */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-white/5 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-amber-400/10 blur-2xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold tracking-wide uppercase text-amber-200 backdrop-blur-md">
                <SafetyCertificateOutlined /> 7-Domain Evaluation • 1-Plan = 1-Attempt
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
                Psychometric Career Assessment
              </h1>
              <p className="mt-4 max-w-2xl text-base font-normal leading-relaxed text-rose-100 sm:text-lg">
                Discover your personal profiling & career readiness, interests, personality strengths, learning style, work values, and cognitive aptitudes to unlock your top 5 best-fit career pathways in a 32-page Career Compass Report.
              </p>

              {/* Key Meta Badges */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold sm:text-sm">
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-sm">
                  <FileTextOutlined className="text-amber-300" />
                  <span>{TOTAL_ASSESSMENT_QUESTIONS} Questions</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-sm">
                  <ClockCircleOutlined className="text-amber-300" />
                  <span>~{ESTIMATED_DURATION_MINS} Minutes</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-sm">
                  <TrophyOutlined className="text-amber-300" />
                  <span>7 Domains & 18 Clusters</span>
                </div>
              </div>
            </div>

            {/* Action Card / Dynamic 3-State Quick Status Box */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur-md shadow-lg">
                {loading ? (
                  <div className="py-8">
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 32, color: "#fff" }} spin />} />
                    <div className="mt-3 text-xs text-rose-200">Checking assessment access...</div>
                  </div>
                ) : activeAttempt ? (
                  /* STATE 1A: In-Progress Attempt Found */
                  <div>
                    <span className="inline-block rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-200">
                      <ClockCircleOutlined className="mr-1" /> In-Progress Test Found
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-white">Continue Your Assessment</h3>
                    <p className="mt-1 text-xs text-rose-100">
                      Your answers are auto-saved. Resume right where you left off.
                    </p>

                    <Button
                      type="primary"
                      size="large"
                      loading={starting}
                      onClick={() => handleStartAssessment(false)}
                      className="mt-4 h-11 w-full rounded-xl border-none bg-amber-400 text-sm font-bold text-slate-900 shadow-md hover:bg-amber-300"
                    >
                      ▶️ Resume Assessment
                    </Button>
                    <button
                      onClick={handleRetakeClick}
                      className="mt-3 text-xs text-rose-200 underline hover:text-white"
                    >
                      Or start a fresh attempt
                    </button>
                  </div>
                ) : isAlreadyCompleted ? (
                  /* STATE 2: Test Completed (Locked for Retake under 1-Plan = 1-Attempt Rule) */
                  <div>
                    <span className="inline-block rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-200">
                      <CheckCircleFilled className="mr-1" /> Assessment Completed
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      Career Compass Ready
                    </h3>
                    <p className="mt-1 text-xs text-rose-100">
                      Completed on: <span className="font-semibold text-white">{formattedCompletedDate}</span>
                    </p>
                    <div className="mt-5 flex flex-col gap-2.5">
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => navigate(`/app/assessment/attempt/${completedAttemptId}/result`)}
                        className="h-11 w-full rounded-xl border-none bg-emerald-400 font-extrabold text-slate-900 shadow-md hover:bg-emerald-300"
                      >
                        📄 View Career Compass Report
                      </Button>
                      <Button
                        ghost
                        size="middle"
                        onClick={handleRetakeClick}
                        className="h-10 w-full rounded-xl border-amber-300/60 text-amber-200 font-bold hover:border-amber-300 hover:bg-amber-400/10"
                      >
                        <LockOutlined /> Retake Test (Subscribe Plan)
                      </Button>
                    </div>
                  </div>
                ) : isNoActivePlan ? (
                  /* STATE 3: No Active Plan (Locked) */
                  <div>
                    <span className="inline-block rounded-full bg-rose-400/20 px-3 py-1 text-xs font-bold text-rose-200">
                      <LockOutlined className="mr-1" /> Assessment Locked
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-white">Assessment Plan Required</h3>
                    <p className="mt-1 text-xs text-rose-100">
                      {accessStatus?.message || "Subscribe to an assessment plan to unlock your evaluation and 31-page report."}
                    </p>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => navigate("/app/subscription")}
                      className="mt-5 h-12 w-full rounded-xl border-none bg-amber-400 text-base font-extrabold text-slate-900 shadow-lg hover:bg-amber-300"
                    >
                      🔒 Unlock Assessment (View Plans)
                    </Button>
                  </div>
                ) : (
                  /* STATE 1B: Allowed & Ready for New Attempt */
                  <div>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
                      🚀
                    </div>
                    <span className="inline-block rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-200">
                      <UnlockOutlined className="mr-1" /> {accessStatus?.planTitle || "Assessment Unlocked"}
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-white">Ready to Discover Your Future?</h3>
                    <p className="mt-1 text-xs text-rose-100">
                      Takes ~35-45 mins. Your answers auto-save at every step.
                    </p>
                    <Button
                      type="primary"
                      size="large"
                      loading={starting}
                      onClick={() => handleStartAssessment(false)}
                      className="mt-4 h-12 w-full rounded-xl border-none bg-amber-400 text-base font-bold text-slate-900 shadow-lg hover:bg-amber-300"
                    >
                      🚀 Start Assessment Now
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 7 Assessment Domains Grid */}
        <div className="mb-14">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#9a2119]">
                Structured Curriculum
              </span>
              <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
                The 7 Dimensions of the Career Compass
              </h2>
            </div>
            <span className="text-sm font-medium text-slate-700">
              Total: <strong className="text-slate-800">{TOTAL_ASSESSMENT_QUESTIONS} Questions</strong> across {ASSESSMENT_DOMAINS.length} Sections
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ASSESSMENT_DOMAINS.map((domain, index) => (
              <div
                key={domain.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{domain.icon}</span>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      Section {index + 1} / {ASSESSMENT_DOMAINS.length}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-[#9a2119]">
                    {domain.title}
                  </h3>
                 

                  <p className="mt-3 text-sm leading-relaxed text-slate-800">
                    {domain.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>{domain.questionCount} Questions</span>
                    <span className="capitalize">{domain.type === "mcq" ? "MCQ (Aptitude)" : "1-5 Likert Scale"}</span>
                    <span>~{domain.estimatedMinutes} mins</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Guidelines / Tips */}
        <div className="mb-14 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-amber-50/70 via-rose-50/40 to-slate-50 p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-900">💡 Important Guidelines for Best Results</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-sm text-slate-800">
            <div className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
              <div className="font-bold text-slate-900">1. Answer Honestly</div>
              <p className="mt-1 text-xs text-slate-800 leading-relaxed">
                There are no right or wrong answers in personality & interest sections. Choose what naturally reflects you.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
              <div className="font-bold text-slate-900">2. Auto-Saved Progress</div>
              <p className="mt-1 text-xs text-slate-800 leading-relaxed">
                Every response is automatically saved. You can safely pause and resume anytime.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
              <div className="font-bold text-slate-900">3. Aptitude Reasoning</div>
              <p className="mt-1 text-xs text-slate-800 leading-relaxed">
                Section 6 has 39 multiple choice questions. Keep scrap paper handy for calculations.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
              <div className="font-bold text-slate-900">4. 31-Page Report</div>
              <p className="mt-1 text-xs text-slate-800 leading-relaxed">
                Receive top career clusters, Holland Code, VARK style, and custom Indian educational pathways.
              </p>
            </div>
          </div>
        </div>

        {/* Past Attempts History Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#9a2119]">
                <HistoryOutlined className="text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">My Assessment History</h3>
                <p className="text-xs text-slate-700">Track and review past assessment results and career compass reports</p>
              </div>
            </div>

            {myAttempts.length > 0 && (
              isAllowed ? (
                <Button
                  onClick={handleRetakeClick}
                  type="primary"
                  className="rounded-xl bg-[#9a2119] hover:bg-[#801812] font-bold"
                >
                  Start New Attempt
                </Button>
              ) : (
                <Button
                  onClick={handleRetakeClick}
                  className="rounded-xl border-amber-500 text-amber-700 hover:bg-amber-50 font-bold"
                >
                  <LockOutlined /> Retake Test (Plan Required)
                </Button>
              )
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Spin />
              <div className="mt-3 text-xs text-slate-700">Loading your history...</div>
            </div>
          ) : myAttempts.length === 0 ? (
            <div className="py-10 text-center">
              <Empty
                description="No past assessment attempts yet. Start your evaluation to generate your Career Compass Report."
              />
              <Button
                type="primary"
                size="large"
                onClick={() => handleStartAssessment(false)}
                className="mt-4 rounded-xl bg-[#9a2119] px-6 font-bold hover:bg-[#801812]"
              >
                {isNoActivePlan ? "🔒 Unlock Assessment Plan" : "🚀 Start Your First Assessment"}
              </Button>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <th className="pb-3 pl-2">Attempt Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myAttempts.map((attempt, index) => {
                    const attemptId = attempt.id || attempt.attemptId || attempt._id || `att_${index}`;
                    const isDone =
                      attempt.status === "completed" || attempt.status === "COMPLETED" || attempt.isCompleted;
                    const dateStr = attempt.completedAt || attempt.createdAt || attempt.updatedAt;
                    const formattedDate = dateStr
                      ? new Date(dateStr).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : `Attempt #${index + 1}`;

                    return (
                      <tr key={attemptId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 pl-2 font-medium text-slate-800">{formattedDate}</td>
                        <td className="py-4">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <CheckCircleFilled /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                              <ClockCircleOutlined /> In Progress
                            </span>
                          )}
                        </td>
                        <td className="py-4 pr-2 text-right">
                          {isDone ? (
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => navigate(`/app/assessment/attempt/${attemptId}/result`)}
                              className="rounded-lg bg-[#9a2119] text-xs font-bold hover:bg-[#801812]"
                            >
                              View Report
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              onClick={() => navigate(`/app/assessment/attempt/${attemptId}`)}
                              className="rounded-lg border-amber-500 text-xs font-bold text-amber-600 hover:bg-amber-50"
                            >
                              Resume
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

