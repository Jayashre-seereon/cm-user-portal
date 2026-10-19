import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  LoadingOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { Button, Select, Spin, message } from "antd";
import { getAttemptResult } from "../../../api/psychometricAssessmentApi";
import { useAuthStore } from "../../../store/authStore";
import {
  CLUSTERS,
  INTERP,
  pct,
  band,
} from "../data/careerCompassData";
import { SAMPLE_PROFILING_REPORT } from "../data/assessmentConstants";
import YourProfilingReport from "../components/YourProfilingReport";
import Logo from "../../../asset/logo_white.png";
import ReportImg1 from "../../../asset/report/report_1.png";
import ReportImg2 from "../../../asset/report/report_2.png";
import ReportImg3 from "../../../asset/report/report_3.png";
import ReportImg4 from "../../../asset/report/report_4.png";
import ReportImg5 from "../../../asset/report/report_5.png";
import ReportImg6 from "../../../asset/report/report_6.png";
import ReportImg7 from "../../../asset/report/report_7.png";
import ReportImg8 from "../../../asset/report/report_8.png";
import ReportImg9 from "../../../asset/report/report_9.png";
import FeaturePsychometric from "../../../asset/report/feature_psychometric.jpg";
import FeatureOnetoone from "../../../asset/report/feature_onetoone.jpg";
import FeatureMentorship from "../../../asset/report/feature_mentorship.jpg";
import FeatureCell from "../../../asset/report/feature_cell.jpg";
import FeatureBehavioral from "../../../asset/report/feature_behavioral.jpg";
import FeatureDashboard from "../../../asset/report/feature_dashboard.jpg";
import "./AssessmentReportPage.css";
// Common Header Component for Pages 2 to 32 matching PDF
function PageHeader({ studentFirstName }) {
  return (
    <div className="pdf-header">
      <div className="pdf-header-top">
        <div className="pdf-header-name">{studentFirstName || "Aryaman"}</div>
        <div className="pdf-header-logo">
          <img
            src={Logo}
            alt="CareerMap"
            className="h-8 w-auto object-contain"
          />
        </div>
      </div>
      <div className="pdf-header-line"></div>
    </div>
  );
}

// Common Footer Component for Pages 2 to 32 matching PDF
function PageFooter({ pageNum }) {
  return (
    <div className="pdf-footer">
      <div className="pdf-footer-line"></div>
      <div className="pdf-footer-content">
        <div className="pdf-footer-contact">
          <div className="pdf-footer-item">
            <span className="pdf-footer-icon-circle">📞</span>
            <span>+91 94372 08179</span>
          </div>
          <div className="pdf-footer-item">
            <span className="pdf-footer-icon-circle">✉️</span>
            <span>careermap2016@gmail.com</span>
          </div>
        </div>
        <div className="pdf-footer-page">Page No {pageNum}</div>
      </div>
    </div>
  );
}

// Section Title Pill Header (with circular target icon) matching PDF
function TitlePill({ title, colorClass = "" }) {
  return (
    <div className={`title-pill-header ${colorClass}`}>
      <div className="title-pill-target-icon">
        <div className="title-pill-target-center"></div>
      </div>
      <span className="title-pill-text">{title}</span>
    </div>
  );
}

export default function AssessmentReportPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadReport();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [attemptId]);

  async function loadReport() {
    setLoading(true);
    try {
      if (attemptId && attemptId !== "demo") {
        const data = await getAttemptResult(attemptId);
        if (data) {
          const payload = data.data || data;
          setReportData(payload);
        } else {
          setReportData(null);
        }
      } else {
        setReportData(null);
      }
    } catch (err) {
      console.warn("Could not fetch remote result:", err?.message);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function scrollToPage(pageId) {
    const el = document.getElementById(pageId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAEFF4]">
        <div className="text-center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: "#8C1814" }} spin />} />
          <h2 className="mt-4 text-2xl font-black text-[#1E232A]">
            Generating Career Compass Report...
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Synthesizing 32 pages of Personal Profiling, RIASEC, OCEAN, Schwartz Values, Aptitudes, and Pathways
          </p>
        </div>
      </div>
    );
  }

  // Normalize API data or use full high-fidelity default dataset matching the PDF
  const rawData = reportData || {};
  const report = rawData.report || {};
  const student = report.student || rawData.student || {};
  const studentName = student.name || rawData.studentName || rawData.user?.name || user?.name || "Aryaman Singh";
  const studentFirstName = studentName.split(" ")[0] || "Aryaman";
  const studentClass = student.class || rawData.className || rawData.class || user?.selectedClass || "10th";
  const studentSchool = student.school || rawData.school || user?.school || "DAV, Pokhariput, BBSR";
  const studentEmail = student.email || rawData.email || rawData.user?.email || user?.email || "aryaman1012@gmail.com";
  const studentPhone = student.phone || rawData.phone || rawData.user?.mobile || user?.mobile || "+91-88958 12485";
  const completedDate = student.completedAt || rawData.completedAt || rawData.createdAt || "2025-11-26T10:00:00.000Z";

  const formattedDate = new Date(completedDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const yourProfiling =
    report.yourProfiling ||
    rawData.yourProfiling ||
    rawData.report?.yourProfiling ||
    SAMPLE_PROFILING_REPORT;

  const hollandCode = rawData.hollandCode || report.hollandProfile?.code || report.hollandCode || "ECS";
  const scores = rawData.scores || report.scores || {};
  const domains = report.domains || rawData.domains || {};

  // Goal Orientation
  const goalObj = domains.goalOrientation || {};
  const longPct = goalObj.longTerm?.percentage ?? (scores.goalLong != null ? pct(scores.goalLong) : 80);
  const shortPct = goalObj.shortTerm?.percentage ?? (scores.goalShort != null ? pct(scores.goalShort) : 100);

  // Interests Scores (RIASEC)
  const interestScoreMap = { E: 100, C: 95, S: 85, R: 80, I: 55, A: 55 };
  const domainInterests = domains.interests || [];
  domainInterests.forEach((d) => {
    if (d.facet && (d.percentage != null || d.score != null)) {
      interestScoreMap[d.facet] = d.percentage ?? pct(d.score);
    }
  });

  // Personality Scores (OCEAN)
  const personScoreMap = { ES: 75, O: 63, Cn: 50, Ex: 50, Ag: 46 };
  const domainPerson = domains.personality || [];
  domainPerson.forEach((d) => {
    if (d.facet && (d.percentage != null || d.score != null)) {
      personScoreMap[d.facet] = d.percentage ?? pct(d.score);
    }
  });

  // Work Values Scores (Schwartz)
  const valScoreMap = { OC: 100, SE: 95, ST: 60, CO: 56 };
  const domainValues = domains.values || [];
  domainValues.forEach((d) => {
    if (d.facet && (d.percentage != null || d.score != null)) {
      valScoreMap[d.facet] = d.percentage ?? pct(d.score);
    }
  });

  // Learning Styles Scores (VARK)
  const varkScoreMap = { V: 100, Rd: 85, A: 75, K: 60 };
  const domainVark = domains.learningStyles || [];
  domainVark.forEach((d) => {
    if (d.facet && (d.percentage != null || d.score != null)) {
      varkScoreMap[d.facet] = d.percentage ?? pct(d.score);
    }
  });

  // Aptitude Scores (6 Core)
  const aptScoreMap = { Verb: 43, Log: 33, Voc: 33, Mech: 33, Spat: 15, Num: 14 };
  const domainApt = domains.aptitudes || [];
  domainApt.forEach((d) => {
    if (d.facet && (d.percentage != null || d.score != null)) {
      aptScoreMap[d.facet] = d.percentage ?? pct(d.score);
    }
  });

  const aptList = [
    { key: "Num", label: "Numerical", val: aptScoreMap.Num },
    { key: "Log", label: "Logical", val: aptScoreMap.Log },
    { key: "Verb", label: "Verbal", val: aptScoreMap.Verb },
    { key: "Voc", label: "Vocabulary", val: aptScoreMap.Voc },
    { key: "Mech", label: "Mechanical", val: aptScoreMap.Mech },
    { key: "Spat", label: "Spatial", val: aptScoreMap.Spat },
  ];

  // Dynamic Aptitude Scale calculation to prevent bars from colliding with titles
  const maxAptScore = Math.max(...aptList.map((a) => a.val || 0), 50);
  const aptScaleMax = maxAptScore > 50 ? 100 : 50;
  const aptYAxisPoints = aptScaleMax === 100 ? [100, 80, 60, 40, 20, 0] : [50, 40, 30, 20, 10, 0];

  // Report summaries must always reflect the scores returned for this attempt.
  // API items include `name`, `facet`, and either `percentage` or `score`.
  const scoreFor = (item) => Number(item?.percentage ?? pct(item?.score) ?? 0);
const rankedDomains = (items, fallbackItems, minScore = 45, labels = {}) => {
  const source = Array.isArray(items) && items.length ? items : fallbackItems;
  return source
    .map((item) => ({ ...item, name: item?.name || labels[item?.facet] }))
    .filter((item) => item.name)
    .filter((item) => scoreFor(item) > minScore)
    .sort((a, b) => scoreFor(b) - scoreFor(a));
};

 const topCareerInterests = rankedDomains(domainInterests, [
    { name: "Enterprising", percentage: interestScoreMap.E },
    { name: "Conventional", percentage: interestScoreMap.C },
    { name: "Social", percentage: interestScoreMap.S },
    { name: "Realistic", percentage: interestScoreMap.R },
    { name: "Investigative", percentage: interestScoreMap.I },
    { name: "Artistic", percentage: interestScoreMap.A },
  ], 45, { R: "Realistic", I: "Investigative", A: "Artistic", S: "Social", E: "Enterprising", C: "Conventional" });

  const topLearningStyles = rankedDomains(domainVark, [
    { name: "Visual", percentage: varkScoreMap.V },
    { name: "Reading/Writing", percentage: varkScoreMap.Rd },
    { name: "Auditory", percentage: varkScoreMap.A },
    { name: "Kinesthetic", percentage: varkScoreMap.K },
  ], 45, { V: "Visual", A: "Auditory", Rd: "Reading/Writing", K: "Kinesthetic" });

  const topWorkValues = rankedDomains(domainValues, [
    { name: "Openness to Change", percentage: valScoreMap.OC },
    { name: "Self-Enhancement", percentage: valScoreMap.SE },
    { name: "Self-Transcendence", percentage: valScoreMap.ST },
    { name: "Conservation", percentage: valScoreMap.CO },
  ], 45, { OC: "Openness to Change", SE: "Self-Enhancement", ST: "Self-Transcendence", CO: "Conservation" });

  const topAptitudes = rankedDomains(domainApt, [
    { name: "Verbal Aptitude", percentage: aptScoreMap.Verb },
    { name: "Logical Aptitude", percentage: aptScoreMap.Log },
    { name: "Vocabulary Aptitude", percentage: aptScoreMap.Voc },
    { name: "Mechanical Aptitude", percentage: aptScoreMap.Mech },
    { name: "Spatial Aptitude", percentage: aptScoreMap.Spat },
    { name: "Numerical Aptitude", percentage: aptScoreMap.Num },
  ], 45, { Num: "Numerical Aptitude", Log: "Logical Aptitude", Verb: "Verbal Aptitude", Voc: "Vocabulary Aptitude", Mech: "Mechanical Aptitude", Spat: "Spatial Aptitude" });
  const goalOrientationLabel = longPct >= shortPct ? "LONG TERM" : "SHORT TERM";
const topPersonalityTrait = [...domainPerson].sort((a, b) => scoreFor(b) - scoreFor(a))[0];
const goalOrientationSummary = Math.abs(longPct - shortPct) <= 10 ? "Balanced Planner" : (longPct > shortPct ? "Long-Term Visionary" : "Short-Term Achiever");
  // 5 Top Default fallback clusters matching the PDF
  const defaultTop5 = [
    {
      rank: 1,
      code: "BIZ",
      name: "BUSINESS & ENTREPRENEURSHIP",
      matchPercentage: 67,
      description: "Careers that build and run organisations — marketing, sales, operations, HR, startups and entrepreneurship.",
      why_fit: "You like leading, persuading and organising people and resources, and you're energised by goals, competition and building something of your own.",
      streams_and_pathways_india: "Commerce or any stream. Pathways: BBA (IPMAT/CUET), B.Com, entrepreneurship cells & competitions in school/college, MBA later.",
      careers: [
        "Marketing Manager",
        "Sales Manager",
        "Human Resource (HR) Manager",
        "Office Administrator/HR Admin",
        "Operations Manager",
        "Supply Chain Manager",
        "Retail Manager",
        "E-commerce Manager",
        "Import-Export Manager",
        "Business Analyst",
        "Entrepreneur",
        "Market Research Analyst",
        "Customer Relationship Manager",
        "Real Estate Professional",
        "Brand Consultant/Strategist",
        "Startup Program/Ecosystem Manager",
        "International Business Executive",
        "Advertising/PR Account Executive",
        "Procurement Specialist",
        "Corporate Social Responsibility Officer",
        "Risk Management Analyst",
        "Franchise Operations Manager",
      ],
    },
    {
      rank: 2,
      code: "HSP",
      name: "HOSPITALITY",
      matchPercentage: 65,
      description: "Careers that create great experiences for guests — hotels, food, travel, aviation service and events. You're energetic with people, gracious under pressure, and you enjoy organising experiences others will remember.",
      why_fit: "You're energetic with people, gracious under pressure, and you enjoy organising experiences others will remember.",
      streams_and_pathways_india: "Any stream. Pathways: NCHM JEE for hotel management, culinary institutes, aviation/cabin crew training after Class 12, event management degrees.",
      careers: [
        "Hotel/Resort Manager",
        "Front Office/Guest Relations/Housekeeping Manager",
        "Restaurant/Cloud Kitchen /Catering Manager",
        "Chef/Culinary Specialist",
        "Baker",
        "Bartender",
        "Butler",
        "Event/Wedding Planner",
        "Tour/Travel Consultant",
        "Tour Guide",
        "Cruise Manager",
        "Cabin Crew (Air Hostess/Flight Steward)",
        "Airline Ground Staff / Airport Operations Staff",
        "Sommelier",
        "Hospitality Sales/Revenue Manager",
        "Theme Park/Attraction Manager",
        "Club/Recreation Manager",
        "Spa Operations Manager",
        "Food and Beverage Director",
        "Adventure Tourism Coordinator",
        "Travel Blogger/Content Creator",
        "Ecotourism Developer",
      ],
    },
    {
      rank: 3,
      code: "SPT",
      name: "SPORTS & ATHLETICS",
      matchPercentage: 65,
      description: "Careers in and around the game — playing, coaching, sports science, analysis and sports media. You're physically driven and competitive, you train with discipline, and you perform best when the pressure is highest.",
      why_fit: "You're physically driven and competitive, you train with discipline, and you perform best when the pressure is highest.",
      streams_and_pathways_india: "Any stream. Pathways: sports quotas and academies, B.P.Ed / physical education, sports science degrees, SAI schemes; for sports media/analytics combine with mass comm or data skills.",
      careers: [
        "Professional Athlete & Coach",
        "Professional Player",
        "Sports Coach/Trainer",
        "Physical Education Teacher",
        "Sports Physiotherapist",
        "Sports Nutritionist",
        "Sports Psychologist",
        "Sports Management / Administrator",
        "Sports Analyst/Data Scout",
        "Referee",
        "Umpire",
        "Sports Journalist/Broadcaster",
        "Fitness/Strength & Conditioning Coach",
        "Sports Equipment Manager",
        "Sports Event Coordinator",
        "Armed Forces Sports Instructor",
        "Outdoor Adventure Instructor",
        "Esports Coach/Player",
        "Rehabilitation Specialist",
        "Sports Marketing Manager",
      ],
    },
    {
      rank: 4,
      code: "GOV",
      name: "GOVERNMENT, LAW & PUBLIC POLICY",
      matchPercentage: 63,
      description: "Careers that run the country and uphold the law — civil services, law, judiciary, policy and regulation. You're disciplined and dutiful, strong in language and reasoning, and you respect systems — with the ambition to serve and lead within them.",
      why_fit: "You're disciplined and dutiful, strong in language and reasoning, and you respect systems — with the ambition to serve and lead within them.",
      streams_and_pathways_india: "Any stream. Pathways: sports quotas and academies, B.P.Ed / physical education, sports science degrees, SAI schemes; for sports media/analytics combine with mass comm or data skills.",
      careers: [
        "Civil Servant (IAS, IPS, IFS) / Bureaucrat",
        "Public Policy Analyst",
        "Lawyer/Advocate (Litigation, Corporate, IP, Cyber)",
        "Judge/Judicial Magistrate",
        "Diplomat / Foreign Affairs Officer",
        "Legislative Assistant",
        "Defence/Armed Forces Officer (Army, Navy, Air Force)",
        "Paramilitary/Police Officer (CAPF)",
        "Intelligence/Security Analyst",
        "Legal Consultant / Corporate Counsel",
        "Municipal / Urban Governance Officer",
        "Tax/Revenue Officer",
        "Customs and Excise Officer",
        "Passport Officer",
        "BDO",
        "Tahasildar",
        "BMC Officer",
        "DEO",
        "Food Safety Officer",
        "Cyber Crime Officer",
        "Banker",
        "Rural Development Officer",
      ],
    },
    {
      rank: 5,
      code: "PSF",
      name: "PERSONAL SERVICES & FREELANCE",
      matchPercentage: 62,
      description: "Careers built on personal skill and client relationships — fitness, styling, coaching, wellness, freelancing. You connect easily one-on-one, you have a sense of style or wellbeing you love sharing, and independence matters to you.",
      why_fit: "You connect easily one-on-one, you have a sense of style or wellbeing you love sharing, and independence matters to you.",
      streams_and_pathways_india: "Any stream. Pathways: certified courses (fitness, cosmetology, yoga — e.g., YCB), apprenticeships with professionals, building a client portfolio early.",
      careers: [
        "Cosmetologist (Hair stylist/Makeup Artist/Nail Artist)",
        "Fashion Stylist",
        "Image Consultant",
        "Personal Shopper/Wardrobe Consultant",
        "Fitness/Personal Trainer",
        "Yoga/Zumba/Aerobics Instructor",
        "Nutrition Coach",
        "Life Coach",
        "Career Coach",
        "Personal Assistant/Executive",
        "Private Concierge",
        "Event Emcee/Host",
        "Voice Artist",
        "Pet Groomer/Trainer",
        "Tattoo/Body Piercing Artist",
        "Spa/Massage Therapist",
        "Celebrity Manager",
        "Home Organizer/Declutter Consultant",
        "Freelance Photographer/Videographer",
        "Wedding Planner",
      ],
    },
  ];

  const rawTop5 =
    report.careerClusters?.top5 ||
    rawData.careerClusters?.top5 ||
    rawData.top5Clusters ||
    [];

  const rawTopCluster =
    report.careerClusters?.topCluster ||
    rawData.careerClusters?.topCluster ||
    rawData.topCluster ||
    (rawTop5.length > 0 ? rawTop5[0] : null);

  const clusterMap = (CLUSTERS || []).reduce((acc, c) => {
    if (c.cluster_id) acc[c.cluster_id.toUpperCase()] = c;
    if (c.name) acc[c.name.toUpperCase()] = c;
    if (c.mastersheet_name) acc[c.mastersheet_name.toUpperCase()] = c;
    return acc;
  }, {});

  const getClusterMeta = (codeOrName) => {
    if (!codeOrName) return {};
    const key = String(codeOrName).trim().toUpperCase();
    return (
      clusterMap[key] ||
      (CLUSTERS || []).find(
        (c) =>
          c.cluster_id?.toUpperCase() === key ||
          c.name?.toUpperCase() === key ||
          c.mastersheet_name?.toUpperCase() === key
      ) ||
      {}
    );
  };

  const mapClusterItem = (item, idx, defaultFallback) => {
    const fallback = defaultFallback || defaultTop5[idx % defaultTop5.length];
    const code = item?.code || item?.cluster_id || item?.clusterId || fallback?.code;
    const meta = getClusterMeta(code) || getClusterMeta(item?.name || item?.cluster) || {};

    let careersList = [];
    if (Array.isArray(item?.careers) && item.careers.length > 0) {
      careersList = item.careers;
    } else if (Array.isArray(meta?.careers) && meta.careers.length > 0) {
      careersList = meta.careers;
    } else if (Array.isArray(fallback?.careers) && fallback.careers.length > 0) {
      careersList = fallback.careers;
    }

    return {
      rank: idx + 1,
      code,
      name: (item?.name || item?.cluster || meta?.name || fallback?.name || "").toUpperCase(),
      matchPercentage: item?.matchPercentage ?? item?.match ?? fallback?.matchPercentage ?? 60,
      description: item?.description || meta?.description || fallback?.description || "",
      why_fit: item?.why_fit || item?.whyFit || meta?.why_fit || fallback?.why_fit || "",
      streams_and_pathways_india:
        item?.streams_and_pathways_india ||
        item?.streamsAndPathwaysIndia ||
        item?.pathways ||
        meta?.streams_and_pathways_india ||
        fallback?.streams_and_pathways_india ||
        "",
      careers: careersList,
    };
  };

  const top5Clusters = (rawTop5.length > 0 ? rawTop5 : defaultTop5).slice(0, 5).map((item, idx) => {
    return mapClusterItem(item, idx, defaultTop5[idx % defaultTop5.length]);
  });

  // Ensure top5Clusters always has at least 5 elements
  while (top5Clusters.length < 5) {
    const idx = top5Clusters.length;
    top5Clusters.push(mapClusterItem(defaultTop5[idx], idx, defaultTop5[idx]));
  }

  const topCluster = rawTopCluster
    ? mapClusterItem(rawTopCluster, 0, top5Clusters[0])
    : top5Clusters[0];

  return (
    <div className="report-app-container">
      {/* Floating Action Bar (Hidden on Print) */}
      <div className="report-action-bar no-print">
        <div className="report-action-bar-inner">
          <div className="flex items-center gap-3">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/app/assessment")}
              className="rounded-full font-bold"
            >
              Assessments
            </Button>
            <Select
              defaultValue="page-1"
              style={{ width: 230 }}
              onChange={scrollToPage}
              options={[
                { value: "page-1", label: "Page 1: Cover Page" },
                { value: "page-2", label: "Page 2: Declaration" },
                { value: "page-3", label: "Page 3: Your Profiling" },
                { value: "page-4", label: "Page 4: Introduction" },
                { value: "page-5", label: "Page 5: Interest Overview" },
                { value: "page-6", label: "Page 6: Interest Details (01-03)" },
                { value: "page-7", label: "Page 7: Interest Details (04-06)" },
                { value: "page-8", label: "Page 8: Interest Scores" },
                { value: "page-9", label: "Page 9: Personality Overview" },
                { value: "page-10", label: "Page 10: Personality Suggestions" },
                { value: "page-11", label: "Page 11: Personality Scores" },
                { value: "page-12", label: "Page 12: Learning Styles" },
                { value: "page-13", label: "Page 13: Learning Details (01-02)" },
                { value: "page-14", label: "Page 14: Learning Details (03-04)" },
                { value: "page-15", label: "Page 15: Learning Style Scores" },
                { value: "page-16", label: "Page 16: Work Values" },
                { value: "page-17", label: "Page 17: Work Values Suggestions" },
                { value: "page-18", label: "Page 18: Work Values Scores" },
                { value: "page-19", label: "Page 19: Goal Orientation (Short)" },
                { value: "page-20", label: "Page 20: Goal Orientation (Long)" },
                { value: "page-21", label: "Page 21: Aptitude Overview" },
                { value: "page-22", label: "Page 22: Aptitude (Numerical)" },
                { value: "page-23", label: "Page 23: Aptitude (Logical/Verbal)" },
                { value: "page-24", label: "Page 24: Aptitude (Voc/Mech)" },
                { value: "page-25", label: "Page 25: Aptitude (Spatial)" },
                { value: "page-26", label: "Page 26: Aptitude Scores" },
                { value: "page-27", label: "Page 27: Top Cluster #1" },
                { value: "page-28", label: "Page 28: Clusters #2 & #3" },
                { value: "page-29", label: "Page 29: Clusters #4 & #5" },
                { value: "page-30", label: "Page 30: Study & Pathway Advice" },
                { value: "page-31", label: "Page 31: Complete Career Map" },
                { value: "page-32", label: "Page 32: About Career Map" },
              ]}
            />
          </div>

          <div className="flex items-center gap-2.5">
           <button
  onClick={() => window.print()}
  className="px-4 py-2 text-white rounded-lg font-semibold flex items-center gap-2 shadow no-print cursor-pointer transition-colors"
  style={{ backgroundColor: "#9A2119" }}
>
  Print Report (PDF)
</button>
          </div>
        </div>
      </div>

      {/* Main Document: Exactly 32 Pages */}
      <div className="pdf-pages-wrapper">
        {/* ============================================================
            PAGE 1: COVER PAGE
        ============================================================ */}
        <div className="pdf-page relative overflow-hidden flex flex-col justify-between" id="page-1">
          {/* Top Left Geometric Graphics matching Reference 2nd Image */}
          <div className="absolute top-0 left-0 w-44 h-44 pointer-events-none z-0">
            {/* Dark maroon corner block */}
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-[#8C1814] rounded-br-[42px] rotate-[10deg]"></div>
            {/* White separator line */}
            <div className="absolute top-5 -left-10 w-40 h-40 border-t-[4px] border-white rounded-[36px] rotate-45"></div>
            {/* Dusty rose / mauve rounded block */}
            <div className="absolute top-1 -left-10 w-36 h-36 bg-[#B88884] rounded-[32px] rotate-45 opacity-95"></div>
          </div>
          {/* Light grey floating diamond */}
          <div className="absolute top-10 left-28 w-[76px] h-[76px] bg-[#D6DADC] rounded-2xl rotate-45 pointer-events-none z-0"></div>
          {/* Orange outlined diamond */}
          <div className="absolute top-32 left-8 w-[105px] h-[105px] border-[3.5px] border-[#EDA757] rounded-2xl rotate-45 pointer-events-none z-10"></div>

          {/* Top Section */}
          <div className="z-10">
            {/* Top Right Logo */}
            <div className="flex justify-end pt-1 pr-1">
              <img
                src={Logo}
                alt="CareerMap Logo"
                className="h-11 w-auto object-contain"
              />
            </div>

            {/* Main Title Section */}
            <div className="mt-6 text-center">
              <h1 className="text-[44px] font-black text-[#8C1814] tracking-tight leading-[1.05] uppercase">
                CAREER<br/>PSYCHOMETRIC
              </h1>
              <div className="mt-2 text-lg font-bold tracking-[0.24em] text-[#8C1814] uppercase">
                ASSESSMENT REPORT
              </div>
            </div>

            {/* Full-width Warm Blush Beige Strip */}
            <div className="w-[calc(100%+96px)] -ml-12 mt-5 py-3.5 bg-[#F8ECE8] text-center text-[#2B2D33] text-lg font-normal leading-snug">
              Discover Your True Strengths and Potential.
            </div>
          </div>

          {/* Center Graphic: Large Hero 3D Brain Illustration matching 2nd Image */}
          <div className="my-auto py-1 text-center flex justify-center items-center z-10">
            <img
              src={ReportImg9}
              alt="Career Assessment 3D Brain"
              className="w-[430px] h-[390px] max-w-full object-contain mx-auto drop-shadow-sm"
            />
          </div>

          {/* Bottom Left Student Info matching 2nd Image */}
          <div className="z-10 pb-4">
            <div className="inline-block bg-[#F6E8E4] text-[#1E232A] px-3.5 py-1 rounded font-bold text-xs mb-2.5">
              Student Information
            </div>
            <div className="space-y-1.5 text-[14.5px] text-[#2D3748] leading-normal">
              <div><span className="font-normal text-[#374151]">Name:</span> <span className="font-semibold text-[#111827] ml-1.5">{studentName}</span></div>
              <div><span className="font-normal text-[#374151]">Class:</span> <span className="font-semibold text-[#111827] ml-1.5">{studentClass}</span></div>
               <div><span className="font-normal text-[#374151]">Date:</span> <span className="font-semibold text-[#111827] ml-1.5">{formattedDate}</span></div>
              <div><span className="font-normal text-[#374151]">Email Id:</span> <span className="font-semibold text-[#111827] ml-1.5">{studentEmail}</span></div>
              <div><span className="font-normal text-[#374151]">Phone No:</span> <span className="font-semibold text-[#111827] ml-1.5">{studentPhone}</span></div>
            </div>
          </div>

          {/* Bottom Right Decorative Shapes matching Reference 2nd Image */}
{/* Page container must be `relative overflow-hidden` */}
<div className="absolute bottom-0 right-0 w-[340px] h-[340px] overflow-hidden pointer-events-none">
  {/* dark red square (corner) */}
  <div className="absolute -right-[75px] -bottom-[75px] w-[190px] h-[190px] bg-[#8C1814] rounded-[40px] rotate-45 z-0" />

  {/* soft pink square overlapping the red */}
  <div className="absolute -right-[20px] bottom-[15px] w-[150px] h-[150px] bg-[#E8B4B0]/70 rounded-[40px] rotate-45 z-10" />

  {/* grey square, closer to the pink one */}
  <div className="absolute right-[135px] bottom-[40px] w-[90px] h-[90px] bg-[#D6DADC] rounded-2xl rotate-45 z-10" />

  {/* orange outline, closer to the pink one */}
  <div className="absolute right-[40px] bottom-[160px] w-[120px] h-[120px] border-[3.5px] border-[#EDA757] rounded-[28px] rotate-45 z-10" />
</div>
 </div>

        {/* ============================================================
            PAGE 2: DECLARATION
        ============================================================ */}
        <div className="pdf-page" id="page-2">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <TitlePill title="DECLARATION" />

            <div className="text-base font-bold text-[#1E232A] mb-3">
              Dear {studentFirstName},
            </div>

            <div className="space-y-3.5 text-[0.9rem] leading-relaxed text-[#374151]">
              <p>
                Thank you for choosing CareerMap for your Career Psychometric Assessment.
              </p>
              <p>
                We appreciate your trust in our assessment process and recognize the importance of making informed educational and career decisions. This report has been prepared based on your responses to scientifically designed psychometric assessments and is intended to provide meaningful insights into your <strong className="font-bold text-[#1E232A]">aptitude, personality, interests and career preferences</strong>.
              </p>
              <p>
                The recommendations and observations presented in this report are designed to help you better understand your strengths, explore suitable career pathways, and make well-informed academic and professional choices. While every effort has been made to ensure the reliability and accuracy of the assessment, this report should be considered a decision-support tool and not the sole basis for any educational or career decision.
              </p>
              <p>
                CareerMap is committed to providing evidence-based career guidance that empowers individuals to achieve their goals with confidence. We encourage you to use this report as a foundation for self-discovery and future planning. For the best outcomes, we recommend discussing the report with a certified career counsellor who can help interpret the results in the context of your aspirations, abilities, and opportunities.
              </p>
              <p>
                We sincerely thank you for placing your trust in CareerMap and wish you every success in your educational and professional journey.
              </p>
            </div>

            <div className="mt-6 text-sm">
              <div className="font-semibold text-[#4B5563]">Best Wishes,</div>
              <div className="font-bold text-[#1E232A] text-base">Team CareerMap</div>
            </div>
          </div>

          <PageFooter pageNum={2} />
        </div>

        {/* ============================================================
            PAGE 3: YOUR PROFILING (PERSONAL PROFILING)
        ============================================================ */}
        <YourProfilingReport
          profilingData={yourProfiling}
          studentFirstName={studentFirstName}
          PageHeader={PageHeader}
          PageFooter={PageFooter}
          TitlePill={TitlePill}
          pageNum={3}
        />

        {/* ============================================================
            PAGE 4: INTRODUCTION (WHEEL / BULB DIAGRAM)
        ============================================================ */}
        <div className="pdf-page" id="page-4">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <TitlePill title="INTRODUCTION" />

            <p className="page-lead-text">
              The report presented by Career Map outlines key observations about <strong className="text-[#1E232A] font-bold">{studentName}</strong>’s personality profile, career interests, work preferences, cognitive strengths, and future career orientation. These outcomes are indicative, not definitive, and must be reviewed again in subsequent counselling meetings. Recommendations may shift based on deeper interaction and continuous assessment.
            </p>

            {/* Central Lightbulb + 6 Surrounding Petal Badges matching PDF Page 3 */}
            <div className="flex-1 py-2 flex justify-center items-center">
              <img
                src={ReportImg1}
                alt="Introduction Wheel"
                className="max-h-[500px] w-auto max-w-[540px] mx-auto object-contain"
              />
            </div>
          </div>

          <PageFooter pageNum={4} />
        </div>

        {/* ============================================================
            PAGE 5: INTEREST OVERVIEW (CONCENTRIC RIASEC MODEL)
        ============================================================ */}
        <div className="pdf-page" id="page-5">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <TitlePill title="INTEREST" />

            <p className="page-lead-text">
              Your interests are the areas and activities that naturally capture your attention, curiosity, and motivation. They go beyond hobbies and point to the type of work where you will feel engaged and satisfied. The RIASEC model outlines six interest areas—Realistic, Investigative, Artistic, Social, Enterprising, and Conventional—each reflecting different strengths and preferences. Most individuals show a combination of these. Understanding your interest profile helps you explore careers that align with what inspires you, making work more enjoyable, learning more natural, and success more fulfilling.
            </p>

            <div className="text-center font-bold text-base text-[#1E232A] mb-1">
              RIASEC Model
            </div>

            {/* Concentric RIASEC Rings Diagram matching PDF */}
            <div className="flex-1 py-2 flex justify-center items-center">
              <img
                src={ReportImg2}
                alt="RIASEC Model"
                className="max-h-[440px] w-full max-w-[620px] mx-auto object-contain"
              />
            </div>
          </div>

          <PageFooter pageNum={5} />
        </div>

        {/* ============================================================
            PAGE 6: INTEREST DETAILS (01 - 03)
        ============================================================ */}
        <div className="pdf-page" id="page-6">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body space-y-3.5">
            {/* 01 ENTERPRISING */}
            <div className="detail-card-row">
              <div className="detail-card-left-badge">
                <span className="detail-card-num-circle">01</span>
                <span>ENTERPRISING</span>
              </div>
              <div className="detail-card-right-body">
                <div className="detail-card-desc">
                  You are naturally confident, assertive, and persuasive. You enjoy leadership roles and are driven by goals, success, and influence. You're often seen as energetic, ambitious, and socially bold.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Leadership, persuasion, risk-taking, initiative.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Selling, managing people, public speaking, leading projects.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Fast-paced, entrepreneurial, competitive, leadership-driven.</div>
              </div>
            </div>

            {/* 02 CONVENTIONAL */}
            <div className="detail-card-row">
              <div className="detail-card-left-badge">
                <span className="detail-card-num-circle">02</span>
                <span>CONVENTIONAL</span>
              </div>
              <div className="detail-card-right-body">
                <div className="detail-card-desc">
                  You're an organizer — you like order, accuracy, records, plans and numbers, and people can rely on you to keep things on track.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Organized, systematic, reliable, efficient, detail-oriented.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Managing records, organising information, maintaining schedules, accounting, clerical work, following procedures.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Structured, orderly, rule-based, organized, administrative.</div>
              </div>
            </div>

            {/* 03 SOCIAL */}
            <div className="detail-card-row">
              <div className="detail-card-left-badge">
                <span className="detail-card-num-circle">03</span>
                <span>SOCIAL</span>
              </div>
              <div className="detail-card-right-body">
                <div className="detail-card-desc">
                  You care deeply about helping others and building meaningful interpersonal relationships. You are empathetic, cooperative, and emotionally intelligent.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Caring, supportive, trustworthy, socially responsible.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Teaching, counselling, mentoring, serving others.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Collaborative, service-oriented, people-focused.</div>
              </div>
            </div>
          </div>

          <PageFooter pageNum={6} />
        </div>

        {/* ============================================================
            PAGE 7: INTEREST DETAILS (04 - 06)
        ============================================================ */}
        <div className="pdf-page" id="page-7">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body space-y-3.5">
            {/* 04 REALISTIC */}
            <div className="detail-card-row">
              <div className="detail-card-left-badge">
                <span className="detail-card-num-circle">04</span>
                <span>REALISTIC</span>
              </div>
              <div className="detail-card-right-body">
                <div className="detail-card-desc">
                  You are action-oriented, practical, and grounded. You prefer working with your hands, tools, and tangible objects rather than abstract ideas. You find satisfaction in seeing concrete results from your efforts.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Practical, reliable, hands-on, straightforward, persistent.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Building, repairing, operating machinery, working outdoors.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Structured, physical, outdoorsy, task-focused.</div>
              </div>
            </div>

            {/* 05 INVESTIGATIVE */}
            <div className="detail-card-row">
              <div className="detail-card-left-badge">
                <span className="detail-card-num-circle">05</span>
                <span>INVESTIGATIVE</span>
              </div>
              <div className="detail-card-right-body">
                <div className="detail-card-desc">
                  You are curious, analytical, and intellectually driven. You enjoy exploring ideas, solving complex problems, and understanding how things work through observation, research, and critical thinking.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Analytical, curious, logical, observant, independent.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Research, experimentation, data analysis, solving puzzles, scientific inquiry, learning new concepts.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Research-oriented, intellectually stimulating, independent, evidence-based, problem-solving focused.</div>
              </div>
            </div>

            {/* 06 ARTISTIC */}
            <div className="detail-card-row">
              <div className="detail-card-left-badge">
                <span className="detail-card-num-circle">06</span>
                <span>ARTISTIC</span>
              </div>
              <div className="detail-card-right-body">
                <div className="detail-card-desc">
                  You enjoy creative activities from time to time and appreciate originality, even if creating isn't your central passion.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Creative, imaginative, expressive, original, intuitive.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Drawing, writing, music, performing arts, designing, storytelling, photography.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Creative, flexible, open-minded, innovative, self-directed.</div>
              </div>
            </div>
          </div>

          <PageFooter pageNum={7} />
        </div>

        {/* ============================================================
            PAGE 8: VISUAL REPRESENTATION (INTERESTS)
        ============================================================ */}
        <div className="pdf-page" id="page-8">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <div className="score-rep-banner">
              <div className="score-rep-banner-circle"></div>
              <span>VISUAL REPRESENTATION OF YOUR SCORE</span>
            </div>

            {/* Horizontal Bar Chart with Vertical Grid Lines matching PDF */}
            <div className="h-bar-chart-container">
              <div className="h-bar-chart-grid-area">
                <div className="h-bar-grid-lines">
                  <div className="h-bar-grid-line"></div>
                  <div className="h-bar-grid-line"></div>
                  <div className="h-bar-grid-line"></div>
                  <div className="h-bar-grid-line"></div>
                  <div className="h-bar-grid-line"></div>
                  <div className="h-bar-grid-line"></div>
                </div>

                <div className="h-bar-rows-wrapper">
                  {[
                    { label: "Enterprising", val: interestScoreMap.E },
                    { label: "Conventional", val: interestScoreMap.C },
                    { label: "Social", val: interestScoreMap.S },
                    { label: "Realistic", val: interestScoreMap.R },
                    { label: "Investigative", val: interestScoreMap.I },
                    { label: "Artistic", val: interestScoreMap.A },
                  ].map((item) => (
                    <div key={item.label} className="h-bar-row">
                      <div className="h-bar-label">{item.label}</div>
                      <div className="h-bar-track">
                        <div className="h-bar-fill" style={{ width: `${item.val}%` }}></div>
                      </div>
                      <div className="h-bar-val">{item.val}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom X-Axis Numbers matching PDF */}
              <div className="h-bar-bottom-axis">
                <span>0</span>
                <span>20</span>
                <span>40</span>
                <span>60</span>
                <span>80</span>
                <span>100</span>
              </div>
            </div>

            {/* Top Career Interests Section */}
            <div className="top-interests-box">
              <div className="score-rep-banner">
                <div className="score-rep-banner-circle"></div>
                <span>YOUR TOP CAREER INTERESTS ARE</span>
              </div>
              <div className="top-interests-pills-grid">
                {topCareerInterests.map((interest) => (
                  <div key={interest.facet || interest.name} className="top-interest-pill">
                    {interest.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <PageFooter pageNum={8} />
        </div>

        {/* ============================================================
            PAGE 9: PERSONALITY OVERVIEW (STACKED STEPS DIAGRAM)
        ============================================================ */}
        <div className="pdf-page" id="page-9">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <TitlePill title="PERSONALITY" colorClass="green" />

            <p className="page-lead-text">
              Your personality is the blend of traits that shape how you think, feel, and behave. It influences how you solve problems, build relationships, manage stress, and respond to opportunities. The Big Five model describes personality through five dimensions: Openness (curiosity and creativity), Conscientiousness (discipline and responsibility), Extraversion (energy and sociability), Agreeableness (cooperation and empathy), and Emotional Stability (resilience under pressure). Each trait offers strengths, and different careers may suit different combinations.
            </p>
            <p className="page-lead-text">
              For example, conscientious individuals may excel in structured roles, while those high in openness may thrive in creative or innovative environments. Understanding your personality helps you choose careers that align with your natural style and identify areas for growth, making it easier to collaborate effectively and feel at ease in your work.
            </p>

            {/* 5-Tier Inverted Trapezoid Pyramid Stack matching PDF Page 8 */}
            <div className="flex-1 py-2 flex justify-center items-center">
              <img
                src={ReportImg3}
                alt="Big Five Personality"
                className="max-h-[380px] w-full max-w-[600px] mx-auto object-contain"
              />
            </div>
          </div>

          <PageFooter pageNum={9} />
        </div>

        {/* ============================================================
            PAGE 10: PERSONALITY SUGGESTIONS
        ============================================================ */}
        <div className="pdf-page" id="page-10">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body space-y-3">
           {[
  { facet: "ES", num: "01", name: "EMOTIONAL STABILITY", text: "You stay calm and steady under pressure — a major asset for high-stakes fields like defence, medicine, aviation and competitive exams.", devText: "Pressure situations tend to affect you more than most — building calming routines before high-stakes moments (exams, interviews) can help a lot." },
  { facet: "O", num: "02", name: "OPENNESS", text: "You balance curiosity with practicality — open to new ideas, while valuing what already works." },
  { facet: "Cn", num: "03", name: "CONSCIENTIOUSNESS", text: "You're reasonably organised and dependable, finishing what matters even if some tasks slip." },
  { facet: "Ex", num: "04", name: "EXTRAVERSION", text: "You're an ambivert — comfortable both in groups and working alone, adapting to what the situation needs.", devText: "You tend to recharge better alone or in small groups than in large social settings — that's a strength in focused, independent work." },
  { facet: "Ag", num: "05", name: "AGREEABLENESS", text: "You cooperate well while still holding your own views — a healthy balance for teamwork and fair decisions." },
].map((item) => {
  const d = domainPerson.find((x) => x.facet === item.facet);
  const bandLabel = (d?.bandLabel || "Moderate").toUpperCase();
  const displayText = bandLabel === "DEVELOPING" && item.devText ? item.devText : item.text;
  return (
    <div key={item.num} className="trait-card-row">
      <div className="trait-card-left">
        <div className="trait-card-badge">
          <span className="detail-card-num-circle">{item.num}</span>
          <span>{item.name}</span>
        </div>
        <div className={`trait-card-band ${bandLabel === "HIGH" ? "high" : bandLabel === "DEVELOPING" ? "developing" : "moderate"}`}>
          {bandLabel}
        </div>
      </div>
      <div className="trait-card-right-body">
        <div>{displayText}</div>
      </div>
    </div>
  );
})}
          </div>

          <PageFooter pageNum={10} />
        </div>

        {/* ============================================================
            PAGE 11: VISUAL REPRESENTATION (PERSONALITY)
        ============================================================ */}
        <div className="pdf-page" id="page-11">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <div className="score-rep-banner green">
              <div className="score-rep-banner-circle"></div>
              <span>VISUAL REPRESENTATION OF YOUR SCORE</span>
            </div>

            {/* Horizontal Green Bar Chart matching PDF */}
            <div className="h-bar-chart-container">
              <div className="h-bar-chart-grid-area">
                <div className="h-bar-grid-lines">
                  <div className="h-bar-grid-line"></div>
                  <div className="h-bar-grid-line"></div>
                  <div className="h-bar-grid-line"></div>
                  <div className="h-bar-grid-line"></div>
                  <div className="h-bar-grid-line"></div>
                </div>

                <div className="h-bar-rows-wrapper">
                  {[
                    { label: "EMOTIONAL STABILITY", val: personScoreMap.ES },
                    { label: "OPENNESS", val: personScoreMap.O },
                    { label: "CONSCIENTIOUSNESS", val: personScoreMap.Cn },
                    { label: "EXTRAVERSION", val: personScoreMap.Ex },
                    { label: "AGREEABLENESS", val: personScoreMap.Ag },
                  ].map((item) => (
                    <div key={item.label} className="h-bar-row">
                      <div className="h-bar-label text-xs sm:text-sm">{item.label}</div>
                      <div className="h-bar-track">
                        <div className="h-bar-fill green" style={{ width: `${item.val}%` }}></div>
                      </div>
                      <div className="h-bar-val">{item.val}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom X-Axis Numbers: 0, 20, 40, 60, 80 */}
              <div className="h-bar-bottom-axis">
                <span>0</span>
                <span>20</span>
                <span>40</span>
                <span>60</span>
                <span>80</span>
              </div>
            </div>

            {/* Bottom Callout Box matching PDF */}
           {/* Bottom Callout Box matching PDF - now dynamic based on top trait */}
<div className="mt-8 p-4 bg-[#CFE0CB] border border-[#BAD0B5] rounded-xl text-sm leading-relaxed text-[#1E232A]">
  {topPersonalityTrait?.facet === "ES" &&
    "Emotional Stability is the positive side of the Neuroticism scale — a higher score means you stay calmer under pressure."}
  {topPersonalityTrait?.facet === "O" &&
    "Openness reflects your curiosity and appetite for new ideas — a higher score means you enjoy exploring novel approaches and perspectives."}
  {topPersonalityTrait?.facet === "Cn" &&
    "Conscientiousness reflects discipline and reliability — a higher score means you're organised, dependable, and follow through on commitments."}
  {topPersonalityTrait?.facet === "Ex" &&
    "Extraversion reflects your energy in social settings — a higher score means you gain energy from being around people and enjoy interaction."}
  {topPersonalityTrait?.facet === "Ag" &&
    "Agreeableness reflects cooperation and empathy — a higher score means you value harmony and consider others' feelings in decisions."}
</div>
          </div>

          <PageFooter pageNum={11} />
        </div>

        {/* ============================================================
            PAGE 12: LEARNING STYLE OVERVIEW
        ============================================================ */}
        <div className="pdf-page" id="page-12">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <TitlePill title="LEARNING STYLE" colorClass="lavender" />

            <p className="page-lead-text">
              Everyone has a preferred way of learning, and knowing your style can make studying, training, and working much more effective. The VARK model highlights four main preferences: Visual learners understand best through charts, diagrams, and images; Auditory learners grasp information by listening, discussing, and explaining; Reading/Writing learners prefer text, lists, and notes; and Kinesthetic learners learn by doing, experiencing, and applying knowledge practically.
            </p>
            <p className="page-lead-text">
              While everyone can learn in all ways, most people have one or two stronger preferences. Recognizing your learning style helps you study smarter, prepare better for exams, and even choose careers that align with how you absorb and process information. For instance, a kinesthetic learner may feel more comfortable in hands-on professions, while a visual learner may enjoy design or engineering.
            </p>
            <p className="page-lead-text">
              Knowing your learning style empowers you to adapt your strategies in school and at work, making learning feel more natural and less stressful.
            </p>

            {/* Target Board Diagram matching PDF Page 11 */}
            <div className="flex-1 py-2 flex justify-center items-center">
              <img
                src={ReportImg4}
                alt="Learning Styles VARK"
                className="max-h-[380px] w-full max-w-[590px] mx-auto object-contain"
              />
            </div>
          </div>

          <PageFooter pageNum={12} />
        </div>

        {/* ============================================================
            PAGE 13: LEARNING STYLE DETAILS (01 - 02)
        ============================================================ */}
        <div className="pdf-page" id="page-13">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body space-y-4">
            <div className="detail-card-row">
              <div className="detail-card-left-badge lavender">
                <span className="detail-card-num-circle">01</span>
                <span>VISUAL</span>
              </div>
              <div className="detail-card-right-body lavender">
                <div className="detail-card-desc">
                  You prefer to learn via images, diagrams, flow charts, maps, symbolic representations. You benefit from seeing the structure, patterns, shapes, relationships.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Grasping spatial or structural relationships; memory aided by imagery; organising information visually.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Using flowcharts, infographics, videos, colorcoded notes, visual organizers, and symbolic representations to study or plan.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Learning spaces that use visual aids, presentations, digital whiteboards, concept maps, and multimedia tools — classrooms or workplaces where design, structure, and visual clarity are valued.</div>
              </div>
            </div>

            <div className="detail-card-row">
              <div className="detail-card-left-badge lavender">
                <span className="detail-card-num-circle">02</span>
                <span>AUDITORY</span>
              </div>
              <div className="detail-card-right-body lavender">
                <div className="detail-card-desc">
                  You learn through listening and speaking. Explaining ideas aloud helps you process them deeply. You benefit from discussions, storytelling, and audio recordings. You thrive in environments where oral communication is valued — such as teaching, counselling, performing, or team collaboration.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Expressive, articulate, and sensitive to tone and rhythm. You learn best through listening, discussion, and verbal explanation. You may remember information better when it’s heard rather than read.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Participating in group discussions, lectures, podcasts, debates, or reading aloud. You often recall not just what was said, but how it was said.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Interactive classrooms, seminars, or workplaces that encourage open conversation, brainstorming, and verbal feedback.</div>
              </div>
            </div>
          </div>

          <PageFooter pageNum={13} />
        </div>

        {/* ============================================================
            PAGE 14: LEARNING STYLE DETAILS (03 - 04)
        ============================================================ */}
        <div className="pdf-page" id="page-14">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body space-y-4">
            <div className="detail-card-row">
              <div className="detail-card-left-badge lavender">
                <span className="detail-card-num-circle">03</span>
                <span>READING/WRITING</span>
              </div>
              <div className="detail-card-right-body lavender">
                <div className="detail-card-desc">
                  You learn through listening and speaking. Explaining ideas aloud helps you process them deeply. You benefit from discussions, storytelling, and audio recordings. You thrive in environments where oral communication is valued — such as teaching, counselling, performing, or team collaboration.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Expressive, articulate, and sensitive to tone and rhythm. You learn best through listening, discussion, and verbal explanation. You may remember information better when it's heard rather than read.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Participating in group discussions, lectures, podcasts, debates, or reading aloud. You often recall not just what was said, but how it was said.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Interactive classrooms, seminars, or workplaces that encourage open conversation, brainstorming, and verbal feedback.</div>
              </div>
            </div>

            <div className="detail-card-row">
              <div className="detail-card-left-badge lavender">
                <span className="detail-card-num-circle">04</span>
                <span>KINAESTHETIC</span>
              </div>
              <div className="detail-card-right-body lavender">
                <div className="detail-card-desc">
                  You learn through experience. Abstract ideas make sense when you can do something with them. You thrive when allowed to experiment, observe, and apply. This learning style supports success in applied fields like engineering, design, healthcare, sports, and performing arts anywhere learning connects mind and body.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Hands-on, practical, and experiential. You grasp concepts through physical movement, real-life examples, and direct engagement. You like “learning by doing” rather than only reading or listening.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Experiments, demonstrations, simulations, field visits, role plays, or building and testing ideas. You prefer tactile engagement and movement during learning.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Interactive, activity-based settings workshops, labs, studios, or outdoor spaces - where theory connects directly with practice.</div>
              </div>
            </div>
          </div>

          <PageFooter pageNum={14} />
        </div>

        {/* ============================================================
            PAGE 14: VISUAL REPRESENTATION (LEARNING STYLES)
        ============================================================ */}
        {/* ============================================================
            PAGE 15: VISUAL REPRESENTATION (LEARNING STYLES)
        ============================================================ */}
        <div className="pdf-page" id="page-15">
  <PageHeader studentFirstName={studentFirstName} />

  <div className="pdf-page-body">
    <div className="score-rep-banner lavender">
      <div className="score-rep-banner-circle"></div>
      <span>VISUAL REPRESENTATION OF YOUR SCORE</span>
    </div>

    {/* 2x2 Donut Grid matching target layout */}
    <div className="grid grid-cols-2 gap-x-10 gap-y-10 my-8 max-w-md mx-auto">
      {[
        { key: "V", label: "VISUAL", val: varkScoreMap.V, ring: "#DDE7F3", fill: "#466CA3", text: "#1E3A8A" },
        { key: "A", label: "AUDITORY", val: varkScoreMap.A, ring: "#E2EBE0", fill: "#4D6D47", text: "#154512" },
        { key: "Rd", label: "READING", val: varkScoreMap.Rd, ring: "#F3EDE0", fill: "#B58E2E", text: "#5C450A" },
        { key: "K", label: "KINESTHETIC", val: varkScoreMap.K, ring: "#F6E7E5", fill: "#9A4235", text: "#691811" },
      ].map((item) => (
        <div key={item.key} className="flex flex-col items-center">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                stroke={item.ring}
                strokeWidth="5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                stroke={item.fill}
                strokeDasharray={`${item.val}, 100`}
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute font-black text-2xl" style={{ color: item.text }}>
              {item.val}%
            </div>
          </div>
          <div className="mt-3 font-extrabold text-sm uppercase tracking-wider text-slate-900">
            {item.label}
          </div>
        </div>
      ))}
    </div>

    <div className="top-interests-box">
      <div className="score-rep-banner lavender">
        <div className="score-rep-banner-circle"></div>
        <span>Your Best Learning Styles are</span>
      </div>
      <div className="top-interests-pills-grid max-w-md">
        {topLearningStyles.map((style) => (
          <div key={style.facet || style.name} className="top-interest-pill lavender">
            {style.name}
          </div>
        ))}
      </div>
    </div>
  </div>

          <PageFooter pageNum={15} />
        </div>

        {/* ============================================================
            PAGE 16: WORK VALUES OVERVIEW
        ============================================================ */}
        <div className="pdf-page" id="page-16">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <TitlePill title="WORK VALUES" colorClass="green" />

            <p className="page-lead-text">
              "Work values are the core principles and priorities that define what matters most to you in a professional environment. They reflect what you seek from your career — whether that is achievement, recognition, security, autonomy, relationships, or making a meaningful impact. Unlike interests (what you enjoy) or personality (how you behave), work values reveal why certain careers feel more fulfilling than others.
            </p>
            <p className="page-lead-text">
              Understanding your work values helps you evaluate job opportunities beyond salary and title. When your work aligns with your values, you feel more motivated, satisfied, and committed. When it does not, even a well-paying or prestigious role can feel empty. Identifying your core values early helps you make career choices that bring long-term fulfilment."
            </p>

            {/* Schwartz Values Diamond Diagram matching PDF Page 15 */}
                      {/* Schwartz Values Diamond Diagram matching PDF Page 15 */}
            <div className="my-2 py-2 flex justify-center items-center overflow-hidden h-[380px]">
              <img
                src={ReportImg5}
                alt="Schwartz Values"
                className="w-full object-contain scale-10"
              />
            </div>

            <p className="page-lead-text text-xs text-[#4A5568] mt-2">
              Each trait brings strengths, and different careers suit different combinations. For example, highly conscientious individuals may excel in structured roles, while those high in openness may thrive in creative or innovative environments. Understanding your personality helps you choose careers that fit your natural style, identify areas for growth, and work more effectively with others.
            </p>
          </div>

          <PageFooter pageNum={16} />
        </div>

        {/* ============================================================
            PAGE 17: WORK VALUES SUGGESTIONS
        ============================================================ */}
        <div className="pdf-page" id="page-17">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body space-y-3.5">
            <TitlePill title="HERE ARE THE SUGGESTIONS AS PER VALUES" colorClass="dark-green" />
{[
  { facet: "OC", num: "01", name: "OPENNESS TO CHANGE", highText: "Freedom, creativity and new experiences drive you — you'll thrive where you can decide how you work and what you explore.", modText: "You appreciate some freedom and variety in how you work, while still valuing a degree of structure." },
  { facet: "SE", num: "02", name: "SELF-ENHANCEMENT", highText: "Achievement, success and recognition strongly drive you — you'll thrive with clear goals, competition, growth ladders and visible results.", modText: "Achievement and recognition matter to you, alongside other motivations like stability or purpose." },
  { facet: "ST", num: "03", name: "SELF-TRANSCENDENCE", modText: "You care about fairness and helping others as part of a balanced set of motivations." },
  { facet: "CO", num: "04", name: "CONSERVATION", modText: "You value a reasonable amount of stability and order while staying flexible when things shift.", devText: "Stability and predictability aren't your main drivers — you're comfortable with change and less tied to fixed routines." },
].map((item) => {
  const d = domainValues.find((x) => x.facet === item.facet);
  const bandLabel = (d?.bandLabel || "Moderate").toUpperCase();
  const text = bandLabel === "HIGH" && item.highText ? item.highText
    : bandLabel === "DEVELOPING" && item.devText ? item.devText
    : item.modText;
  return (
    <div key={item.num} className="trait-card-row">
      <div className="trait-card-left">
        <div className="trait-card-badge">
          <span className="detail-card-num-circle">{item.num}</span>
          <span>{item.name}</span>
        </div>
        <div className={`trait-card-band ${bandLabel === "HIGH" ? "high" : bandLabel === "DEVELOPING" ? "developing" : "moderate"}`}>
          {bandLabel}
        </div>
      </div>
      <div className="trait-card-right-body"><div>{text}</div></div>
    </div>
  );
})}
          </div>

          <PageFooter pageNum={17} />
        </div>

        {/* ============================================================
            PAGE 18: VISUAL REPRESENTATION (WORK VALUES)
        ============================================================ */}
        <div className="pdf-page" id="page-18">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <div className="score-rep-banner green">
              <div className="score-rep-banner-circle"></div>
              <span>VISUAL REPRESENTATION OF YOUR SCORE</span>
            </div>

            {/* Capsule Progress Bars matching PDF Page 17 */}
            <div className="space-y-6 my-6 max-w-xl mx-auto w-full">
              {[
                { label: "OPENNESS TO CHANGE", val: valScoreMap.OC, fillColor: "#46633E", trackColor: "#C8D7C4" },
                { label: "SELF-ENHANCEMENT", val: valScoreMap.SE, fillColor: "#5279A8", trackColor: "#C4D5EB" },
                { label: "SELF-TRANSCENDENCE", val: valScoreMap.ST, fillColor: "#6978B4", trackColor: "#CCD2E8" },
                { label: "CONSERVATION", val: valScoreMap.CO, fillColor: "#9E7B1D", trackColor: "#F5E9CC" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="font-extrabold text-sm uppercase text-[#1E232A] mb-1.5">
                    {item.label}
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className="flex-1 h-7 rounded-full overflow-hidden"
                      style={{ backgroundColor: item.trackColor }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.val}%`,
                          backgroundColor: item.fillColor,
                        }}
                      ></div>
                    </div>
                    <span className="font-black text-base text-[#1E232A] w-12 text-right">
                      {item.val}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="top-interests-box">
              <div className="score-rep-banner dark-green">
                <div className="score-rep-banner-circle"></div>
                <span>Your Best Work Value Fit into</span>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                {topWorkValues.map((value) => (
                  <div key={value.facet || value.name} className="top-interest-pill green">
                    {value.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <PageFooter pageNum={18} />
        </div>

        {/* ============================================================
            PAGE 19: GOAL ORIENTATION (OVERVIEW & SHORT TERM)
        ============================================================ */}
        <div className="pdf-page" id="page-19">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <TitlePill title="GOAL ORIENTATION" colorClass="gold" />

            <p className="page-lead-text">
              Goals guide your direction in studies, work, and personal growth. Your goal orientation reflects how you view success and what motivates you to achieve it. Some people focus on short-term goals—completing tasks, gaining quick skills, or achieving immediate results—while others are driven by long-term goals, such as building expertise, reaching leadership roles, or creating lasting impact. Both are important: short-term goals keep you motivated daily, while long-term goals provide vision and persistence.
            </p>
            <p className="page-lead-text">
              Understanding your orientation helps you balance present actions with future ambitions. Those with strong long-term focus may need to break goals into smaller steps, while short-term–focused individuals may benefit from planning for bigger aspirations. Knowing your goal orientation helps you use your energy effectively and stay aligned with your personal and career goals.
            </p>

            <div className="detail-card-row mt-5">
              <div className="detail-card-left-badge gold">
                <span className="detail-card-num-circle">01</span>
                <span>SHORT TERM</span>
              </div>
              <div className="detail-card-right-body gold">
                <div className="detail-card-desc">
                  You are oriented toward goals that can be achieved in the relatively near future, often within months to a year. You seek more immediate feedback, micromilestones, and concrete progress.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Action-oriented, results-focused, responsive, task-driven, motivated by immediate feedback.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Completing tasks quickly, achieving daily or weekly targets, gaining visible and prompt results.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Fast-paced workplaces with clear, measurable short-cycle goals and regular performance check-ins.</div>
              </div>
            </div>
             
          </div>

          <PageFooter pageNum={19} />
        </div>

      
        {/* ============================================================
            PAGE 20: GOAL ORIENTATION (LONG TERM & VISUAL REPRESENTATION)
        ============================================================ */}
        <div className="pdf-page" id="page-20">
  <PageHeader studentFirstName={studentFirstName} />

  <div className="pdf-page-body space-y-6">

    <div className="detail-card-row">
      <div className="detail-card-left-badge gold">
        <span className="detail-card-num-circle">02</span>
        <span>LONG TERM</span>
      </div>
      <div className="detail-card-right-body gold">
        <div className="detail-card-desc">
          You are oriented toward broader, strategic, future-oriented outcomes that may take several years to achieve and often involve many steps. You hold a vision and work progressively toward it.
        </div>
        <div className="detail-card-meta-row"><strong>Key Traits:</strong> Vision, persistence, planning, stability, commitment.</div>
        <div className="detail-card-meta-row"><strong>Enjoys:</strong> Career ambition, major life objectives, mastering a field, long projects, cumulative growth.</div>
        <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Long-range planning, supportive structure, milestone expectations, clarity of desired destination.</div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="p-3.5 rounded-xl bg-[#FDF8EE] border border-[#E8D39E] text-xs text-[#78540B] leading-relaxed">
        <div className="inline-block px-3 py-1 bg-[#F5E6C3] rounded-md font-black text-xs uppercase text-[#4D370A] mb-1.5">SHORT TERM</div>
        <p>Aim for short milestones and rewards. Match with roles needing daily targets.</p>
      </div>
      <div className="p-3.5 rounded-xl bg-[#FDF8EE] border border-[#E8D39E] text-xs text-[#78540B] leading-relaxed">
        <div className="inline-block px-3 py-1 bg-[#F5E6C3] rounded-md font-black text-xs uppercase text-[#4D370A] mb-1.5">LONG TERM</div>
        <p>Use Vision boards, planning tools, long-term mentorship. Ideal for research, entrepreneurship, civil services.</p>
      </div>
    </div>

    <div className="score-rep-banner gold">
      <div className="score-rep-banner-circle"></div>
      <span>VISUAL REPRESENTATION OF YOUR SCORE</span>
    </div>

    <div className="flex justify-center gap-16 text-center py-2">
      <div>
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path stroke="#F3EDE0" strokeWidth="5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path stroke="#94751E" strokeDasharray={`${shortPct}, 100`} strokeWidth="5" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="absolute font-black text-xl text-[#5C450A]">{shortPct}%</div>
        </div>
        <div className="mt-2 text-[10px] font-bold uppercase text-slate-600">Short Term</div>
      </div>
      <div>
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path stroke="#F3EDE0" strokeWidth="5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path stroke="#94751E" strokeDasharray={`${longPct}, 100`} strokeWidth="5" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="absolute font-black text-xl text-[#5C450A]">{longPct}%</div>
        </div>
        <div className="mt-2 text-[10px] font-bold uppercase text-slate-600">Long Term</div>
      </div>
    </div>

    <div className="p-3 bg-[#94721C] text-white rounded-xl text-center font-extrabold text-sm uppercase tracking-wider shadow-xs">
      Most Inclined towards : {goalOrientationLabel}
    </div>
  </div>

          <PageFooter pageNum={20} />
        </div>
        {/* ============================================================
            PAGE 21: APTITUDE (OVERVIEW)
        ============================================================ */}
        <div className="pdf-page aptitude-overview-page" id="page-21">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <TitlePill title="APTITUDE" colorClass="red" />

            <p className="page-lead-text">
              Your aptitude reflects your natural ability to learn, understand, and apply different skills. While interests show what you enjoy, aptitudes indicate what you can do well with practice. They are not fixed and can improve with training, but knowing your strongest aptitudes helps you identify areas where success may come more easily. Aptitude plays a key role in choosing a career because it shows which tasks, problem-solving styles, and skills will feel more comfortable and rewarding.
            </p>
            <div className="font-bold text-sm text-[#111827] mb-2">
              In this test, we assess six types of aptitudes:
            </div>

            {/* 6 Hanging Clip Badges matching PDF Page 20 */}
                        {/* 6 Hanging Clip Badges matching PDF Page 20 */}
                       <div className="my-1 flex justify-center items-center overflow-hidden">
              <img
                src={ReportImg6}
                alt="Aptitude Categories"
                className="aptitude-category-image w-full object-contain scale-100 max-w-[550px] mx-auto"
              />
            </div>

            {/* 4 Summary Cards matching PDF */}
            <div className="aptitude-summary-grid grid grid-cols-2 gap-3 mt-2">
              <div className="rounded-xl border border-[#8C1814] overflow-hidden">
                <div className="bg-[#8C1814] text-white p-2 text-center text-xs font-black uppercase">MECHANICAL APTITUDE</div>
                <div className="p-3 text-xs leading-relaxed text-[#374151] bg-[#FDF4F3]">
                  This shows how easily you understand machines, tools, and physical systems. If strong here, you may enjoy careers in engineering, mechanics, or technology where practical problem-solving is needed.
                </div>
              </div>
              <div className="rounded-xl border border-[#8C1814] overflow-hidden">
                <div className="bg-[#8C1814] text-white p-2 text-center text-xs font-black uppercase">LOGICAL APTITUDE</div>
                <div className="p-3 text-xs leading-relaxed text-[#374151] bg-[#FDF4F3]">
                  This reflects your ability to think critically, recognize patterns, and solve problems step by step. Strong logical reasoning is valuable in coding, mathematics, law, and research careers.
                </div>
              </div>
              <div className="rounded-xl border border-[#8C1814] overflow-hidden">
                <div className="bg-[#8C1814] text-white p-2 text-center text-xs font-black uppercase">VERBAL APTITUDE</div>
                <div className="p-3 text-xs leading-relaxed text-[#374151] bg-[#FDF4F3]">
                  This measures how well you can express ideas, understand language, and communicate clearly. Strong verbal skills are useful in teaching, law, media, and leadership roles.
                </div>
              </div>
              <div className="rounded-xl border border-[#8C1814] overflow-hidden">
                <div className="bg-[#8C1814] text-white p-2 text-center text-xs font-black uppercase">VOCABULARY APTITUDE</div>
                <div className="p-3 text-xs leading-relaxed text-[#374151] bg-[#FDF4F3]">
                  This shows the strength of your word knowledge and ability to use language effectively. It supports careers that rely on reading, writing, public speaking, or persuasion.
                </div>
              </div>
            </div>
          </div>

          <PageFooter pageNum={21} />
        </div>

        {/* ============================================================
            PAGE 22: APTITUDE (NUMERICAL & SPATIAL + DETAILS)
        ============================================================ */}
        <div className="pdf-page" id="page-22">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#8C1814] overflow-hidden">
                <div className="bg-[#8C1814] text-white p-2 text-center text-xs font-black uppercase">NUMERICAL APTITUDE</div>
                <div className="p-3 text-xs leading-relaxed text-[#374151] bg-[#FDF4F3]">
                  <p className="mb-2">This measures comfort with numbers, calculations, and quantitative reasoning. It is crucial in careers related to finance, data science, economics, and technology.</p>
                  <p>By identifying your aptitudes, you can better understand where your natural strengths lie and how to build on them. A career that matches both your interests and aptitudes allows you to learn faster, perform better, and feel more confident in your abilities.</p>
                </div>
              </div>
              <div className="rounded-xl border border-[#8C1814] overflow-hidden">
                <div className="bg-[#8C1814] text-white p-2 text-center text-xs font-black uppercase">SPATIAL APTITUDE</div>
                <div className="p-3 text-xs leading-relaxed text-[#374151] bg-[#FDF4F3]">
                  This reflects your ability to imagine shapes, designs, and objects in space. Strong spatial skills are important for architecture, design, surgery, engineering, and visual arts.
                </div>
              </div>
            </div>

            {/* 01 NUMERICAL */}
            <div className="detail-card-row mt-4">
              <div className="detail-card-left-badge red">
                <span className="detail-card-num-circle">01</span>
                <span>NUMERICAL</span>
              </div>
              <div className="detail-card-right-body red">
                <div className="detail-card-desc">
                  You think in structured, analytical ways and are comfortable dealing with quantities, formulas, and logic. You enjoy the clarity that numbers provide and are skilled at identifying relationships and trends in data. This aptitude helps you excel in problem-solving and evidence-based decision-making.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Logical, detail-oriented, and comfortable working with numbers and quantitative data. Strong in mathematical reasoning, pattern recognition, and data interpretation.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Working with statistics, solving quantitative problems, budgeting, coding, logical puzzles, or analyzing data.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Finance, data analysis, research, science, engineering, or technology-driven spaces that rely on precision and logic.</div>
              </div>
            </div>
          </div>

          <PageFooter pageNum={22} />
        </div>

        {/* ============================================================
            PAGE 23: APTITUDE DETAILS (LOGICAL & VERBAL)
        ============================================================ */}
        <div className="pdf-page" id="page-23">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body space-y-4">
            <div className="detail-card-row">
              <div className="detail-card-left-badge red">
                <span className="detail-card-num-circle">02</span>
                <span>LOGICAL REASONING</span>
              </div>
              <div className="detail-card-right-body red">
                <div className="detail-card-desc">
                  You have a natural ability to think clearly, reason objectively, and identify the most logical pathway to a solution. You approach challenges methodically, preferring to understand why and how something works rather than just what happens.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Analytical, systematic, and conceptually clear thinker. You are skilled at recognizing patterns, making inferences, and drawing conclusions from abstract or structured information.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> You enjoy situations where reasoning matters more than rote learning — for example, decoding clues, troubleshooting systems, or analyzing cause-and-effect relationships.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> You thrive in spaces that reward rational thought — such as research, analytics, data science, technology, law, mathematics, or strategic planning.</div>
              </div>
            </div>

            <div className="detail-card-row">
              <div className="detail-card-left-badge red">
                <span className="detail-card-num-circle">03</span>
                <span>VERBAL APTITUDE</span>
              </div>
              <div className="detail-card-right-body red">
                <div className="detail-card-desc">
                  You have a strong ability to understand, interpret, and communicate ideas through language. You are comfortable processing written information and expressing thoughts clearly. This aptitude helps you analyze complex texts, articulate arguments effectively, and communicate ideas in a structured and meaningful way.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Strong comprehension, articulate expression, attention to language details, and the ability to interpret written information accurately. Skilled in reasoning with words and explaining concepts clearly.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Reading, writing, debating ideas, storytelling, analyzing written material, presenting ideas, or communicating information clearly to others.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Communication-focused fields such as media, journalism, education, law, marketing, public relations, and roles that involve presenting, writing, or explaining ideas.</div>
              </div>
            </div>
          </div>

          <PageFooter pageNum={23} />
        </div>

        {/* ============================================================
            PAGE 24: APTITUDE DETAILS (VOCABULARY & MECHANICAL)
        ============================================================ */}
        <div className="pdf-page" id="page-24">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body space-y-4">
            <div className="detail-card-row">
              <div className="detail-card-left-badge red">
                <span className="detail-card-num-circle">04</span>
                <span>VOCABULARY APTITUDE</span>
              </div>
              <div className="detail-card-right-body red">
                <div className="detail-card-desc">
                  You demonstrate a strong understanding of word meanings, language nuances, and how words can be used effectively in different contexts. This aptitude helps you grasp complex ideas through language and communicate with clarity and precision.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Strong word knowledge, language awareness, comprehension of subtle differences in meaning, and the ability to use language effectively.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Learning new words, reading diverse material, writing, language-based quizzes or puzzles, editing content, and refining communication.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Language-rich environments such as publishing, media, education, writing, communication strategy, and roles that require strong language and articulation skills.</div>
              </div>
            </div>

            <div className="detail-card-row">
              <div className="detail-card-left-badge red">
                <span className="detail-card-num-circle">05</span>
                <span>MECHANICAL APTITUDE</span>
              </div>
              <div className="detail-card-right-body red">
                <div className="detail-card-desc">
                  You are able to understand how physical systems, machines, and mechanical processes work. You tend to think in practical and functional ways, recognizing how components interact and how systems operate in real-world environments.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Practical thinker, strong problem-solving ability, understanding of mechanical systems, and an interest in how machines or tools function.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> Building, fixing, assembling, experimenting with tools or devices, understanding how machines operate, and solving practical technical problems.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Engineering workshops, manufacturing, technical industries, robotics, automotive environments, or hands-on technical fields that involve machinery and systems.</div>
              </div>
            </div>
          </div>

          <PageFooter pageNum={24} />
        </div>

        {/* ============================================================
            PAGE 25: APTITUDE DETAILS (SPATIAL)
        ============================================================ */}
        <div className="pdf-page" id="page-25">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <div className="detail-card-row">
              <div className="detail-card-left-badge red">
                <span className="detail-card-num-circle">06</span>
                <span>SPATIAL APTITUDE</span>
              </div>
              <div className="detail-card-right-body red">
                <div className="detail-card-desc">
                  You have the ability to visualize objects, shapes, and structures in three-dimensional space. You can mentally manipulate visual information, understand patterns, and imagine how different components fit together. This aptitude supports creativity, design thinking, and structural understanding.
                </div>
                <div className="detail-card-meta-row"><strong>Key Traits:</strong> Strong visual imagination, pattern recognition, spatial awareness, and the ability to mentally rotate or visualize objects.</div>
                <div className="detail-card-meta-row"><strong>Enjoys:</strong> You enjoy situations where reasoning matters more than rote learning — for example, decoding clues, troubleshooting systems, or analyzing cause-and-effect relationships.</div>
                <div className="detail-card-meta-row"><strong>Ideal Environments:</strong> Design, architecture, engineering, animation, product design, construction planning, and fields that require visual thinking and spatial planning.</div>
              </div>
            </div>
          </div>

          <PageFooter pageNum={25} />
        </div>

        {/* ============================================================
            PAGE 26: VISUAL REPRESENTATION (APTITUDE COLUMN CHART)
        ============================================================ */}
        <div className="pdf-page" id="page-26">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <div className="score-rep-banner red">
              <div className="w-6 h-6 rounded-md bg-[#8C1814] flex-shrink-0"></div>
              <span>VISUAL REPRESENTATION OF YOUR SCORE</span>
            </div>

            {/* Vertical Column Chart matching PDF Page 25 */}
            <div className="my-8 max-w-xl mx-auto w-full">
              <div className="relative h-64 border-b border-slate-400 pb-0">
                {/* Horizontal Guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-xs text-slate-400">
                  {aptYAxisPoints.map((pt, i) => (
                    <div key={i} className="flex items-center">
                      <span className="w-8 text-right pr-2 font-mono text-[11px] text-slate-500 font-semibold">{pt}</span>
                      <div className={`flex-1 border-b ${pt === 0 ? "border-slate-400" : "border-slate-200"}`}></div>
                    </div>
                  ))}
                </div>

                {/* Columns */}
                <div className="absolute inset-0 pl-10 pr-4 flex justify-between items-end">
                  {aptList.map((item) => (
                    <div key={item.key} className="flex-1 h-full flex flex-col justify-end items-center z-10">
                      <span className="text-xs font-bold text-slate-800 mb-1">{item.val}%</span>
                      <div
                        className="w-full max-w-[46px] bg-[#963E34] rounded-t-md transition-all duration-300"
                        style={{
                          height: `${Math.max(item.val > 0 ? 5 : 0, (item.val / aptScaleMax) * 100)}%`,
                          minHeight: item.val > 0 ? "4px" : "0px",
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column Labels */}
              <div className="pl-10 flex justify-between pr-4 mt-2">
                {aptList.map((item) => (
                  <div key={item.key} className="flex-1 text-center font-semibold text-xs text-slate-700">
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="top-interests-box mt-10">
              <div className="score-rep-banner red">
                <div className="w-6 h-6 rounded-md bg-[#8C1814] flex-shrink-0"></div>
                <span>Your Top Aptitudes Are</span>
              </div>
              <div className="top-interests-pills-grid max-w-md">
                {topAptitudes.map((aptitude) => (
                  <div key={aptitude.facet || aptitude.name} className="top-interest-pill red">
                    {aptitude.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <PageFooter pageNum={26} />
        </div>

        {/* ============================================================
            PAGE 27: INTEGRATED ANALYSIS & CLUSTER #1
        ============================================================ */}
        <div className="pdf-page" id="page-27">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <TitlePill title="INTEGRATED ANALYSIS" colorClass="gold" />

            <div className="text-xl font-black text-[#1E232A] uppercase tracking-tight">
              YOUR TOP CLUSTERS
            </div>
            <p className="text-xs text-[#6B7280] mb-2">
              Each card shows what the field involves, why it suits you, how to get there, and list of careers
            </p>

            {/* Dynamic counsellor + top-five cluster map */}
            <div className="cluster-map" aria-label="Your five top career clusters">
              <div className="cluster-map-illustration">
                <img src={ReportImg7} alt="Career counsellor" />
              </div>
              <svg
                className="cluster-map-connectors"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {[9, 29.5, 50, 70.5, 91].map((endY) => (
                  <line key={endY} x1="39" y1="50" x2="49" y2={endY} />
                ))}
                <circle cx="39" cy="50" r="1.35" />
              </svg>
              <div className="cluster-map-labels">
                {top5Clusters.slice(0, 5).map((cluster, index) => (
                  <div
                    className={`cluster-map-label cluster-map-label-${index + 1}`}
                    key={`${cluster.code}-${index}`}
                    style={{ "--cluster-color": ["#70b86b", "#4d95d7", "#9a76ca", "#dc984f", "#47b9b9"][index] }}
                  >
                    <span className="cluster-map-rank">{index + 1}</span>
                    <span className="cluster-map-name">{cluster.name}</span>
                    <span className="cluster-map-match">{cluster.matchPercentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 1 Cluster Card */}
            <div className="cluster-match-card">
              <div className="cluster-match-card-header">
                <span className="cluster-match-title">1 {top5Clusters[0].name}</span>
                <span className="cluster-match-pct">{top5Clusters[0].matchPercentage}%</span>
              </div>
              <div className="cluster-match-card-body">
                <p className="mb-2 font-medium text-slate-800">{top5Clusters[0].description}</p>
                <p className="mb-2 text-slate-600">{top5Clusters[0].why_fit}</p>
                <div className="mt-2 text-xs text-slate-700">
                  <strong>Pathway in India:</strong> {top5Clusters[0].streams_and_pathways_india}
                </div>

                <div className="cluster-careers-grid">
                  {(top5Clusters[0].careers || []).map((c, i) => (
                    <div key={i} className="cluster-career-chip">
                      <span className="cluster-career-dot"></span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <PageFooter pageNum={27} />
        </div>

        {/* ============================================================
            PAGE 28: CLUSTERS #2 & #3
        ============================================================ */}
        <div className="pdf-page" id="page-28">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body space-y-3.5">
            {/* Cluster #2 */}
            <div className="cluster-match-card">
              <div className="cluster-match-card-header salmon">
                <span className="cluster-match-title">2 {top5Clusters[1].name}</span>
                <span className="cluster-match-pct">{top5Clusters[1].matchPercentage}%</span>
              </div>
              <div className="cluster-match-card-body salmon">
                <p className="mb-2 font-medium text-slate-800">{top5Clusters[1].description}</p>
                <div className="mt-2 text-xs text-slate-700">
                  <strong>Pathway in India:</strong> {top5Clusters[1].streams_and_pathways_india}
                </div>
                <div className="cluster-careers-grid">
                  {(top5Clusters[1].careers || []).map((c, i) => (
                    <div key={i} className="cluster-career-chip">
                      <span className="cluster-career-dot salmon"></span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cluster #3 */}
            <div className="cluster-match-card">
              <div className="cluster-match-card-header blue">
                <span className="cluster-match-title">3 {top5Clusters[2].name}</span>
                <span className="cluster-match-pct">{top5Clusters[2].matchPercentage}%</span>
              </div>
              <div className="cluster-match-card-body blue">
                <p className="mb-2 font-medium text-slate-800">{top5Clusters[2].description}</p>
                <div className="mt-2 text-xs text-slate-700">
                  <strong>Pathway in India:</strong> {top5Clusters[2].streams_and_pathways_india}
                </div>
                <div className="cluster-careers-grid">
                  {(top5Clusters[2].careers || []).map((c, i) => (
                    <div key={i} className="cluster-career-chip">
                      <span className="cluster-career-dot blue"></span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <PageFooter pageNum={28} />
        </div>

        {/* ============================================================
            PAGE 29: CLUSTERS #4 & #5
        ============================================================ */}
        <div className="pdf-page" id="page-29">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body space-y-3.5">
            {/* Cluster #4 */}
            <div className="cluster-match-card">
              <div className="cluster-match-card-header green">
                <span className="cluster-match-title">4 {top5Clusters[3].name}</span>
                <span className="cluster-match-pct">{top5Clusters[3].matchPercentage}%</span>
              </div>
              <div className="cluster-match-card-body green">
                <p className="mb-2 font-medium text-slate-800">{top5Clusters[3].description}</p>
                <div className="mt-2 text-xs text-slate-700">
                  <strong>Pathway in India:</strong> {top5Clusters[3].streams_and_pathways_india}
                </div>
                <div className="cluster-careers-grid">
                  {(top5Clusters[3].careers || []).map((c, i) => (
                    <div key={i} className="cluster-career-chip">
                      <span className="cluster-career-dot green"></span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cluster #5 */}
            <div className="cluster-match-card">
              <div className="cluster-match-card-header gold">
                <span className="cluster-match-title">5 {top5Clusters[4].name}</span>
                <span className="cluster-match-pct">{top5Clusters[4].matchPercentage}%</span>
              </div>
              <div className="cluster-match-card-body gold">
                <p className="mb-2 font-medium text-slate-800">{top5Clusters[4].description}</p>
                <div className="mt-2 text-xs text-slate-700">
                  <strong>Pathway in India:</strong> {top5Clusters[4].streams_and_pathways_india}
                </div>
                <div className="cluster-careers-grid">
                  {(top5Clusters[4].careers || []).map((c, i) => (
                    <div key={i} className="cluster-career-chip">
                      <span className="cluster-career-dot gold"></span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <PageFooter pageNum={29} />
        </div>

        {/* ============================================================
            PAGE 30: YOUR DIRECTION: STUDY & PATHWAY ADVICE
        ============================================================ */}
        <div className="pdf-page" id="page-30">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <div className="bg-[#F3ECE2] rounded-xl p-3 mb-2 text-center sm:text-left">
              <div className="text-base font-extrabold uppercase text-[#1E232A]">
                YOUR DIRECTION: STUDY & PATHWAY ADVICE
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Turning your learning style and goal orientation into concrete next steps.
              </p>
            </div>

           <div className="flex flex-col gap-2 text-sm font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-200">
  <div>
    Learning style: <strong className="text-[#1E232A]">Visual</strong>
  </div>

  <div>
    Goal orientation: <strong className="text-[#1E232A]">Balanced Planner</strong>
  </div>
</div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <div>
                <strong className="block text-sm font-bold text-slate-900 mb-1 uppercase">
                  HOW TO STUDY, BASED ON HOW YOU LEARN
                </strong>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>Convert chapters into mind-maps, flowcharts and labelled diagrams.</li>
                  <li>Use colour-coding for formulas, dates and key terms.</li>
                  <li>Watch good video explanations, then redraw the idea from memory.</li>
                  <li>Sit where you can clearly see the board and the teacher's demonstrations.</li>
                </ul>
              </div>

              <div>
                <strong className="block text-sm font-bold text-slate-900 mb-1 uppercase">
                  YOUR PATHWAY APPROACH
                </strong>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>You're balanced between studying further and starting work early.</li>
                  <li>A smart path: choose degree courses that include internships, apprenticeships or placement years — you earn experience while keeping the door open to higher studies.</li>
                </ul>
              </div>
            </div>

            <div className="mt-3 font-bold text-sm text-[#1E232A]">
              A general route from where you are now
            </div>

            {/* 6-Lightbulb Study Roadmap matching PDF Page 29 */}
                              <div className="my-2 flex justify-center items-center overflow-hidden">
              <img
                src={ReportImg8}
                alt="Study & Pathway Roadmap"
                className="w-full object-contain scale-100 max-w-[560px] mx-auto"
              />
            </div>

            <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
              Highlighted stops are where your current goal orientation matters most — this is a general route, not a fixed plan. Talk it through with a teacher, counsellor or parent before locking in big decisions.
            </div>
          </div>

          <PageFooter pageNum={30} />
        </div>

        {/* ============================================================
            PAGE 31: YOUR COMPLETE CAREER MAP (SUMMARY)
        ============================================================ */}
        <div className="pdf-page" id="page-31">
          <PageHeader studentFirstName={studentFirstName} />

          <div className="pdf-page-body">
            <div className="text-xl font-black text-slate-900 uppercase">
              YOUR COMPLETE CAREER MAP
            </div>
            <p className="text-xs text-slate-600 mb-1">
              Everything above, brought together into one summary
            </p>

            <div className="text-2xl font-black text-[#8C1814] uppercase mb-4 tracking-wide">
              {studentName}
            </div>

            {/* 6 Summary Metric Cards matching PDF Page 30 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-bold uppercase text-slate-500">HOLLAND CODE</div>
                <div className="text-base font-extrabold text-slate-900">{hollandCode}</div>
              </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
  <div className="text-[10px] font-bold uppercase text-slate-500">
    TOP CLUSTER <span className="text-[#8C1814] font-black">{topCluster.matchPercentage}%</span>
  </div>
  <div className="text-xs font-extrabold text-slate-900 leading-snug">{topCluster.name}</div>
</div>
<div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
  <div className="text-[10px] font-bold uppercase text-slate-500">TOP VALUE</div>
  <div className="text-xs font-extrabold text-slate-900 leading-snug">{topWorkValues[0]?.name}</div>
</div>
<div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
  <div className="text-[10px] font-bold uppercase text-slate-500">TOP TRAIT</div>
  <div className="text-xs font-extrabold text-slate-900 leading-snug">{topPersonalityTrait?.name}</div>
</div>
<div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
  <div className="text-[10px] font-bold uppercase text-slate-500">LEARNING STYLE</div>
  <div className="text-xs font-extrabold text-slate-900 leading-snug">{topLearningStyles[0]?.name}</div>
</div>
<div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
  <div className="text-[10px] font-bold uppercase text-slate-500">GOAL ORIENTATION</div>
  <div className="text-xs font-extrabold text-slate-900 leading-snug">{goalOrientationSummary}</div>
</div>
            </div>

          <p className="text-xs leading-relaxed text-slate-700 mb-4">
  {studentName} shows an {hollandCode} interest pattern, which combined with {topPersonalityTrait?.name?.toLowerCase()} and a strong pull toward {topWorkValues[0]?.name?.toLowerCase()} points most clearly toward {topCluster.name} ({topCluster.matchPercentage}% match). Aptitude-wise, {studentName}'s strongest results are in {topAptitudes[0]?.name} and {topAptitudes[1]?.name}, which support that direction. As a {topLearningStyles[0]?.name?.toLowerCase()} learner with a {goalOrientationSummary.toLowerCase()} approach to the path ahead, the study tips and route in Section 3 are the most relevant starting point.
</p>

            {/* What to do next checklist matching PDF Page 30 */}
            <div className="p-3.5 bg-[#E6EFF6] border border-[#D2DFEB] rounded-xl text-xs space-y-1 mb-3">
              <strong className="block text-sm font-bold text-[#1E232A] mb-1.5 uppercase">WHAT TO DO NEXT</strong>
              <div>• Read through your top 5 clusters in Section 1 with a parent, teacher or counsellor.</div>
              <div>• Shortlist 2–3 clusters and look up their stream/subject requirements for your class.</div>
              <div>• Use the study tips in Section 3 for the next exam cycle.</div>
              <div>• Retake this assessment in 6–12 months — interests and skills develop, especially in these years.</div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Match percentages compare clusters with each other — a lower score doesn't mean you can't succeed there, only that other clusters fit your current profile more naturally. Interests can grow with exposure, and aptitude grows with practice. Retake this assessment after 6–12 months — interests develop as you try new things.
            </p>
          </div>

          <PageFooter pageNum={31} />
        </div>

        {/* ============================================================
            PAGE 32: ABOUT CAREER MAP (BACK COVER)
        ============================================================ */}
        <div className="pdf-page" id="page-32">
          {/* Header with Logo */}
          <div className="flex justify-end pt-1 pr-1 mb-2">
            <img
              src={Logo}
              alt="CareerMap Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="h-0.5 bg-[#8C1814] w-full mb-5"></div>

          <div className="pdf-page-body space-y-3.5">
            <div className="relative">
              <h2 className="text-3xl font-black uppercase leading-tight">
                <span className="text-[#1E232A]">DISCOVER YOUR </span>
                <span className="text-[#8C1814]">DIRECTION.</span><br/>
                <span className="text-[#1E232A]">DESIGN YOUR </span>
                <span className="text-[#8C1814]">FUTURE.</span>
              </h2>
              {/* Paper airplane curve SVG matching target screenshot */}
              <div className="absolute -top-1 right-2 w-32 h-20 pointer-events-none">
                <svg viewBox="0 0 140 80" fill="none" className="w-full h-full">
                  <path
                    d="M10 65 Q 45 10, 75 45 T 120 18"
                    stroke="#8C1814"
                    strokeWidth="1.8"
                    strokeDasharray="3 3"
                  />
                  <circle cx="120" cy="18" r="2.5" fill="#8C1814" />
                </svg>
              </div>
            </div>

            <div>
              <div className="inline-block bg-[#8C1814] text-white text-xs font-black px-3.5 py-1 rounded uppercase tracking-wider mb-2">
                ABOUT CAREER MAP
              </div>
              <div className="p-3 bg-[#FAF2F0] border border-[#F0DDD8] rounded-xl text-xs text-[#374151] leading-relaxed">
                Career Map (A Unit of Identity Group) — Odisha's pioneering career counselling platform since 2016, guiding school students, graduates, and working professionals through Career Selection, Career Planning, and Career Mentorship.
              </div>
            </div>

            <div>
              <div className="text-base font-black text-[#8C1814] uppercase tracking-wide mb-2.5">
                WHY CAREER MAP?
              </div>

              {/* 2 Columns with Road Divider matching PDF Page 31 */}
              <div className="relative flex justify-between gap-5">
                {/* Left Column */}
                <div className="flex-1 space-y-2.5">
                  <div className="p-2 bg-[#FAF2F0] border border-[#F0DDD8] rounded-xl flex items-center gap-3">
                    <img
                      src={FeaturePsychometric}
                      alt="Psychometric Counselling"
                      className="w-14 h-10 object-cover rounded-md flex-shrink-0"
                    />
                    <span className="text-[11px] font-bold text-[#1E232A] uppercase leading-tight">
                      PSYCHOMETRIC-BASED COUNSELLING
                    </span>
                  </div>
                  <div className="p-2 bg-[#FAF2F0] border border-[#F0DDD8] rounded-xl flex items-center gap-3">
                    <img
                      src={FeatureOnetoone}
                      alt="One to One Counselling"
                      className="w-14 h-10 object-cover rounded-md flex-shrink-0"
                    />
                    <span className="text-[11px] font-bold text-[#1E232A] uppercase leading-tight">
                      ONE-TO-ONE CAREER COUNSELLING
                    </span>
                  </div>
                  <div className="p-2 bg-[#FAF2F0] border border-[#F0DDD8] rounded-xl flex items-center gap-3">
                    <img
                      src={FeatureMentorship}
                      alt="Student Mentorship"
                      className="w-14 h-10 object-cover rounded-md flex-shrink-0"
                    />
                    <span className="text-[11px] font-bold text-[#1E232A] uppercase leading-tight">
                      MULTIDIMENSIONAL STUDENT MENTORSHIP
                    </span>
                  </div>
                </div>

                {/* Vertical Road Divider */}
                <div className="w-3.5 flex flex-col items-center justify-between py-1 flex-shrink-0 bg-[#5A636E] rounded-xs">
                  <div className="w-0.5 h-full border-l-2 border-dashed border-white"></div>
                </div>

                {/* Right Column */}
                <div className="flex-1 space-y-2.5">
                  <div className="p-2 bg-[#FAF2F0] border border-[#F0DDD8] rounded-xl flex items-center gap-3">
                    <img
                      src={FeatureCell}
                      alt="Career Counseling Cell"
                      className="w-14 h-10 object-cover rounded-md flex-shrink-0"
                    />
                    <span className="text-[11px] font-bold text-[#1E232A] uppercase leading-tight">
                      CAREER COUNSELING CELL
                    </span>
                  </div>
                  <div className="p-2 bg-[#FAF2F0] border border-[#F0DDD8] rounded-xl flex items-center gap-3">
                    <img
                      src={FeatureBehavioral}
                      alt="Behavioral Counselling"
                      className="w-14 h-10 object-cover rounded-md flex-shrink-0"
                    />
                    <span className="text-[11px] font-bold text-[#1E232A] uppercase leading-tight">
                      BEHAVIORAL & PSYCHOLOGICAL COUNSELLING
                    </span>
                  </div>
                  <div className="p-2 bg-[#FAF2F0] border border-[#F0DDD8] rounded-xl flex items-center gap-3">
                    <img
                      src={FeatureDashboard}
                      alt="Information Dashboard & App"
                      className="w-14 h-10 object-cover rounded-md flex-shrink-0"
                    />
                    <span className="text-[11px] font-bold text-[#1E232A] uppercase leading-tight">
                      INFORMATION DASHBOARD & APP
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl text-[11px] text-[#4B5563] leading-relaxed">
              Career Guidance Partner to the Government of Odisha, in association with UNICEF, OSEPA & DHSE. Present across 10,000+ students in CBSE, ICSE & residential schools — including with Knowledge Partnerships spanning and other leading institutions.
            </div>

            {/* CTA Box matching PDF Page 31 */}
            <div className="mt-2 text-center">
              <div className="w-full py-2.5 bg-[#8C1814] text-white rounded-xl font-bold text-base tracking-wide shadow-sm mb-2">
                Your Future Deserves More Than a Guess.
              </div>
              <div className="text-xs font-semibold text-[#4B5563] mb-2 mt-5">
                Schedule your counselling session today.
              </div>
              <div className="flex justify-center items-center gap-8 text-xs text-[#1E232A] font-semibold mb-2">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#8C1814] text-base">🌐</span> www.thecareermap.in
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[#8C1814] text-base">✉️</span> careermap2016@gmail.com
                </span>
              </div>
              <div className="flex justify-center items-center gap-1.5 text-xs text-[#1E232A] font-bold">
                <span className="text-[#8C1814] text-base">📞</span> +91 94372 08179, +91 97768 08179
              </div>
            </div>
          </div>

          <PageFooter pageNum={32} />
        </div>
      </div>
    </div>
  );
}
