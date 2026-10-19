import api from "./axios";

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

function formatNotificationDate(value) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function mapNotificationItem(item, index = 0) {
  const status = String(item?.status || "").trim().toLowerCase();
  const unread = status === "pending";

  return {
    id: String(item?.id ?? `notification-${index}`),
    title: item?.title || "Notification",
    message: stripHtml(item?.message) || "No notification message available.",
    target: item?.target || "All users",
    status: status || "pending",
    type: item?.type || "General",
    createdAt: formatNotificationDate(item?.createdAt),
    updatedAt: formatNotificationDate(item?.updatedAt),
    time: formatNotificationDate(item?.createdAt) || "Just now",
    unread,
    raw: item,
  };
}

function extractItems(payload) {
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

export async function getNotifications() {
  const response = await api.get("/notification/user/all");
  const items = extractItems(response?.data);

  return items.map((item, index) => mapNotificationItem(item, index));
}
