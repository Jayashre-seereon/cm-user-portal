import api from "./axios";

// remove HTML tags (same as your institute file)
function stripHtml(value) {
  if (!value) return "";
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function extractListItems(html) {
  if (!html) return [];
  const matches = String(html).match(/<li[^>]*>([\s\S]*?)<\/li>/g) || [];
  if (matches.length > 0) {
    return matches.map((li) => stripHtml(li)).filter(Boolean);
  }
  const plain = stripHtml(html);
  return plain ? [plain] : [];
}
// convert API response → UI friendly format
function mapPlanItem(item, index) {
  return {
    id: String(item?.id ?? `plan-${index}`),
    name: item?.name || "Unnamed Plan",

    // convert HTML string → array (for List)
    features: stripHtml(item?.features)
      .split(".") // split if sentences
      .map((f) => f.trim())
      .filter(Boolean),
description: stripHtml(item?.description),
    descriptionList: extractListItems(item?.description),
    descriptionHtml: item?.description || "",
    validity: item?.validity || "",
    price: item?.price || "0",

    // flags for ribbon
    highestseller: item?.plan_type === "best seller",
    recommended: item?.plan_type === "recommended",

    modules: Array.isArray(item?.modules)
      ? item.modules.map((m) => m.title)
      : [],
  };
}

// main API function
export async function getPlans() {
  const response = await api.get("/plans");
  const items = Array.isArray(response?.data?.data)
    ? response.data.data
    : [];

  return items.map((item, index) => mapPlanItem(item, index));
}

export async function createOrder(planId) {
  const response = await api.post("/user/payment/create-order", { planId });
  return response?.data;
}

export async function verifyPayment(paymentData) {
  const response = await api.post("/user/payment/verify-payment", paymentData);
  return response?.data;
}