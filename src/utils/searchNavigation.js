/**
 * Maps a global-search result item (GET /api/search, also used for Career Bee
 * `links`) to the in-app route or external URL it should open.
 * Shared by GlobalSearchBar and the Career Bee assistant so both navigate identically.
 */
export function resolveNavigationTarget(item) {
  if (!item) return "/app/dashboard";

  const group = String(item.group || "").toLowerCase();
  const type = String(item.type || "").toLowerCase();
  const title = encodeURIComponent(item.title || "");
  const id = item.id || item.navigation?.id || "";
  const rawUrl = String(item.navigation?.url || item.navigation?.path || item.route || "").trim();

  // If external URL
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  // 1. Careers / Career Library
  if (
    group === "careers" ||
    ["career", "stream", "category", "secondcategory", "subcategory", "careerpath"].includes(type) ||
    rawUrl.includes("career-library") ||
    rawUrl.includes("careers") ||
    rawUrl.includes("secondcategory") ||
    rawUrl.includes("subcategory")
  ) {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (id) params.set("id", String(id));
    if (item.title) params.set("title", item.title);
    if (item.streamId) params.set("streamId", String(item.streamId));
    if (item.categoryId) params.set("categoryId", String(item.categoryId));
    if (item.secondCategoryId) params.set("secondCategoryId", String(item.secondCategoryId));
    if (item.subCategoryId) params.set("subCategoryId", String(item.subCategoryId));
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
    rawUrl.includes("institution") ||
    rawUrl.includes("institute") ||
    rawUrl.includes("college")
  ) {
    const params = new URLSearchParams();
    if (id) params.set("instituteId", String(id));
    const instituteTitle = item.title || item.name || "";
    if (instituteTitle) params.set("search", instituteTitle);
    return params.size
      ? `/app/institutes?${params.toString()}`
      : "/app/institutes";
  }

  // 3. Entrance Exams
  if (
    group === "entranceexams" ||
    group === "exams" ||
    ["entranceexam", "entranceexams", "exams", "exam"].includes(type) ||
    rawUrl.includes("entranceexam") ||
    rawUrl.includes("entrance-exam") ||
    rawUrl.includes("exam")
  ) {
    return id
      ? `/app/entrance-exam?examId=${encodeURIComponent(id)}&exam=${title}&search=${title}`
      : `/app/entrance-exam?exam=${title}&search=${title}`;
  }

  // 4. Mentors
  if (
    group === "mentors" ||
    ["mentor", "mentors"].includes(type) ||
    rawUrl.includes("mentor")
  ) {
    return id
      ? `/app/book-mentor?mentorId=${encodeURIComponent(id)}&mentor=${title}`
      : `/app/book-mentor?mentor=${title}`;
  }

  // 5. Scholarships
  if (
    group === "scholarships" ||
    ["scholarship", "scholarships"].includes(type) ||
    rawUrl.includes("scholarship")
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
    rawUrl.includes("abroad") ||
    rawUrl.includes("studyabroad")
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
    rawUrl.includes("masterclass") ||
    rawUrl.includes("learn")
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
    rawUrl.includes("quiz")
  ) {
    return id ? `/app/quiz?quizId=${encodeURIComponent(id)}&quiz=${title}` : `/app/quiz`;
  }

  // 9. Newsletters
  if (
    group === "newsletters" ||
    group === "newsletter" ||
    ["newsletter", "newsletters"].includes(type) ||
    rawUrl.includes("newsletter")
  ) {
    return id ? `/app/newsletter?newsletterId=${encodeURIComponent(id)}&title=${title}` : `/app/newsletter`;
  }

  // 10. Assessment
  if (
    group === "assessment" ||
    group === "psychometric" ||
    ["assessment", "psychometric"].includes(type) ||
    rawUrl.includes("assessment")
  ) {
    return "/app/assessment";
  }

  // Fallback: If rawUrl starts with /app/, use it directly
  if (rawUrl.startsWith("/app/")) {
    return rawUrl;
  }

  return "/app/dashboard";
}
