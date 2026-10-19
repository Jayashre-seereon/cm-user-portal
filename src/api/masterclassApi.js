import api from "./axios";

function formatCategoryLabel(category) {
  if (!category) {
    return "General";
  }

  return category
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatMasterclassTime(time) {
  if (!time) {
    return "Time not available";
  }

  const parsedDate = new Date(time);

  if (Number.isNaN(parsedDate.getTime())) {
    return time;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mapMasterclassItem(item, index) {
  const views = Number(item?.views) || 0;
  const categoryLabel = formatCategoryLabel(item?.category);

  return {
    id: String(item?.id ?? `${item?.title ?? "masterclass"}-${index}`),
    createdAt: item?.createdAt || item?.created_at || null,
    title: item?.title || "Untitled Master Class",
    mentor: item?.name || "Unknown Mentor",
     image: item?.image || null,
    duration: formatMasterclassTime(item?.time),
    views,
    career: categoryLabel,
    videoType: categoryLabel,
    locked: item.accessTier === "locked",
  isFree: item.previewEligible,
  accessTier: item.accessTier,
    url: item?.video_url || "#",
  };
}

export async function getMasterClasses(moduleId) {
  const response = await api.get("/masterclass", {
    headers: {
      "x-module-id": moduleId,
    },
  });

  const items = Array.isArray(response?.data?.data)
    ? response.data.data
    : [];

  return items
    .filter((item) => item?.is_active !== false)
    .map((item, index) => mapMasterclassItem(item, index));
}

// export async function getMasterClassById(
//   id,
//   moduleId,
//   previewSessionId
// ) {
//   const response = await api.get(`/masterclass/${id}`, {
//     headers: {
//       "x-module-id": moduleId,
//       ...(previewSessionId && {
//         "x-preview-session": previewSessionId,
//       }),
//     },
//   });

//   return response.data;
// }