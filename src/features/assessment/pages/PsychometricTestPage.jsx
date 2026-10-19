import { useMemo, useRef, useState } from "react";
import {
  AppstoreOutlined,
  BarChartOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FlagOutlined,
  FundProjectionScreenOutlined,
  ReadOutlined,
  ReloadOutlined,
  RightOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { Button, Card, Collapse, Progress, Radio, Space, Steps, Tag, message } from "antd";
import { ModuleScreen, PageHero } from "../../../components/ui";
import { useAppState } from "../../../state/AppStateContext";
import { PremiumGate, usePortalNavigation } from "../../portal/components/portalPageShared";

const answerScale = [
  { label: "Strongly Agree", value: 5 },
  { label: "Agree", value: 4 },
  { label: "Neutral", value: 3 },
  { label: "Disagree", value: 2 },
  { label: "Strongly Disagree", value: 1 },
];

const assessmentModules = [
  {
    key: "interest",
    title: "Interest",
    icon: <SmileOutlined />,
    color: "#b12d1f",
    summary: "Explores the activities and subjects that naturally hold your attention.",
    questions: [
      "I enjoy exploring new subjects even outside my school syllabus.",
      "I feel excited when I discover how a profession works in real life.",
      "I prefer tasks that connect with my personal passions and curiosity.",
      "I like spending time on projects related to careers I admire.",
      "I actively look for opportunities to learn about different fields.",
    ],
  },
  {
    key: "personality",
    title: "Personality",
    icon: <SmileOutlined />,
    color: "#c4502c",
    summary: "Looks at how you behave, respond, and work with others.",
    questions: [
      "I stay calm and steady when I face pressure or deadlines.",
      "I enjoy working with people and building new connections.",
      "I usually take initiative instead of waiting for instructions.",
      "I adapt quickly when plans or expectations suddenly change.",
      "I like expressing my thoughts openly in group discussions.",
    ],
  },
  {
    key: "goal-orientation",
    title: "Goal Orientation",
    icon: <FlagOutlined />,
    color: "#9b1d24",
    summary: "Measures your motivation, persistence, and focus on outcomes.",
    questions: [
      "I set clear goals for myself and track my progress regularly.",
      "I keep working on tasks even when they become difficult.",
      "I feel motivated by achieving measurable outcomes.",
      "I break big goals into smaller milestones and deadlines.",
      "I recover quickly after setbacks and continue moving forward.",
    ],
  },
  {
    key: "aptitude",
    title: "Aptitude",
    icon: <BarChartOutlined />,
    color: "#8f2f1f",
    summary: "Assesses how comfortable you are with reasoning and problem solving.",
    questions: [
      "I enjoy solving puzzles, patterns, or logic-based questions.",
      "I can quickly understand charts, data, or number-based information.",
      "I like comparing different solutions before making a choice.",
      "I can identify mistakes or inconsistencies in information easily.",
      "I enjoy tasks that require structured thinking and accuracy.",
    ],
  },
  {
    key: "learning-style",
    title: "Learning Style",
    icon: <ReadOutlined />,
    color: "#b56a2f",
    summary: "Shows how you best absorb, practice, and retain information.",
    questions: [
      "I learn best when I can see examples, diagrams, or demonstrations.",
      "I remember concepts better after discussing them with someone.",
      "I prefer hands-on practice instead of only reading theory.",
      "I stay engaged when learning is interactive and activity-based.",
      "I revise more effectively when I organize notes in my own way.",
    ],
  },
  {
    key: "work-values",
    title: "Work Values",
    icon: <FundProjectionScreenOutlined />,
    color: "#7a2b20",
    summary: "Highlights what matters most to you in a future career environment.",
    questions: [
      "I want a career that creates a positive impact on others.",
      "I value long-term job security when thinking about career choices.",
      "I want enough freedom to make independent decisions in my work.",
      "I care about work-life balance as much as career growth.",
      "I feel motivated by roles where effort is recognized and rewarded.",
    ],
  },
];

const moduleInsights = {
  interest: {
    strong: "You are driven by curiosity and naturally lean toward exploratory career paths.",
    moderate: "Your interests are emerging well, and more exposure can sharpen your direction.",
    low: "You may need broader exposure to subjects and careers to clarify what energizes you most.",
  },
  personality: {
    strong: "Your personal style shows confidence and adaptability across team and individual settings.",
    moderate: "You show balanced traits and can grow strongly with the right environment.",
    low: "A more guided environment may help you build confidence and communication habits.",
  },
  "goal-orientation": {
    strong: "You are highly motivated and likely to stay committed to long-term goals.",
    moderate: "You have a healthy level of drive and can benefit from stronger planning habits.",
    low: "You may do better with shorter milestones, structure, and accountability support.",
  },
  aptitude: {
    strong: "You appear comfortable with reasoning, structured thinking, and analytical problem solving.",
    moderate: "You have a workable foundation and can improve with regular practice.",
    low: "You may benefit from skill-building in logic, data handling, and step-by-step analysis.",
  },
  "learning-style": {
    strong: "You understand how you learn best and can likely adapt your study methods well.",
    moderate: "You show flexible learning habits and can improve with more deliberate study systems.",
    low: "Experimenting with study formats may help you discover methods that suit you better.",
  },
  "work-values": {
    strong: "You have clear internal values that can guide meaningful career decisions.",
    moderate: "Your work values are taking shape and will become clearer with more experience.",
    low: "You may need more reflection on what kind of work environment matters most to you.",
  },
};

const moduleReportLibrary = {
  interest: {
    overview:
      "Your interests are the areas, activities, or subjects that capture your attention and energy. They reflect what you enjoy doing, what you are naturally curious about, and what keeps you motivated. When your career aligns with your interests, work becomes more enjoyable and learning feels more natural.",
    dimensions: [
      {
        title: "Curiosity & Exploration",
        icon: <SmileOutlined />,
        summary:
          "You enjoy discovering new topics, testing ideas, and expanding your awareness of possible career directions.",
        traits: ["Curious", "Open-minded", "Exploratory", "Growth oriented"],
        enjoys: ["Trying new subjects", "Researching options", "Learning from examples"],
        environments: ["Discovery-based", "Flexible", "Idea-friendly"],
      },
      {
        title: "Career Engagement",
        icon: <FundProjectionScreenOutlined />,
        summary:
          "You are motivated when learning feels connected to real professions, future goals, and meaningful application.",
        traits: ["Purpose driven", "Aware", "Future focused", "Motivated"],
        enjoys: ["Career stories", "Project-based learning", "Applied activities"],
        environments: ["Practical", "Mentored", "Career-linked"],
      },
      {
        title: "Passion Alignment",
        icon: <ReadOutlined />,
        summary:
          "You prefer pathways that feel personally meaningful rather than purely routine or externally imposed.",
        traits: ["Self-aware", "Value conscious", "Inspired", "Authentic"],
        enjoys: ["Purposeful goals", "Choice-led learning", "Personal expression"],
        environments: ["Supportive", "Interest-led", "Encouraging"],
      },
    ],
    careers: [
      "Career Research Analyst",
      "Content Creator",
      "Education Counsellor",
      "Innovation Associate",
      "Learning Experience Designer",
      "Student Mentor",
    ],
  },
  personality: {
    overview:
      "Personality helps explain how you respond to people, pressure, and change. It gives clues about the kinds of work settings where you may feel most comfortable, confident, and effective.",
    dimensions: [
      {
        title: "Social Expression",
        icon: <SmileOutlined />,
        summary:
          "This reflects how comfortable you are interacting, speaking up, and building connections with others.",
        traits: ["Expressive", "Collaborative", "Friendly", "Approachable"],
        enjoys: ["Group discussions", "Meeting people", "Shared work"],
        environments: ["Team-based", "Interactive", "People centric"],
      },
      {
        title: "Adaptability",
        icon: <ReloadOutlined />,
        summary:
          "Adaptability indicates how well you adjust when plans change or when expectations become uncertain.",
        traits: ["Flexible", "Resilient", "Responsive", "Calm"],
        enjoys: ["Varied tasks", "New challenges", "Dynamic settings"],
        environments: ["Fast-paced", "Changing", "Opportunity rich"],
      },
      {
        title: "Initiative & Presence",
        icon: <FlagOutlined />,
        summary:
          "This dimension highlights whether you tend to take the lead and move work forward without waiting too long.",
        traits: ["Proactive", "Confident", "Action-oriented", "Visible"],
        enjoys: ["Leading activities", "Starting tasks", "Owning outcomes"],
        environments: ["Empowering", "Independent", "Leadership friendly"],
      },
    ],
    careers: [
      "Human Resources Executive",
      "Teacher",
      "Public Relations Associate",
      "Client Success Manager",
      "Counsellor",
      "Team Coordinator",
    ],
  },
  "goal-orientation": {
    overview:
      "Goal orientation measures how focused, persistent, and outcome-driven you are. It reflects how strongly you work toward targets and how you respond when progress takes time.",
    dimensions: [
      {
        title: "Achievement Drive",
        icon: <FlagOutlined />,
        summary:
          "This reflects how strongly you are motivated by targets, growth, and a clear sense of progress.",
        traits: ["Ambitious", "Focused", "Driven", "Competitive"],
        enjoys: ["Goal tracking", "Milestones", "Visible progress"],
        environments: ["Performance based", "Structured", "Growth oriented"],
      },
      {
        title: "Persistence",
        icon: <ReloadOutlined />,
        summary:
          "Persistence shows your willingness to keep working when tasks become difficult or slower than expected.",
        traits: ["Patient", "Steady", "Committed", "Responsible"],
        enjoys: ["Long-term projects", "Skill building", "Problem solving"],
        environments: ["Supportive", "Challenging", "Disciplined"],
      },
      {
        title: "Planning Habits",
        icon: <AppstoreOutlined />,
        summary:
          "Planning habits describe how effectively you break large goals into manageable next steps.",
        traits: ["Organized", "Methodical", "Intentional", "Reliable"],
        enjoys: ["Scheduling", "Checklists", "Prioritizing work"],
        environments: ["Clear", "Orderly", "Process friendly"],
      },
    ],
    careers: [
      "Project Coordinator",
      "Operations Executive",
      "Business Analyst",
      "Program Manager",
      "Administrative Officer",
      "Exam Strategy Mentor",
    ],
  },
  aptitude: {
    overview:
      "Aptitude reflects your comfort with logic, analysis, and structured problem-solving. It offers a view into how naturally you may handle accuracy, reasoning, and information processing tasks.",
    dimensions: [
      {
        title: "Analytical Reasoning",
        icon: <BarChartOutlined />,
        summary:
          "This measures how well you think through problems and compare possibilities before deciding.",
        traits: ["Logical", "Analytical", "Careful", "Thoughtful"],
        enjoys: ["Patterns", "Analysis", "Evidence-based thinking"],
        environments: ["Structured", "Intellectually challenging", "Systematic"],
      },
      {
        title: "Data Comfort",
        icon: <BarChartOutlined />,
        summary:
          "Data comfort shows how confident you feel around numbers, charts, and measurable information.",
        traits: ["Precise", "Observant", "Numerate", "Accurate"],
        enjoys: ["Reports", "Metrics", "Comparisons"],
        environments: ["Data-rich", "Measured", "Objective"],
      },
      {
        title: "Error Detection",
        icon: <FileTextOutlined />,
        summary:
          "This indicates how easily you notice inconsistencies, weak assumptions, or missing details.",
        traits: ["Detail-oriented", "Focused", "Critical thinker", "Thorough"],
        enjoys: ["Reviewing", "Checking quality", "Improving systems"],
        environments: ["Quality-driven", "Careful", "Standards based"],
      },
    ],
    careers: [
      "Data Analyst",
      "Engineer",
      "Financial Analyst",
      "Research Assistant",
      "Quality Analyst",
      "Software Tester",
    ],
  },
  "learning-style": {
    overview:
      "Learning style explains how you understand, retain, and apply information most effectively. Knowing this helps you choose better study methods and work settings.",
    dimensions: [
      {
        title: "Visual Understanding",
        icon: <ReadOutlined />,
        summary:
          "You may learn more effectively when concepts are shown through diagrams, models, and examples.",
        traits: ["Observational", "Pattern aware", "Image-friendly", "Conceptual"],
        enjoys: ["Charts", "Maps", "Illustrations"],
        environments: ["Visual", "Demonstration-led", "Organized"],
      },
      {
        title: "Interactive Learning",
        icon: <SmileOutlined />,
        summary:
          "This shows whether discussion, feedback, and participation help you absorb information better.",
        traits: ["Participative", "Verbal", "Collaborative", "Responsive"],
        enjoys: ["Discussion", "Questioning", "Explaining ideas"],
        environments: ["Interactive", "Feedback rich", "Group supported"],
      },
      {
        title: "Practical Retention",
        icon: <FundProjectionScreenOutlined />,
        summary:
          "Practical retention reflects how strongly hands-on work helps you remember and master concepts.",
        traits: ["Hands-on", "Applied", "Action-based", "Pragmatic"],
        enjoys: ["Doing", "Practice tasks", "Simulations"],
        environments: ["Applied", "Workshop style", "Practice driven"],
      },
    ],
    careers: [
      "Trainer",
      "Instructional Designer",
      "UX Researcher",
      "Lab Assistant",
      "Workshop Facilitator",
      "Academic Coach",
    ],
  },
  "work-values": {
    overview:
      "Work values describe what matters most to you in a future career, such as impact, stability, freedom, balance, or recognition. These values often drive long-term satisfaction and career fit.",
    dimensions: [
      {
        title: "Purpose & Impact",
        icon: <FundProjectionScreenOutlined />,
        summary:
          "This shows how strongly you care about doing work that benefits people or creates meaningful change.",
        traits: ["Purposeful", "Empathetic", "Socially aware", "Conscientious"],
        enjoys: ["Helping others", "Making a difference", "Meaningful service"],
        environments: ["Mission-led", "Supportive", "Impact focused"],
      },
      {
        title: "Security & Stability",
        icon: <FileTextOutlined />,
        summary:
          "Security and stability reflect your preference for dependable roles and predictable long-term pathways.",
        traits: ["Steady", "Practical", "Responsible", "Grounded"],
        enjoys: ["Consistency", "Reliable systems", "Clear structures"],
        environments: ["Stable", "Organized", "Policy driven"],
      },
      {
        title: "Freedom & Balance",
        icon: <SmileOutlined />,
        summary:
          "This dimension highlights your need for autonomy, flexibility, and a healthy balance between work and life.",
        traits: ["Independent", "Self-directed", "Balanced", "Thoughtful"],
        enjoys: ["Choice", "Flexible work", "Personal space"],
        environments: ["Autonomous", "Respectful", "Flexible"],
      },
    ],
    careers: [
      "Social Impact Associate",
      "Government Services Officer",
      "NGO Program Executive",
      "Wellness Counsellor",
      "Corporate Communications Executive",
      "Community Development Associate",
    ],
  },
};

function getBand(score, maxScore) {
  const ratio = score / maxScore;
  if (ratio >= 0.8) {
    return "strong";
  }
  if (ratio >= 0.55) {
    return "moderate";
  }
  return "low";
}

function toTitleCase(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createInitialAnswers() {
  return assessmentModules.map((module) => module.questions.map(() => null));
}

function normalizeAnswers(answers) {
  return assessmentModules.map((module, moduleIndex) => {
    const moduleAnswers = Array.isArray(answers?.[moduleIndex]) ? answers[moduleIndex] : [];
    return module.questions.map((_, questionIndex) => moduleAnswers[questionIndex] ?? null);
  });
}

function buildReportFromAnswers(answers) {
  const safeAnswers = normalizeAnswers(answers);
  const modules = assessmentModules.map((module, moduleIndex) => {
    const moduleAnswers = safeAnswers[moduleIndex];
    const score = moduleAnswers.reduce((sum, value) => sum + (value || 0), 0);
    const maxScore = module.questions.length * 5;
    const percentage = Math.round((score / maxScore) * 100);
    const band = getBand(score, maxScore);

    return {
      ...module,
      score,
      maxScore,
      percentage,
      band,
      insight: moduleInsights[module.key][band],
    };
  });

  const topModule = [...modules].sort((a, b) => b.score - a.score)[0];
  const overallScore = modules.reduce((sum, module) => sum + module.score, 0);
  const overallMax = modules.reduce((sum, module) => sum + module.maxScore, 0);
  const overallPercent = Math.round((overallScore / overallMax) * 100);

  return {
    modules,
    topModule,
    overallScore,
    overallMax,
    overallPercent,
  };
}

function buildDimensionScore(module, index) {
  const base = Math.max(2, Math.round(module.score / 3));
  return Math.min(5, Math.max(1, base + (index === 1 ? 0 : index === 2 ? -1 : 1)));
}

export default function PsychometricTestPage() {
  const { addTestHistory, isUnlocked } = useAppState();
  const { navigate } = usePortalNavigation();
  const [messageApi, contextHolder] = message.useMessage();
  const [currentModule, setCurrentModule] = useState(0);
  const [stage, setStage] = useState("questions");
  const [reportMode, setReportMode] = useState("single");
  const [selectedReportModule, setSelectedReportModule] = useState("interest");
  const [answers, setAnswers] = useState(createInitialAnswers);
  const reportContainerRef = useRef(null);

  const safeAnswers = normalizeAnswers(answers);
  const safeCurrentModule = Math.min(Math.max(currentModule, 0), assessmentModules.length - 1);
  const totalQuestions = assessmentModules.reduce((sum, module) => sum + module.questions.length, 0);
  const answeredCount = safeAnswers.flat().filter((value) => value !== null).length;
  const percentComplete = Math.round((answeredCount / totalQuestions) * 100);
  const activeModule = assessmentModules[safeCurrentModule];
  const activeAnswers = safeAnswers[safeCurrentModule];
  const moduleComplete = activeAnswers.every((value) => value !== null);
  const isLastModule = safeCurrentModule === assessmentModules.length - 1;
  const report = useMemo(() => buildReportFromAnswers(safeAnswers), [safeAnswers]);

  function handleBack() {
    if (stage === "result") {
      navigate("/app/assessment", { replace: true });
      return;
    }

    if (safeCurrentModule > 0) {
      setCurrentModule((value) => value - 1);
      return;
    }

    navigate("/app/assessment", { replace: true });
  }

  function handleAnswerChange(questionIndex, value) {
    setAnswers((current) => {
      const normalizedCurrent = normalizeAnswers(current);
      const nextAnswers = normalizedCurrent.map((moduleAnswers, moduleIndex) =>
        moduleIndex === safeCurrentModule
          ? moduleAnswers.map((answer, index) => (index === questionIndex ? value : answer))
          : moduleAnswers
      );

      const nextModuleAnswers = nextAnswers[safeCurrentModule];
      const nextModuleComplete = nextModuleAnswers.every((answer) => answer !== null);

      if (nextModuleComplete) {
        window.setTimeout(() => {
          if (safeCurrentModule === assessmentModules.length - 1) {
            const finalReport = buildReportFromAnswers(nextAnswers);
            addTestHistory({
              id: `psychometric-${Date.now()}`,
              title: "Full Assessment Report",
              subtitle: `Completed on ${new Date().toLocaleDateString("en-IN")} - Overall score ${finalReport.overallPercent}%`,
              status: "Report Ready",
            });
            setSelectedReportModule("interest");
            setReportMode("single");
            setStage("result");
            return;
          }

          setCurrentModule((moduleIndex) => moduleIndex + 1);
        }, 350);
      }

      return nextAnswers;
    });
  }

  function handleNext() {
    if (!moduleComplete) {
      messageApi.warning("Please answer all questions in this module before continuing.");
      return;
    }

    if (isLastModule) {
      addTestHistory({
        id: `psychometric-${Date.now()}`,
        title: "Full Assessment Report",
        subtitle: `Completed on ${new Date().toLocaleDateString("en-IN")} - Overall score ${report.overallPercent}%`,
        status: "Report Ready",
      });
      setSelectedReportModule("interest");
      setReportMode("single");
      setStage("result");
      return;
    }

    setCurrentModule((value) => value + 1);
  }

  function handleRetake() {
    setAnswers(createInitialAnswers());
    setCurrentModule(0);
    setStage("questions");
    setReportMode("single");
    setSelectedReportModule("interest");
  }

  function handleDownloadReport() {
    const generatedOn = new Date().toLocaleString("en-IN");
    const moduleRows = report.modules
      .map(
        (module) => `
          <tr>
            <td style="padding:10px;border:1px solid #eaded9;">${module.title}</td>
            <td style="padding:10px;border:1px solid #eaded9;">${module.score}/${module.maxScore}</td>
            <td style="padding:10px;border:1px solid #eaded9;">${module.percentage}%</td>
            <td style="padding:10px;border:1px solid #eaded9;">${toTitleCase(module.band)}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Assessment Report</title>
        </head>
        <body style="font-family: Arial, sans-serif; color: #231815; padding: 32px;">
          <h1 style="color:#9a2119; margin-bottom: 4px;">CareerMap Assessment Results</h1>
          <p style="margin-top:0; color:#6b5b55;">Generated on ${generatedOn}</p>
          <p><strong>Overall score:</strong> ${report.overallScore}/${report.overallMax} (${report.overallPercent}%)</p>
          <p><strong>Strongest module:</strong> ${report.topModule.title}</p>
          <p style="line-height:1.7;">${report.topModule.insight}</p>
          <table style="width:100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background:#fdf3f0;">
                <th style="padding:10px;border:1px solid #eaded9;text-align:left;">Module</th>
                <th style="padding:10px;border:1px solid #eaded9;text-align:left;">Score</th>
                <th style="padding:10px;border:1px solid #eaded9;text-align:left;">Percent</th>
                <th style="padding:10px;border:1px solid #eaded9;text-align:left;">Level</th>
              </tr>
            </thead>
            <tbody>${moduleRows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "career-map-assessment-report.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (!isUnlocked("psychometric-test")) {
    return (
      <PremiumGate
        title="Psychometric Test Locked"
        description="Subscribe to continue with the full psychometric test."
        returnTo="/app/psychometric-test"
      />
    );
  }

  if (stage === "result") {
    const visibleModules =
      reportMode === "all"
        ? report.modules
        : report.modules.filter((module) => module.key === selectedReportModule);

    return (
      <ModuleScreen maxWidthClass="max-w-[1280px]" className="space-y-5">
        {contextHolder}
        <PageHero backOnly onBack={handleBack} />

        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 text-[#9a2119]">
                <BarChartOutlined className="text-[28px]" />
                <div className="text-4xl font-black leading-none text-[#9a2119]">Assessment Results</div>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#65544f]">
                Click a module tab to read that section, or use full report mode to see every module one after another in a scrollable format.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type={reportMode === "all" ? "primary" : "default"}
                className={reportMode === "all" ? "!h-11 !rounded-xl !bg-[#b12d1f] !border-[#b12d1f] !font-semibold" : "!h-11 !rounded-xl !border-[#d9d4d1] !font-semibold"}
                onClick={() => {
                  setReportMode("all");
                  window.setTimeout(() => reportContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
                }}
              >
                View All Report
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                className="!h-11 !rounded-xl !bg-[#9a2119] !border-[#9a2119] !font-semibold"
                onClick={handleDownloadReport}
              >
                Download Report
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-[#ece6e2] pb-4">
            {report.modules.map((module) => (
              <button
                key={module.key}
                type="button"
                onClick={() => {
                  setReportMode("single");
                  setSelectedReportModule(module.key);
                  window.setTimeout(() => reportContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  reportMode === "single" && selectedReportModule === module.key
                    ? "bg-[#fdf0ee] text-[#9a2119]"
                    : "bg-transparent text-[#746863] hover:bg-[#faf5f3] hover:text-[#b12d1f]"
                }`}
              >
                {module.title}
              </button>
            ))}
          </div>

          <div ref={reportContainerRef} className="mt-6 space-y-10">
            {visibleModules.map((module) => {
              const reportContent = moduleReportLibrary[module.key];
              return (
                <section key={module.key} className="scroll-mt-24">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
                          style={{ backgroundColor: `${module.color}14`, color: module.color }}
                        >
                          {module.icon}
                        </div>
                        <div>
                          <div className="text-2xl font-black text-[#231815]">{module.title}</div>
                          <div className="text-sm text-[#786b67]">{toTitleCase(module.band)} profile</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] px-4 py-3 min-w-[220px]">
                      <div className="flex items-center justify-between text-sm font-semibold text-[#9a2119]">
                        <span>Module Score</span>
                        <span>{module.score}/{module.maxScore}</span>
                      </div>
                      <Progress percent={module.percentage} strokeColor={module.color} trailColor="#f1d8d2" className="mt-3 !mb-0" />
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#f0d7d2] bg-[#fdf5f3] px-5 py-4">
                    <div className="text-sm font-bold text-[#9a2119]">Description</div>
                    <p className="mb-0 mt-2 text-sm leading-7 text-[#6d5c57]">{reportContent.overview}</p>
                  </div>

                  <div className="mt-5 space-y-4">
                    {reportContent.dimensions.map((dimension, index) => (
                      <div key={dimension.title} className="rounded-[24px] border border-[#e8e1dd] bg-white p-5 shadow-sm">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-[120px_minmax(0,1fr)]">
                          <div className="flex items-center justify-center">
                            <div
                              className="flex h-20 w-20 items-center justify-center rounded-[28px] text-[30px]"
                              style={{ backgroundColor: `${module.color}12`, color: module.color }}
                            >
                              {dimension.icon}
                            </div>
                          </div>
                          <div>
                            <div className="text-xl font-black text-[#231815]">{dimension.title}</div>
                            <div className="mt-1 text-sm font-semibold" style={{ color: module.color }}>
                              Average Score: {buildDimensionScore(module, index)}
                            </div>
                            <p className="mt-3 text-sm leading-7 text-[#544845]">{dimension.summary}</p>
                            <p className="mb-2 text-sm leading-7 text-[#544845]">{module.insight}</p>
                            <div className="space-y-2 text-sm text-[#2c221f]">
                              <div>
                                <span className="font-bold">Key Traits:</span> {dimension.traits.join(", ")}
                              </div>
                              <div>
                                <span className="font-bold">Enjoys:</span> {dimension.enjoys.join(", ")}
                              </div>
                              <div>
                                <span className="font-bold">Ideal Environments:</span> {dimension.environments.join(", ")}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 text-[30px] font-black leading-none text-[#9a2119]">Suggested Career Paths</div>
                    <Collapse
                      className="overflow-hidden !rounded-2xl !border-[#ead7d2] !bg-white"
                      items={[
                        {
                          key: module.key,
                          label: module.title,
                          children: (
                            <div className="space-y-5">
                              <div className="text-sm font-semibold text-[#9a2119]">{module.title} aligned roles</div>
                              <div className="grid grid-cols-1 gap-y-4 text-sm text-[#2c221f] md:grid-cols-3 md:gap-x-8">
                                {reportContent.careers.map((career, careerIndex) => (
                                  <div key={career} className="border-b border-[#ece6e2] pb-3">
                                    {careerIndex + 1}. {career}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ),
                        },
                      ]}
                      defaultActiveKey={[module.key]}
                    />
                  </div>
                </section>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            
            <Button
              icon={<ReloadOutlined />}
              className="!h-11 !rounded-xl !border-[#e4d5cf] !font-semibold"
              onClick={handleRetake}
            >
              Retake Assessment
            </Button>
          </div>
        </div>
      </ModuleScreen>
    );
  }

  return (
    <ModuleScreen maxWidthClass="max-w-[1280px]" className="space-y-5">
      {contextHolder}
      <PageHero backOnly onBack={handleBack} />

      <div className="space-y-6 rounded-[28px] border border-[#eaded9] bg-white px-5 py-5 shadow-sm md:px-6 md:py-6">
        <div className="flex flex-col gap-4 border-b border-[#f1e3de] pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.24em] text-[#b12d1f]">Full Assessment</div>
            <h1 className="mt-2 text-3xl font-black text-[#231815]">Psychometric Test</h1>
          </div>
          <div className="min-w-[220px] lg:max-w-[260px]">
            <div className="flex items-center justify-between text-sm font-semibold text-[#8e3b2d]">
              <span>Progress</span>
              <span>{answeredCount}/{totalQuestions} answered</span>
            </div>
            <Progress percent={percentComplete} strokeColor="#b12d1f" trailColor="#f1d8d2" className="mt-3 !mb-0" />
          </div>
        </div>

        <div className="border-b border-[#f1e3de] pb-5">
          <Steps
            current={safeCurrentModule}
            responsive
            items={assessmentModules.map((module, index) => ({
              title: module.title,
              description: `${safeAnswers[index].filter((value) => value !== null).length}/${module.questions.length} done`,
              icon: module.icon,
            }))}
          />
        </div>

        <div className="space-y-5">
          {activeModule.questions.map((question, questionIndex) => (
            <div key={question}>
              <div className="mb-3 text-sm font-bold text-[#231815]">
                Q{questionIndex + 1}. {question}
              </div>
              <Radio.Group
                value={activeAnswers[questionIndex]}
                onChange={(event) => handleAnswerChange(questionIndex, event.target.value)}
                className="w-full"
              >
                <Space direction="vertical" className="w-full">
                  {answerScale.map((option) => (
                    <Radio
                      key={option.label}
                      value={option.value}
                      className="!flex !rounded-xl !border !border-[#eadcd6] !bg-white !px-4 !py-3 hover:!border-[#cf8d80]"
                    >
                      <span className="text-sm text-[#4f4340]">{option.label}</span>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[#f1e3de] pt-5">
          <Button className="!h-11 !rounded-xl !border-[#dfd2cc] !px-5 !font-semibold" onClick={handleBack}>
            {safeCurrentModule === 0 ? "Back to Assessment" : "Previous Module"}
          </Button>
          <Button
            type="primary"
            icon={<RightOutlined />}
            iconPosition="end"
            className="!ml-auto !h-11 !rounded-xl !bg-[#b12d1f] !border-[#b12d1f] !px-5 !font-semibold"
            onClick={handleNext}
          >
            {isLastModule ? "Finish & View Report" : "Check & Continue"}
          </Button>
        </div>
      </div>
    </ModuleScreen>
  );
}
