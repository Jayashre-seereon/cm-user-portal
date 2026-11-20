import api from "./axios";

import { formatDate as formatSharedDate } from "../utils/format";
function stripHtml(value) {
  if (!value) {
    return "";
  }

  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatLabel(value) {
  const cleaned = stripHtml(value);

  if (!cleaned) {
    return "";
  }

  return cleaned
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) {
    return "Date not available";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return formatSharedDate(parsedDate);
}

function formatSubjects(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return "Subjects not available";
  }

  return subjects.join(", ");
}

function formatPattern(pattern) {
  const cleaned = stripHtml(pattern);

  if (!cleaned) {
    return ["Exam pattern not available"];
  }

  return cleaned
    .split(/(?<=\.)\s+|\s{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatTopColleges(colleges) {
  if (!Array.isArray(colleges) || colleges.length === 0) {
    return ["Top colleges not available"];
  }

  return colleges.filter(Boolean);
}

function mapEntranceExam(item, index) {
  const aboutHtml = item?.about || item?.details?.[0]?.description || item?.description || "";

  return {
    id: String(item?.id ?? `entrance-exam-${index}`),
    name: item?.examname || "Unnamed Exam",
    authority: formatLabel(item?.stream?.name) || formatLabel(item?.category?.title) || "Entrance Exam",
    date: formatDate(item?.exam_date),
    issueDate: formatDate(item?.issuedate),
    lastDate: formatDate(item?.lastdate),
    lastDateRaw: item?.lastdate || null,
    eligibility: item?.eligibility || "Eligibility not available",
    type: formatLabel(item?.stream?.name) || "All",
    category: formatLabel(item?.category?.title) || "General",
    mode: item?.mode || "Mode not available",
    duration: item?.duration ? `${item.duration} min` : "Duration not available",
    subjects: formatSubjects(item?.subject),
    totalMarks: item?.total_mark || "Marks not available",
    frequency: item?.frequncy || "Frequency not available",
    about: stripHtml(aboutHtml) || "About information is not available right now.",
    aboutHtml,
    details: Array.isArray(item?.details) ? item.details : [],
    examPattern: formatPattern(item?.exam_pattern),
    topColleges: formatTopColleges(item?.top_institution),
    website: item?.url || "#",
    // Raw category objects, preserved for dropdown filtering on the page.
    categoryObj: item?.category || null,
    secondcategoryObj: item?.secondcategory || null,
    subcategoryObj: item?.subcategory || null,
    // The lean list (see getEntranceExams) has no `about` / `details`. Such an exam still
    // needs getEntranceExamById before its detail page can show the full text.
    isLean: item?.about === undefined && item?.details === undefined,
  };
}

// The cards and filters only need a few fields. `lean=true` asks the server to leave out the
// long description text, which is ~90% of the full list (5 MB for 400+ exams, 20 s+ to load,
// past the 20 s request timeout). An older server ignores the flag and returns everything,
// which still works - just slower.
export async function getEntranceExams() {
  const response = await api.get("/entranceexam", { params: { lean: true } });
  const items = Array.isArray(response?.data?.data) ? response.data.data : [];

  return items.map((item, index) => mapEntranceExam(item, index));
}

// The full record of one exam (long description, details sections), loaded when it is opened.
export async function getEntranceExamById(id) {
  const response = await api.get(`/entranceexam/${encodeURIComponent(id)}`);
  const item = response?.data?.data;
  if (!item) {
    throw new Error("Exam details are not available right now.");
  }
  return mapEntranceExam(item, 0);
}

export const getCategories = async () => {
  const res = await api.get("/categories/");
  return res.data;
};
