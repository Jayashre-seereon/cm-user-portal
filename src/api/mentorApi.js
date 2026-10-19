import api from "./axios";
import { useAuthStore } from "../store/authStore";
import { palette } from "../data/careermapData";

const mentorAccentPalette = [
  palette.primary,
  palette.blue,
  palette.orange,
  palette.secondary,
  palette.green,
  palette.purple,
  palette.pink,
  palette.teal,
];

function formatMentorPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "Price not available";
  }
  const rawValue = String(value).trim();
  const numericValue = Number(rawValue.replace(/[^\d.]/g, ""));
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return `Rs ${numericValue.toLocaleString("en-IN")} / session`;
  }
  if (rawValue.toLowerCase().includes("rs")) {
    return rawValue;
  }
  return `Rs ${rawValue} / session`;
}

function buildAvatar(name = "") {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "M";
}

function formatExperience(value) {
  if (value === null || value === undefined || value === "") {
    return "Experience not available";
  }
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return `${numericValue} yrs`;
  }
  const rawValue = String(value).trim();
  if (/\byr(s)?\b/i.test(rawValue)) {
    return rawValue;
  }
  return `${rawValue} yrs`;
}

function stripHtml(value) {
  if (!value) {
    return "";
  }
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatAvailabilityDate(value) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return {
      key: String(value || ""),
      day: "Day",
      date: String(value || ""),
      month: "",
    };
  }
  return {
    key: parsedDate.toISOString().split("T")[0],
    day: parsedDate.toLocaleDateString("en-IN", { weekday: "short" }),
    date: String(parsedDate.getDate()),
    month: parsedDate.toLocaleDateString("en-IN", { month: "short" }),
  };
}

function normalizeAvailability(availability) {
  if (!Array.isArray(availability)) {
    return [];
  }
  return availability
    .map((item, index) => {
      const dateInfo = formatAvailabilityDate(item?.date);
      const timeSlots = Array.isArray(item?.timeSlots)
        ? item.timeSlots.filter(Boolean)
        : [];
      return {
        id: String(item?.id ?? `${dateInfo.key || "availability"}-${index}`),
        mentorId: item?.mentorId ?? null,
        key: dateInfo.key || String(item?.date || index),
        day: dateInfo.day,
        date: dateInfo.date,
        month: dateInfo.month,
        slots: timeSlots,
        rawDate: item?.date || null,
      };
    })
    .filter((item) => Boolean(item.key));
}

export function mapMentorItem(item, index = 0) {
  const name = item?.name || "Unknown Mentor";
  const availability = normalizeAvailability(item?.availability);

  return {
    id: String(item?.id ?? `mentor-${index}`),
     createdAt: item?.createdAt || item?.created_at || null,
    name,
    specialty: item?.designation || item?.specialty || "Career Guidance",
    rank: item?.rank ?? "N/A",                              // ← add this, own key
    experience: formatExperience(item?.experience),
    price: formatMentorPrice(item?.mentor_fees ?? item?.mentorFees ?? item?.price),
    tags: [
      item?.subcategory?.title ||
      item?.secondcategory?.name ||
      item?.category?.title
    ].filter(Boolean),
    bio: stripHtml(item?.description) || "Mentor profile information is not available right now.",
     descriptionHtml: item?.description || "", accent: mentorAccentPalette[index % mentorAccentPalette.length],
    avatar: buildAvatar(name),
    email: item?.email || "",
    phoneNumber: item?.phone_number || item?.phoneNumber || "",
    dob: item?.dateof_birth || item?.dateOfBirth || "",
    education: item?.education || "",
    placeOfWork: item?.placeof_word || item?.placeOfWork || "",
    linkedin: item?.linkedin || "",
    facebook: item?.facebook || "",
    status: Boolean(item?.status),
    rating: item?.averageRating ?? item?.rating ?? 0,        // ← only ONE rating key now
    image: item?.image || null,
    resume: item?.resume || null,
    categoryId: item?.categoryId ?? null,
    subCategoryId: item?.subCategoryId ?? null,
    availability,
    categoryObj: item?.category ?? null,
    secondcategoryObj: item?.secondcategory ?? null,
    subcategoryObj: item?.subcategory ?? null,
    raw: item,
  };
}

function extractMentorItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.mentors)) {
    return payload.mentors;
  }
  if (payload?.data && typeof payload.data === "object") {
    return [payload.data];
  }
  if (payload && typeof payload === "object") {
    return [payload];
  }
  return [];
}

export async function getMentors() {
  const response = await api.get("/mentor/");
  const items = extractMentorItems(response?.data);
  return items.map((item, index) => mapMentorItem(item, index));
}

export async function getMentorById(id) {
  if (id === null || id === undefined || id === "") {
    throw new Error("Mentor id is required.");
  }
  const response = await api.get(`/mentor/${id}`);
  const items = extractMentorItems(response?.data);
  const mentorItem = items[0] || response?.data?.data || response?.data;
  return mentorItem ? mapMentorItem(mentorItem, 0) : null;
}

export async function createMentorOrder(data) {
  const response = await api.post("/mentor-booking/create-order", data);
  return response.data;
}

export async function verifyMentorPayment(data) {
  const response = await api.post("/mentor-booking/verify-payment", data);
  return response.data;
}

export async function getMyBookings() {
  const response = await api.get("/mentor-booking/my-bookings");
  return response.data;
}

export async function getBookedMentorSlots(mentorId, date) {
  if (mentorId === null || mentorId === undefined || mentorId === "" || !date) {
    return [];
  }
  const token = useAuthStore.getState().accessToken;
  const response = await api.get("/mentor-booking/booked-slots", {
    params: { mentorId, date },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return Array.isArray(response?.data?.data)
    ? response.data.data.filter(Boolean)
    : [];
}

export async function createMentorReview(payload) {
  const response = await api.post("/mentorreview/", payload);
  return response.data;
}

export const getCategories = async () => {
  const res = await api.get("/categories/");
  return res.data;
};