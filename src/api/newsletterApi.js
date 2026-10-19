import api from "./axios";

function stripHtml(value) {
  if (!value) return "";
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function mapNewsletterItem(item) {
  return {
    id: String(item?.id ?? ""),
    title: item?.title || "",
    type: item?.type || "",
    description: stripHtml(item?.description) || "Newsletter details are not available right now.",
    media: item?.image || null,
    url: item?.url || "#",
    createdAt: item?.createdAt || "",
    updatedAt: item?.updatedAt || "",
  };
}

export async function getNewsletters() {
  const response = await api.get("/newsletter/");
  const items = Array.isArray(response?.data?.data) ? response.data.data : [];
  return items.map(mapNewsletterItem);
}

