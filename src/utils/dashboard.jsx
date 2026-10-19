import {
  BankOutlined,
  BulbOutlined,
  CreditCardOutlined,
  FileDoneOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { featuredInstitutes, featuredMentors, featuredScholarships, moduleCards, palette } from "../data/careermapData";

function formatDateDDMMYYYY(value) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toLocaleDateString("en-GB");
}

function buildInitials(name = "", fallback = "M") {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || fallback;
}

export const moduleRouteMap = {
  "career archive": "/app/library",
  assessment: "/app/assessment",
  "career & personality videos": "/app/learn",
  "career insights": "/app/newsletter",
  "entrance exam": "/app/entrance-exam",
  institutes: "/app/institutes",
  institute: "/app/institutes",
  "book your mentor": "/app/book-mentor",
  scholarships: "/app/scholarships",
  scholarship: "/app/scholarships",
  quiz: "/app/quiz",
  "study abroad": "/app/abroad",
  subscription: "/app/subscription",
  subscriptions: "/app/subscription",
};

export const moduleIconMap = {
  "Career Archive": <ReadOutlined style={{ color: "#c64f7a" }} />,
  "Career Psychometric Assessment": <BulbOutlined style={{ color: "#5d8f26" }} />,
  Assessment: <BulbOutlined style={{ color: "#5d8f26" }} />,
  "Career & Personality Videos": <TrophyOutlined style={{ color: "#4c45aa" }} />,
  "Career Insights": <ReadOutlined style={{ color: "#2f9367" }} />,
  "Entrance Exam": <FileDoneOutlined style={{ color: "#0f8a7c" }} />,
  Institutes: <BankOutlined style={{ color: "#c64f7a" }} />,
  "Book Your Mentor": <TeamOutlined style={{ color: "#157f69" }} />,
  Scholarships: <TrophyOutlined style={{ color: "#b77718" }} />,
  Quiz: <QuestionCircleOutlined style={{ color: "#2c70c9" }} />,
  "Study Abroad": <GlobalOutlined style={{ color: "#4c45aa" }} />,
  Subscriptions: <CreditCardOutlined style={{ color: "#8c5a18" }} />,
};

export const moduleStyleMap = {
  "Career Archive": { background: "linear-gradient(180deg, #fdebf2 0%, #fff6f9 100%)", actionBg: "#c64f7a", tone: palette.blue },
  "Career Psychometric Assessment": { background: "linear-gradient(180deg, #e7f2d2 0%, #f3f9e9 100%)", actionBg: "#5d8f26", tone: palette.purple },
  Assessment: { background: "linear-gradient(180deg, #e7f2d2 0%, #f3f9e9 100%)", actionBg: "#5d8f26", tone: palette.purple },
  "Career & Personality Videos": { background: "linear-gradient(180deg, #e6e4fb 0%, #f3f2ff 100%)", actionBg: "#4c45aa", tone: palette.orange },
  "Career Insights": { background: "linear-gradient(180deg, #e7f5ec 0%, #f5fbf7 100%)", actionBg: "#2f9367", tone: palette.green },
  "Entrance Exam": { background: "linear-gradient(180deg, #def6f2 0%, #f0fbf9 100%)", actionBg: "#0f8a7c", tone: palette.teal },
  Institutes: { background: "linear-gradient(180deg, #fdebf2 0%, #fff6f9 100%)", actionBg: "#c64f7a", tone: palette.pink },
  "Book Your Mentor": { background: "linear-gradient(180deg, #def2ee 0%, #f0fbf8 100%)", actionBg: "#157f69", tone: palette.secondary },
  Scholarships: { background: "linear-gradient(180deg, #fff0d8 0%, #fff8ee 100%)", actionBg: "#b77718", tone: palette.green },
  Quiz: { background: "linear-gradient(180deg, #e4efff 0%, #f3f8ff 100%)", actionBg: "#2c70c9", tone: palette.blue },
  "Study Abroad": { background: "linear-gradient(180deg, #e6e4fb 0%, #f3f2ff 100%)", actionBg: "#4c45aa", tone: palette.purple },
  Subscriptions: { background: "linear-gradient(180deg, #fff1dd 0%, #fff9f0 100%)", actionBg: "#8c5a18", tone: palette.secondary },
};

export function normalizeModuleTitle(value = "") {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveModuleLookupKey(value = "") {
  const normalized = normalizeModuleTitle(value);
  if (normalized === "scholarship") return "scholarships";
  if (normalized === "institute") return "institutes";
  if (normalized === "subscription") return "subscriptions";
  if (normalized === "career insights") return "career insights";
  if (normalized === "career psychometric assessment") return "career psychometric assessment";
  return normalized;
}

export function buildDashboardModules(modules = []) {
  const subscriptionsCard = {
    title: "Subscriptions",
    subtitle: "View subscription options and unlock premium modules.",
    route: "/app/subscription",
    tone: palette.secondary,
  };
  const allCards = [...moduleCards, subscriptionsCard];
  const cardMap = new Map(allCards.map((card) => [resolveModuleLookupKey(card.title), card]));

  if (!modules.length) {
    return [];
  }

  return modules
    .map((module) => {
      const matchedCard = cardMap.get(resolveModuleLookupKey(module.title || ""));
      const fallbackRoute = moduleRouteMap[resolveModuleLookupKey(module.title || "")];
      if (!matchedCard && !fallbackRoute) {
        return null;
      }

      return {
        id: module.id || module.title,
        title: module.title || matchedCard?.title || "Module",
        subtitle: matchedCard?.subtitle || "Open this module and continue your journey.",
        route: matchedCard?.route || fallbackRoute,
        lockTitle: matchedCard?.title || module.title,
        tone: matchedCard?.tone || palette.primary,
        accessStatus: module.accessStatus,
        image: module.image || null,
      };
    })
    .filter(Boolean);
}

export function buildDashboardMentors(mentors = []) {
  if (!mentors.length) {
    return [];
  }

  return mentors.map((mentor) => ({
    id: mentor.id,
    name: mentor.name || "Mentor",
    specialty: mentor.designation || "",
    rank: mentor.rank ?? "N/A",          // ← add this
    rating: Number(mentor.averageRating ?? 0).toFixed(1),
    totalReviews: mentor.totalReviews ?? 0,
    experience: mentor.experience ? `${mentor.experience} yrs` : "0 yrs",
    image: mentor.image || null,
    avatar: buildInitials(mentor.name || "M"),
  }));
}

export function buildDashboardScholarships(items = []) {
  if (!items.length) {
    return featuredScholarships;
  }

  return items.map((item) => ({
    id: item.id,
    name: item.name || "",
    amount: item.price ? `Rs ${item.price} / year` : "",
    deadline: item.deadline
      ? new Date(item.deadline).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "",
    tag: item.type || "",
  }));
}

export function buildDashboardInstitutes(items = []) {
  if (!items.length) {
    return featuredInstitutes;
  }

  return items.map((item) => ({
    id: item.id,
    name: item.name || "",
    location: item.address || "",
    type: item.institute_type || "",
    logo: item.logo || null,
    tentativeDate: formatDateDDMMYYYY(item.tentative_date || item.tentativeDate || ""),
  }));
}

export function buildDashboardEntranceExams(items = []) {
  if (!items.length) {
    return [];
  }

  return items.map((item) => ({
    id: item.id,
    name: item.examname || item.name || "Entrance Exam",
    authority: item.authority || item.stream?.name || item.category?.title || "",
    issueDate: formatDateDDMMYYYY(item.issuedate || item.issueDate || ""),
    lastDate: formatDateDDMMYYYY(item.lastdate || item.lastDate || ""),
    website: item.url || item.website || "",
  }));
}
