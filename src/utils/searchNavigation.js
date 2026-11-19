/**
 * Maps a global-search result item (GET /api/search, also used for Career Bee
 * `links`) to the in-app route or external URL it should open.
 * Shared by GlobalSearchBar and the Career Bee assistant so both navigate identically.
 */
function resolveWith(item, useRaw) {
  // rawUrl substring checks are a last resort (second pass only)
  const rawHas = (part) => useRaw && rawUrl.includes(part);

  const group = String(item.group || "").toLowerCase();
  const type = String(item.type || "").toLowerCase();
  const title = encodeURIComponent(item.title || "");
  const id = item.id || item.navigation?.id || item.navigation?.instituteId || item.navigation?.examId || item.navigation?.scholarshipId || "";
  const nav = item.navigation || {};
  const meta = item.metadata || {};
  const pick = (...values) => values.find((v) => v !== undefined && v !== null && v !== "") ?? "";
  const rawUrl = String(item.navigation?.url || item.navigation?.path || item.route || "").trim();

  // If external URL
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  // 1. Careers / Career Library
  if (
    group === "careers" ||
    ["career", "stream", "category", "secondcategory", "subcategory", "careerpath"].includes(type) ||
    rawHas("career-library") ||
    rawHas("careers") ||
    rawHas("secondcategory") ||
    rawHas("subcategory")
  ) {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (id) params.set("id", String(id));
    if (item.title) params.set("title", item.title);
    const streamId = pick(item.streamId, nav.streamId, meta.streamId);
    const categoryId = pick(item.categoryId, nav.categoryId, meta.categoryId);
    const secondCategoryId = pick(item.secondCategoryId, nav.secondCategoryId, nav.secondcategoryId, meta.secondCategoryId, meta.secondcategoryId);
    const subCategoryId = pick(item.subCategoryId, nav.subCategoryId, nav.subcategoryId, meta.subCategoryId, meta.subcategoryId);
    if (streamId) params.set("streamId", String(streamId));
    if (categoryId) params.set("categoryId", String(categoryId));
    if (secondCategoryId) params.set("secondCategoryId", String(secondCategoryId));
    if (subCategoryId) params.set("subCategoryId", String(subCategoryId));
    if (type === "subcategory" || type === "careerpath" || type === "career") {
      params.set("career", item.title || "");
    }

    if (rawUrl.includes("?")) {
      const rawParams = new URLSearchParams(rawUrl.split("?")[1]);
      rawParams.forEach((val, key) => {
        if (!params.has(key)) params.set(key, val);
      });
    }

    const queryStr = params.toString();
    return queryStr ? `/app/library?${queryStr}` : `/app/library`;
  }

  // 2. Institutions / Colleges
  if (
    group === "institutions" ||
    group === "colleges" ||
    ["institution", "colleges", "college", "institutes", "institute"].includes(type) ||
    rawHas("institution") ||
    rawHas("institute") ||
    rawHas("college")
  ) {
    const params = new URLSearchParams();
    if (id) params.set("instituteId", String(id));
    const instituteTitle = item.title || item.name || "";
    if (instituteTitle) params.set("search", instituteTitle);
    const instituteQuery = params.toString();
    return instituteQuery
      ? `/app/institutes?${instituteQuery}`
      : "/app/institutes";
  }

  // 3. Entrance Exams
  if (
    group === "entranceexams" ||
    group === "exams" ||
    ["entranceexam", "entranceexams", "exams", "exam"].includes(type) ||
    rawHas("entranceexam") ||
    rawHas("entrance-exam") ||
    rawHas("exam")
  ) {
    return id
      ? `/app/entrance-exam?examId=${encodeURIComponent(id)}&exam=${title}&search=${title}`
      : `/app/entrance-exam?exam=${title}&search=${title}`;
  }

  // 4. Mentors
  if (
    group === "mentors" ||
    ["mentor", "mentors"].includes(type) ||
    rawHas("mentor")
  ) {
    return id
      ? `/app/book-mentor?mentorId=${encodeURIComponent(id)}&mentor=${title}`
      : `/app/book-mentor?mentor=${title}`;
  }

  // 5. Scholarships
  if (
    group === "scholarships" ||
    ["scholarship", "scholarships"].includes(type) ||
    rawHas("scholarship")
  ) {
    return id
      ? `/app/scholarships?scholarshipId=${encodeURIComponent(id)}&item=${title}&search=${title}`
      : `/app/scholarships?item=${title}&search=${title}`;
  }

  // 6. Study Abroad
  if (
    group === "studyabroad" ||
    group === "study_abroad" ||
    group === "abroad" ||
    ["studyabroad", "study_abroad", "abroad"].includes(type) ||
    rawHas("abroad") ||
    rawHas("studyabroad")
  ) {
    return id
      ? `/app/abroad?countryId=${encodeURIComponent(id)}&country=${title}`
      : `/app/abroad?country=${title}`;
  }

  // 7. Masterclasses / Learn
  if (
    group === "masterclasses" ||
    group === "learn" ||
    group === "videos" ||
    ["masterclass", "masterclasses", "learn", "video", "videos"].includes(type) ||
    rawHas("masterclass") ||
    rawHas("learn")
  ) {
    return id
      ? `/app/learn?videoId=${encodeURIComponent(id)}&video=${title}&search=${title}`
      : `/app/learn?search=${title}&video=${title}`;
  }

  // 8. Quizzes
  if (
    group === "quizzes" ||
    group === "quiz" ||
    ["quiz", "quizzes"].includes(type) ||
    rawHas("quiz")
  ) {
    return id ? `/app/quiz?quizId=${encodeURIComponent(id)}&quiz=${title}` : `/app/quiz`;
  }

  // 9. Newsletters
  if (
    group === "newsletters" ||
    group === "newsletter" ||
    ["newsletter", "newsletters"].includes(type) ||
    rawHas("newsletter")
  ) {
    return id ? `/app/newsletter?newsletterId=${encodeURIComponent(id)}&title=${title}` : `/app/newsletter`;
  }

  // 10. Assessment
  if (
    group === "assessment" ||
    group === "psychometric" ||
    ["assessment", "psychometric"].includes(type) ||
    rawHas("assessment")
  ) {
    return "/app/assessment";
  }

  if (useRaw) {
    // Fallback: If rawUrl starts with /app/, use it directly
    if (rawUrl.startsWith("/app/")) {
      return rawUrl;
    }
    return "/app/dashboard";
  }
  return null;
}

export function resolveNavigationTarget(item) {
  if (!item) return "/app/dashboard";
  // Dispatch on the item's type/group first; fall back to URL substrings only
  // when that matches nothing.
  return resolveWith(item, false) ?? resolveWith(item, true);
}
