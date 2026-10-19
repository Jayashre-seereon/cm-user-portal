import React from "react";
import {
  CheckCircleFilled,
  CheckOutlined,
  ExclamationCircleFilled,
  InfoCircleOutlined,
  ThunderboltFilled,
  TrophyFilled,
  WarningFilled,
} from "@ant-design/icons";

/**
 * 5 Standard Planning Stages definition
 */
const DEFAULT_STAGES = [
  { stageNo: 1, stageCode: "LOW_AWARENESS", stageName: "Low awareness", description: "Limited awareness about career possibilities, personal strengths, or the factors that influence career choices." },
  { stageNo: 2, stageCode: "UNCERTAIN", stageName: "Uncertain", description: "Aware of the need to make a career decision but uncertain about available options, suitability, or the right direction." },
  { stageNo: 3, stageCode: "DISCOVERING", stageName: "Discovering", description: "Actively researching and evaluating different career pathways, courses, opportunities, and areas of interest." },
  { stageNo: 4, stageCode: "DECISIVE", stageName: "Decisive", description: "Developing a clear understanding of career preferences, suitable pathways, and the steps required to achieve the desired goal." },
  { stageNo: 5, stageCode: "CAREER_READINESS", stageName: "Career Readiness", description: "Well-prepared with a defined career direction, realistic goals, and a strategic action plan to confidently move forward." },
];

const DEFAULT_INTRO = "The Current Career stage analysis is the foundation of effective career planning. It provides a clear understanding of where you currently stand in your career decision-making journey and helps identify the direction you need to take. Through this, we assess your present level of career preparedness, identify the challenges or risks that may influence your career decisions, and determine the appropriate steps for your growth and development.\n\nThe objective is to establish a clear career goal and create a structured roadmap that gradually moves you from your current stage of career planning towards an optimized, informed, and future-ready stage.";

/**
 * Domain icons & accent colors for the 5 Areas
 */
const DOMAIN_CONFIG = {
  SA: { icon: "👤", color: "#0d9488", lightBg: "#f0fdfa", border: "#ccfbf1", defaultName: "About Me" },
  CE: { icon: "🔍", color: "#2563eb", lightBg: "#eff6ff", border: "#dbeafe", defaultName: "Knowing About Careers" },
  DC: { icon: "🎯", color: "#7c3aed", lightBg: "#f5f3ff", border: "#ede9fe", defaultName: "Making a Choice" },
  PP: { icon: "🗺️", color: "#d97706", lightBg: "#fffbeb", border: "#fef3c7", defaultName: "Knowing the Path" },
  CO: { icon: "💪", color: "#059669", lightBg: "#ecfdf5", border: "#d1fae5", defaultName: "Feeling Sure" },
};

/**
 * Returns color hex and styling for risk levels
 */
function getRiskBadgeStyle(riskBadge = {}) {
  const level = Number(riskBadge.level ?? riskBadge.baseRiskLevel ?? 2);
  const hex = riskBadge.hexColor;

  switch (level) {
    case 1:
      return {
        bg: "bg-emerald-50 text-emerald-800 border-emerald-300",
        pillBg: hex || "#10B981",
        label: riskBadge.label || "Low",
        textColor: "text-emerald-700",
      };
    case 2:
      return {
        bg: "bg-green-50 text-green-800 border-green-300",
        pillBg: hex || "#4CAF50",
        label: riskBadge.label || "Low to Medium",
        textColor: "text-green-700",
      };
    case 3:
      return {
        bg: "bg-amber-50 text-amber-900 border-amber-300",
        pillBg: hex || "#F59E0B",
        label: riskBadge.label || "Medium",
        textColor: "text-amber-700",
      };
    case 4:
    default:
      return {
        bg: "bg-rose-50 text-rose-900 border-rose-300",
        pillBg: hex || "#EF4444",
        label: riskBadge.label || "High",
        textColor: "text-rose-700",
      };
  }
}

/**
 * YourProfilingReport Component
 * Renders the 7 blocks of Section 1 (Personal Profiling / CRI):
 * 1. Header Block (Title & Intro)
 * 2. Stage Track (Visual 5-step horizontal track)
 * 3. Risk Level Badge
 * 4. "What it means" & "Your Next Steps"
 * 5. "Your 5 Areas" (5 domain cards with 5-step mini-progress bar)
 * 6. Career Readiness Score (CRI)
 * 7. "Notes for you" (Flags / Personalized guidance)
 */
export default function YourProfilingReport({
  profilingData = {},
  studentFirstName = "Student",
  PageHeader,
  PageFooter,
  TitlePill,
  pageNum = 3,
}) {
  const pData = profilingData || {};

  // 1. Header block
  const heading = pData.heading || "YOUR PROFILING";
  const introParagraph = DEFAULT_INTRO;

  // 2. Stage Track
  const stageTrack = pData.stageTrack || {};
  const currentStageNo = Number(stageTrack.currentStageNo || 3);
  const stages = DEFAULT_STAGES.map((stage, index) => ({
    ...stage,
    ...(stageTrack.stages?.[index] || {}),
    stageNo: stage.stageNo,
    stageCode: stage.stageCode,
    stageName: stage.stageName,
    description: stage.description,
  }));
  const currentStageName = stages[currentStageNo - 1]?.stageName || "Decisive";

  // 3. Risk Badge
  const riskBadge = pData.riskBadge || {
    text: "Risk level: Low to Medium",
    label: "Low to Medium",
    level: 2,
    hexColor: "#4CAF50",
  };
  const riskStyle = getRiskBadgeStyle(riskBadge);

  // 4. What it means & Next steps
  const whatItMeans =
    pData.whatItMeans ||
    "You know what you want to do. Now you need a clear path: which subjects, which exams, and which skills.";



  // 5. Your 5 Areas
  const your5Areas =
    Array.isArray(pData.your5Areas) && pData.your5Areas.length > 0
      ? pData.your5Areas
      : [
          {
            domainCode: "SA",
            domainStudentFacingName: "About Me",
            score: 83,
            stage: "Future-Ready",
            stageNo: 5,
            label: "About Me – Future-Ready",
            meaning: "You know yourself very well and can use this to choose your career.",
          },
          {
            domainCode: "CE",
            domainStudentFacingName: "Knowing About Careers",
            score: 58,
            stage: "Exploring",
            stageNo: 3,
            label: "Knowing About Careers – Exploring",
            meaning: "You are finding out about different careers.",
          },
          {
            domainCode: "DC",
            domainStudentFacingName: "Making a Choice",
            score: 83,
            stage: "Future-Ready",
            stageNo: 5,
            label: "Making a Choice – Future-Ready",
            meaning: "You are sure about your choice and it stays steady.",
          },
          {
            domainCode: "PP",
            domainStudentFacingName: "Knowing the Path",
            score: 50,
            stage: "Exploring",
            stageNo: 3,
            label: "Knowing the Path – Exploring",
            meaning: "You know some of the steps for the field you like.",
          },
          {
            domainCode: "CO",
            domainStudentFacingName: "Feeling Sure",
            score: 75,
            stage: "Clarity",
            stageNo: 4,
            label: "Feeling Sure – Clarity",
            meaning: "You feel confident about choosing your career.",
          },
        ];

  // 6. Career Readiness Score (CRI)
  const criObj = pData.careerReadinessScore || {};
  const criScore = Number(criObj.cri ?? 70);
  const criMaxScore = Number(criObj.maxScore ?? 100);
  const criStageName = criObj.criStageName || currentStageName;

  // 7. Notes for You (Flags)
  const notesForYou = pData.notesForYou || {};
  const hasNotes = Boolean(notesForYou.hasNotes && Array.isArray(notesForYou.notes) && notesForYou.notes.length > 0);
  const notesList = hasNotes ? notesForYou.notes : [];

  return (
    <div className="pdf-page profiling-report-page" id={`page-${pageNum}`}>
      {PageHeader && <PageHeader studentFirstName={studentFirstName} />}

      <div className="pdf-page-body flex flex-col justify-start py-1 space-y-2">
        {/* ============================================================
            BLOCK 1: HEADER BLOCK
        ============================================================ */}
        <div>
          {TitlePill ? (
            <TitlePill title={heading} />
          ) : (
            <div className="title-pill-header">
              <div className="title-pill-target-icon">
                <div className="title-pill-target-center"></div>
              </div>
              <span className="title-pill-text">{heading}</span>
            </div>
          )}

          <p className="page-lead-text !mb-1 whitespace-pre-line text-[0.64rem] leading-tight text-[#374151]">
            {introParagraph}
          </p>
        </div>

        {/* ============================================================
            BLOCK 2 & 3 & 6: STAGE TRACK + RISK BADGE + CRI SCORE
        ============================================================ */}
        <div className="rounded-xl border border-[#E5E7EB] bg-gradient-to-br from-[#FAFCFD] to-[#F4F7FA] p-2 shadow-xs">
          {/* Top Row: Track Title & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#8C1814] text-white text-xs">
                <ThunderboltFilled />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-[#1E232A]">
                Your Current Career Stage
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* BLOCK 3: Risk Level Badge */}
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-2xs border"
                style={{ backgroundColor: `${riskStyle.pillBg}18`, borderColor: `${riskStyle.pillBg}55`, color: riskStyle.pillBg }}
              >
                <span
                  className="h-2 w-2 rounded-full animate-pulse"
                  style={{ backgroundColor: riskStyle.pillBg }}
                />
                <span>{riskBadge.text || `Risk level: ${riskStyle.label}`}</span>
              </div>

              {/* BLOCK 6: Career Readiness Score Mini Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1E232A] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                <TrophyFilled className="text-amber-400 text-xs" />
                <span>
                  Career Readiness: <strong className="text-amber-300 font-extrabold">{criScore}</strong>/{criMaxScore}
                </span>
              </div>
            </div>
          </div>
          {/* Visual 5-Step Horizontal Track */}
          <div className="pt-3 pb-1">
            <div className="relative flex items-center justify-between">
              {/* Connected background track line */}
              <div className="absolute top-3.5 left-4 right-4 h-1 bg-[#E2E8F0] -z-0 rounded-full" />
              {/* Filled active track line */}
              <div
                className="absolute top-3.5 left-4 h-1 bg-gradient-to-r from-[#0d9488] to-[#8C1814] -z-0 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(0, Math.min(100, ((currentStageNo - 1) / 4) * 100))}%`,
                }}
              />

              {stages.map((stage, sIdx) => {
                const stepNo = stage.stageNo || sIdx + 1;
                const isCurrent =
                  stage.isCurrent ||
                  stepNo === currentStageNo ||
                  stage.stageCode === stageTrack.currentStageCode;
                const isPast = stepNo < currentStageNo;

                return (
                  <div
                    key={stage.stageCode || sIdx}
                    className="relative z-10 flex flex-col items-center text-center"
                    style={{ width: "18%" }}
                  >
                    {/* Circle Node */}
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all ${
                        isCurrent
                          ? "bg-[#8C1814] text-white ring-4 ring-[#8C1814]/20 shadow-md scale-110"
                          : isPast
                          ? "bg-[#0d9488] text-white shadow-xs"
                          : "bg-white text-slate-400 border-2 border-slate-300"
                      }`}
                    >
                      {isPast ? <CheckOutlined className="text-[10px]" /> : stepNo}
                    </div>

                    {/* Stage Name */}
                    <span
                      className={`mt-1 text-[11px] leading-tight ${
                        isCurrent
                          ? "font-black text-[#8C1814]"
                          : isPast
                          ? "font-bold text-slate-800"
                          : "font-semibold text-slate-700"
                      }`}
                    >
                      {stage.stageName}
                    </span>

                    {/* Current Stage Indicator Tag */}
                    {isCurrent && (
                      <span className="mt-0.5 inline-block rounded bg-[#8C1814] px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-2xs">
                        You are here
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="profiling-stage-descriptions mt-1.5 grid grid-cols-1 gap-x-4 gap-y-1 border-t border-[#E5E7EB] pt-1.5 sm:grid-cols-2">
            {stages.map((stage) => (
              <div key={`${stage.stageNo}-description`} className="text-[8px] leading-[1.2] text-slate-600">
                <strong className="mb-0.5 block text-[#1E232A]">{stage.stageNo}. {stage.stageName}</strong>
                <span>{stage.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================
            BLOCK 4: "WHAT IT MEANS" & "YOUR NEXT STEPS" (2-Col Card Grid)
        ============================================================ */}
        <div className="grid grid-cols-1 gap-2">
          {/* What it means Card */}
          <div className="profiling-meaning-card rounded-xl border border-[#E9ECEF] bg-[#FFFFFF] p-2 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 text-xs font-black uppercase tracking-wider text-[#8C1814]">
                <span>💡</span>
                <span>What it means</span>
              </div>
              <p className="text-[12.5px] leading-snug text-[#2D3748] font-medium">
                {whatItMeans}
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-700">
              <span>Current Status: <strong className="text-[#8C1814] font-bold">{currentStageName}</strong></span>
              <span>CRI: <strong className="text-slate-800 font-bold">{criScore}/100</strong></span>
            </div>
          </div>

         
        </div>

        {/* ============================================================
            BLOCK 5: "YOUR 5 AREAS"
        ============================================================ */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs font-black uppercase tracking-wider text-[#1E232A] flex items-center gap-1.5">
              <span>📊</span>
              <span>Your 5 Areas of Personal Profiling</span>
            </div>
           
          </div>

          <div className="profiling-area-list space-y-1">
            {your5Areas.map((area, idx) => {
              const code = area.domainCode || Object.keys(DOMAIN_CONFIG)[idx] || "SA";
              const cfg = DOMAIN_CONFIG[code] || DOMAIN_CONFIG.SA;
              const domainName = area.domainStudentFacingName || cfg.defaultName;
              const stageNum = Number(area.stageNo || 3);
              const stageLabel = DEFAULT_STAGES[stageNum - 1]?.stageName || "Discovering";
              const scoreVal = area.score !== undefined ? area.score : null;

              return (
                <div
                  key={code || idx}
                  className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 shadow-2xs flex flex-col justify-between gap-0.5 transition-all hover:border-slate-300"
                >
                  {/* Top Row: Icon + Name + Stage Badge + Score + 5-Step Mini Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-[210px]">
                      <span className="text-sm">{cfg.icon}</span>
                      <span className="text-xs font-black text-[#1E232A]">
                        {domainName}
                      </span>
                     
                    </div>

                    {/* 5-Step Mini-Progress Bar (1 to 5) */}
                    <div className="flex items-center gap-1.5 flex-1 max-w-[220px]">
                      <div className="flex w-full items-center gap-1">
                        {[1, 2, 3, 4, 5].map((stg) => {
                          const isActive = stg === stageNum;
                          const isFilled = stg <= stageNum;

                          return (
                            <div
                              key={stg}
                              className={`h-2 flex-1 rounded-full transition-all ${
                                isActive
                                  ? "shadow-2xs ring-1.5"
                                  : ""
                              }`}
                              style={{
                                backgroundColor: isFilled ? cfg.color : "#E2E8F0",
                                ringColor: isActive ? cfg.color : "transparent",
                                opacity: isFilled ? 1 : 0.6,
                              }}
                              title={`Stage ${stg}: ${DEFAULT_STAGES[stg - 1]?.stageName}`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 min-w-[28px] text-right">
                        {stageNum}/5
                      </span>
                    </div>

                    {/* Score Badge if present */}
                  
                  </div>

                  {/* Bottom Row: Meaning text */}
                  <p className="text-[11px] leading-tight text-[#4B5563] pl-6 font-medium">
                    {area.meaning}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================
            BLOCK 7: "NOTES FOR YOU" (FLAGS / GUIDANCE)
        ============================================================ */}
        {hasNotes && (
          <div className="profiling-guidance rounded-xl border border-amber-300 bg-amber-50/70 p-2 shadow-2xs">
            <div className="flex items-center gap-2 mb-1 text-xs font-black uppercase tracking-wider text-amber-900">
              <WarningFilled className="text-amber-600 text-sm" />
              <span>Personalized Guidance & Key Observations</span>
            </div>
            <div className="space-y-1">
              {notesList.map((n, i) => (
                <div key={n.flagId || i} className="profiling-guidance-note text-[10px] leading-tight text-amber-950 font-medium">
                  {n.flagName && (
                    <span className="inline-block rounded bg-amber-200/90 text-amber-900 text-[10px] font-black px-1.5 py-0.2 mr-1.5 uppercase">
                      {n.flagName}
                    </span>
                  )}
                  <span>{n.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {PageFooter && <PageFooter pageNum={pageNum} />}
    </div>
  );
}
