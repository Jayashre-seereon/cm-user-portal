// Which items are free / locked while a module is in PREVIEW mode.
// Used by the module pages AND by global search, so both always agree.
//
// An item is free or locked because of WHAT IT IS, never because of where it happens
// to appear: filtering a list, or pinning a search hit to the top, must not unlock it.
// Each module decides "free" in one of three ways:
//
//   flag   - the server marks each item (scholarships): metadata.isFree
//   list   - the first N items of the module's full, unfiltered list are free
//            (institutes, exams, quiz, mentors, newsletters, study abroad, videos). The
//            pages build that set from their full list with buildFreeKeys(); search loads
//            the same list, in the same order, with loadPreviewFreeKeys(). Videos are
//            "list" AND flag: an item the admin marked free is free as well.
//   server - the page asks the server when the item is opened (career archive).
//
// Keep the `list` loaders in sync with the page they mirror (noted on each).

import { getEntranceExams } from "../api/entranceExamApi";
import { getInstitutes } from "../api/instituteApi";
import { getMasterClasses } from "../api/masterclassApi";
import { getMentors } from "../api/mentorApi";
import { getNewsletters } from "../api/newsletterApi";
import { getQuizzes } from "../api/quizApi";
import { getStudyAbroadCountries } from "../api/studyabroadApi";
import { sortQuizzes } from "./quizOrder";

// How many items a module lists as free in preview.
export const PREVIEW_FREE_ITEM_LIMIT = 4;

const FLAG_ROUTES = new Set(["/app/scholarships"]);
const CACHE_TTL_MS = 5 * 60 * 1000;

// Newest first by createdAt, falling back to the highest id when dates are missing.
// This is the default order of the mentor and video pages.
export function sortNewestFirst(list = []) {
  return [...list].sort((a, b) => {
    if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
    return Number(b.id) - Number(a.id);
  });
}
export const sortMentorsNewestFirst = sortNewestFirst;

// Exported (and overridable) so the ordering can be unit tested.
export const previewListLoaders = {
  // InstitutePage: page 1 of the directory, in server order.
  "/app/institutes": async () => {
    return (await getInstitutes({ page: 1, limit: 30 })).items;
  },
  // EntranceExamPage: API order.
  "/app/entrance-exam": async () => {
    return getEntranceExams();
  },
  // QuizPage: sorted with the shared quiz order.
  "/app/quiz": async () => {
    return sortQuizzes(await getQuizzes());
  },
  // BookMentorPage: active mentors, newest first.
  "/app/book-mentor": async () => {
    const mentors = (await getMentors()).filter((mentor) => mentor?.raw?.status !== false);
    return sortMentorsNewestFirst(mentors);
  },
  // LearnPage (Career & Personality Videos): active videos, newest first (its default sort).
  "/app/learn": async () => {
    return sortNewestFirst(await getMasterClasses());
  },
  // NewsletterPage: newest first.
  "/app/newsletter": async () => {
    return [...(await getNewsletters())].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  },
  // AbroadPage: highest id first.
  "/app/abroad": async () => {
    return [...(await getStudyAbroadCountries())].sort((a, b) => b.id - a.id);
  },
};

function normalizeName(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

// An item is matched by its id. Only an entry with no id falls back to its name, because
// several items can share a name (a same-named institute must not inherit a free slot).
export function itemKeys(entry = {}) {
  if (entry.id !== undefined && entry.id !== null && entry.id !== "") {
    return [`id:${String(entry.id)}`];
  }
  return [entry.name, entry.title]
    .map((label) => normalizeName(label))
    .filter(Boolean)
    .map((normalized) => `name:${normalized}`);
}

// The free items of a module: the first `limit` entries of its FULL, unfiltered list,
// in the order the module shows it by default.
export function buildFreeKeys(list = [], limit = PREVIEW_FREE_ITEM_LIMIT) {
  const keys = new Set();
  list.slice(0, limit).forEach((entry) => itemKeys(entry).forEach((key) => keys.add(key)));
  return keys;
}

// Videos: unlocked only with full access, or when the video is free (one of the 4 newest, or
// marked free by the admin). A video that came back with NO lock flag at all is NOT unlocked,
// so a missing flag (e.g. a request that didn't say which module it was for) can't unlock it.
export function isVideoUnlocked(video, { fullAccess = false, freeKeys } = {}) {
  return (
    fullAccess ||
    video?.accessTier === "full" ||
    Boolean(video?.isFree) ||
    isPreviewFree(freeKeys, video)
  );
}

// Is this item one of the free ones? (`freeKeys` comes from buildFreeKeys)
export function isPreviewFree(freeKeys, entry) {
  return Boolean(freeKeys) && itemKeys(entry).some((key) => freeKeys.has(key));
}

export function getPreviewAccessKind(route) {
  if (FLAG_ROUTES.has(route)) return "flag";
  if (previewListLoaders[route]) return "list";
  return "server";
}

// Newsletters let the server set the preview size; everything else is 4.
export function getPreviewLimit(route, accessResponse) {
  if (route !== "/app/newsletter") return PREVIEW_FREE_ITEM_LIMIT;
  const limit = Number(accessResponse?.previewItemLimit);
  return Number.isFinite(limit) && limit > 0 ? limit : PREVIEW_FREE_ITEM_LIMIT;
}

const cache = new Map();

// Resolves to the set of keys of the free items for a "list" route (cached for a few minutes).
export function loadPreviewFreeKeys(route, limit = PREVIEW_FREE_ITEM_LIMIT) {
  const loader = previewListLoaders[route];
  if (!loader) return Promise.resolve(new Set());

  const cacheKey = `${route}|${limit}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.promise;

  const promise = loader().then((list) => buildFreeKeys(Array.isArray(list) ? list : [], limit));
  cache.set(cacheKey, { at: Date.now(), promise });
  promise.catch(() => cache.delete(cacheKey)); // never cache a failure
  return promise;
}

/**
 * "free"    - the module lists this item as free in preview
 * "locked"  - the module lists it as locked
 * "pending" - a list route whose free items haven't been loaded yet
 * "server"  - the module's page checks with the server when the item is opened
 */
export function resolvePreviewAccess(item, route, { freeKeys } = {}) {
  // Career Archive: a career page is free in preview only when its category is marked free (a
  // locked category locks everything beneath it: 2nd categories, specializations, details). The
  // server reports that on each career search result. A result without the flag (an older
  // server, or a stream - streams themselves are only listings) leaves the decision to the page,
  // which asks the server when it opens.
  if (route === "/app/library") {
    const careerFlag = item?.metadata?.isFree;
    if (typeof careerFlag === "boolean") return careerFlag ? "free" : "locked";
    return "server";
  }

  const kind = getPreviewAccessKind(route);
  if (kind === "server") return "server";

  if (kind === "flag") {
    const isFree = item?.metadata?.isFree ?? item?.isFree;
    return isFree ? "free" : "locked";
  }

  // Videos: an item the admin marked free is free even before the list has loaded.
  if (route === "/app/learn" && (item?.metadata?.isFree ?? item?.isFree)) return "free";

  if (!freeKeys) return "pending";
  return isPreviewFree(freeKeys, item) ? "free" : "locked";
}
