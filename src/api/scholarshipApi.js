import api from "./axios";

function stripHtml(value) {
  if (!value) {
    return "";
  }

  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDeadline(deadline) {
  if (!deadline) {
    return "Deadline not available";
  }

  const parsedDate = new Date(deadline);

  if (Number.isNaN(parsedDate.getTime())) {
    return deadline;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDaysRemaining(deadline) {
  if (!deadline) {
    return null;
  }

  const parsedDate = new Date(deadline);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const diffMs = parsedDate.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getScholarshipStatus(deadline) {
  if (!deadline) {
    return "Active";
  }

  const parsedDate = new Date(deadline);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Active";
  }

  return parsedDate.getTime() >= Date.now() ? "Active" : "Expired";
}

function formatAmount(price) {
  if (!price) {
    return "Amount not available";
  }

  return `Rs ${price} / year`;
}

function formatRequirements(requirement) {
  if (!requirement) {
    return ["Requirements not available"];
  }

  return String(requirement)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatSections(sections) {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections.map((section, index) => ({
    id: String(section?.id ?? `section-${index}`),
    title: section?.title || `Section ${index + 1}`,
    description: section?.description || "",
  }));
}

function mapScholarshipItem(item, index) {
  const scholarshipType = item?.type || "Scholarship";

  return {
    id: String(item?.id ?? `scholarship-${index}`),
    createdAt: item?.createdAt || item?.created_at || null,
    name: item?.name || "Unnamed Scholarship",
    eligibility: stripHtml(item?.eligibility) || "Eligibility not available",
    amount: formatAmount(item?.price),
    rawPrice: item?.price || "",
    deadline: formatDeadline(item?.deadline),
    daysRemaining: getDaysRemaining(item?.deadline),
    tag: scholarshipType,
    status: getScholarshipStatus(item?.deadline),
    provider: scholarshipType,
    description: item?.description || "Scholarship details are not available right now.",
    requirements: formatRequirements(item?.requirement),
    link: item?.url || "#",
    image: item?.image || null,
    sections: formatSections(item?.sections), 
    categoryObj: item?.category || null,
    secondcategoryObj: item?.secondcategory || null,
    subcategoryObj: item?.subcategory || null,
     previewEligible: item?.previewEligible ?? false,
  accessTier: item?.accessTier ?? "locked",
  };
}

export async function getScholarships() {
  const response = await api.get("/scholarship");
  const items = Array.isArray(response?.data?.data) ? response.data.data : [];

  return items.map((item, index) => mapScholarshipItem(item, index));
}

export async function getScholarshipById(
  id,
  moduleId,
  previewSessionId
) {
   console.log("Inside getScholarshipById");
  const response = await api.get(`/scholarship/${id}`, {
    headers: {
      "x-module-id": moduleId,
      "x-preview-session": previewSessionId,
    },
  });

  return mapScholarshipItem(response.data.data);
}

export const getCategories = async () => {
  const res = await api.get("/categories/");
  return res.data;
};