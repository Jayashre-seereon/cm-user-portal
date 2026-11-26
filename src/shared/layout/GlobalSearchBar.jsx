import { loadSearchPlans, matchPlans } from "../../utils/planSearch";
import { getPlans } from "../../api/subscriptionApi";
import { getResultSubtitle } from "../../utils/searchResultSubtitle";
import {
  AppstoreOutlined,
  BookOutlined,
  BulbOutlined,
  CloseCircleFilled,
  EyeOutlined,
  GlobalOutlined,
  LoadingOutlined,
  LockOutlined,
  NotificationOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  RightOutlined,
  SearchOutlined,
  TeamOutlined,
  TrophyOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { globalSearch } from "../../api/searchApi";
import { resolveNavigationTarget } from "../../utils/searchNavigation";
import {
  getPreviewAccessKind,
  getPreviewLimit,
  loadPreviewFreeKeys,
  resolvePreviewAccess,
} from "../../utils/previewAccess";
import { useAppState } from "../../state/AppStateContext";
import { checkModuleAccess } from "../../api/moduleAccessApi";
import { buildDashboardModules, moduleRouteMap } from "../../utils/dashboard";
import { UnlockRedirectModal } from "../../features/portal/components/portalPageShared";
import { moduleCards } from "../../data/careermapData";



// Pages that are searchable as modules but are not dashboard module cards (adding them to
// moduleCards would add a duplicate card on the dashboard).
const SEARCH_ONLY_MODULES = [
  {
    title: "Subscription",
    subtitle: "View subscription plans and unlock premium modules.",
    route: "/app/subscription",
    keywords: ["subscriptions", "plans", "pricing", "premium", "upgrade"],
  },
];
const SEARCHABLE_MODULES = [...moduleCards, ...SEARCH_ONLY_MODULES];
const CATEGORY_TABS = [
  { key: "all", label: "All", groupKey: null },
  { key: "modules", label: "Modules", groupKey: "modules", types: ["module"] },
  { key: "careers", label: "Careers", groupKey: "careers", groupKeys: ["careers", "careerPaths"], types: ["stream", "category", "secondcategory", "subcategory", "careerpath"] },
  { key: "institutions", label: "Colleges", groupKey: "institutions", types: ["institution", "college"] },
  { key: "entranceExams", label: "Exams", groupKey: "entranceExams", types: ["entranceexam", "exam"] },
  { key: "mentors", label: "Mentors", groupKey: "mentors", types: ["mentor"] },
  { key: "scholarships", label: "Scholarships", groupKey: "scholarships", types: ["scholarship"] },
  { key: "studyAbroad", label: "Abroad", groupKey: "studyAbroad", types: ["studyabroad"] },
  { key: "masterclasses", label: "Videos", groupKey: "masterclasses", types: ["masterclass"] },
  { key: "quizzes", label: "Quizzes", groupKey: "quizzes", types: ["quiz"] },
  { key: "newsletters", label: "Career Insights", groupKey: "newsletters", types: ["newsletter"] },
];

function normalizeSearchText(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

const MIN_QUERY_LENGTH = 2;

function getTabGroupKeys(tab) {
  if (Array.isArray(tab.groupKeys)) return tab.groupKeys;
  return tab.groupKey ? [tab.groupKey] : [];
}

// Word-prefix match ("lib" -> "Career Library"), instead of a substring match on
// the space-stripped title where short queries hit unrelated modules.
function matchesWordPrefix(title = "", normalizedQuery = "") {
  if (!normalizedQuery) return false;
  const words = String(title)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  return words.some((_, index) => words.slice(index).join("").startsWith(normalizedQuery));
}

function getTypeConfig(item = {}) {
  const type = String(item.type || "").toLowerCase();
  const group = String(item.group || "").toLowerCase();

  if (type === "module" || group === "modules") {
    return {
      label: item.isPlan ? "Plan" : "Module",
      badgeClass: "bg-[#fdf0ee] text-[#9a2119] border-[#f2d1c7]",
      avatarBg: "#9a2119",
      icon: <AppstoreOutlined />,
    };
  }

  if (["stream", "category", "secondcategory", "subcategory", "careerpath"].includes(type) || group === "careers") {
    return {
      label: item.badge || (type === "secondcategory" ? "Subfield" : type === "stream" ? "Stream" : type === "careerpath" ? "Path" : "Career"),
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      avatarBg: "#8856c9",
      icon: <BookOutlined />,
    };
  }
  if (type === "institution" || group === "institutions" || group === "colleges") {
    return {
      label: item.badge || "College",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      avatarBg: "#3774d8",
      icon: <AppstoreOutlined />,
    };
  }
  if (type === "entranceexam" || group === "entranceexams" || group === "exams") {
    return {
      label: item.badge || "Exam",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      avatarBg: "#ea872e",
      icon: <BulbOutlined />,
    };
  }
  if (type === "mentor" || group === "mentors") {
    return {
      label: item.badge || "Mentor",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      avatarBg: "#2f9367",
      icon: <TeamOutlined />,
    };
  }
  if (type === "scholarship" || group === "scholarships") {
    return {
      label: item.badge || "Scholarship",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      avatarBg: "#d9608f",
      icon: <TrophyOutlined />,
    };
  }
  if (type === "studyabroad" || group === "studyabroad") {
    return {
      label: item.badge || "Study Abroad",
      badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
      avatarBg: "#2d8c83",
      icon: <GlobalOutlined />,
    };
  }
  if (type === "masterclass" || group === "masterclasses") {
    return {
      label: item.badge || "Video",
      badgeClass: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
      avatarBg: "#c026d3",
      icon: <ReadOutlined />,
    };
  }
  if (type === "quiz" || group === "quizzes") {
    return {
      label: item.badge || "Quiz",
      badgeClass: "bg-yellow-50 text-yellow-800 border-yellow-200",
      avatarBg: "#cb9c48",
      icon: <QuestionCircleOutlined />,
    };
  }
  if (type === "newsletter" || group === "newsletters") {
    return {
      label: item.badge || "Career Insights",
      badgeClass: "bg-red-50 text-[#9a2119] border-red-200",
      avatarBg: "#9a2119",
      icon: <NotificationOutlined />,
    };
  }

  return {
    label: item.badge || item.type || "Explore",
    badgeClass: "bg-[#fdf0ee] text-[#9a2119] border-[#f2d1c7]",
    avatarBg: "#9a2119",
    icon: <SearchOutlined />,
  };
}

function ItemThumbnail({ item, config }) {
  const [imageError, setImageError] = useState(false);
  const title = item.title || "";
  const initial = title.trim().charAt(0).toUpperCase() || "C";

  if (item.image && !imageError) {
    return (
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-gray-100 shadow-sm">
        <img
          src={item.image}
          alt={title}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: config.avatarBg }}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
    >
      <span className="text-[14px] font-bold">{initial}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Module access (lock / preview) for search results
//
// The dashboard marks every module Unlocked / Preview / Locked. A search result
// that opens one specific page inside a module (an exam, institute, scholarship,
// career, ...) must follow the same rules as that module's own list:
//   Locked module   -> every result is locked.
//   Preview module  -> each result is free or locked exactly as the module list shows
//                      it (see utils/previewAccess.js), so search is neither a back door
//                      into locked pages nor a false lock on free ones.
//   Unlocked module -> open.
// ---------------------------------------------------------------------------
const MODULE_ROUTES = new Set(
  Object.values(moduleRouteMap).filter((route) => route !== "/app/subscription")
);

const LOCKED_BADGE = {
  label: "Locked",
  locked: true,
  icon: <LockOutlined />,
  className: "border-red-200 bg-red-50 text-red-700",
};

const PREVIEW_BADGE = {
  label: "Preview",
  locked: false,
  icon: <EyeOutlined />,
  className: "border-blue-200 bg-blue-50 text-blue-700",
};

const FREE_BADGE = {
  label: "Unlocked",
  locked: false,
  icon: <UnlockOutlined />,
  className: "border-green-200 bg-green-50 text-green-700",
};

// Shown while a preview module's free items are still loading, instead of nothing (which
// would look like "unlocked").
const CHECKING_BADGE = {
  label: "Checking",
  locked: false,
  icon: <LoadingOutlined spin />,
  className: "border-gray-200 bg-gray-50 text-gray-500",
};

// Lists small enough to load as soon as the search box opens (not the large exam list).
const WARM_PREVIEW_ROUTES = [
  "/app/institutes",
  "/app/quiz",
  "/app/abroad",
  "/app/newsletter",
  "/app/book-mentor",
  "/app/learn",
];

const PREVIEW_LOCK_MESSAGE =
  "This page is locked. Please purchase a subscription to open";
const VERIFY_FAILED_MESSAGE =
  "We couldn't verify your access right now. Please try again in a moment.";

function normalizeAccessStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "unlocked" || value === "full") return "unlocked";
  if (value === "preview") return "preview";
  if (value === "locked") return "locked";
  return null;
}

// Search results that open one specific page inside a module (not a module card).
function isDirectSearchResult(item = {}) {
  const itemType = String(item.type || "").toLowerCase();
  const itemGroup = String(item.group || "").toLowerCase();
  const isInstituteResult =
    ["institution", "institute", "institutes", "college", "colleges"].includes(itemType) ||
    ["institutions", "colleges"].includes(itemGroup);
  const isExamResult =
    ["entranceexam", "entranceexams", "exam", "exams"].includes(itemType) ||
    ["entranceexams", "exams"].includes(itemGroup);
  const isScholarshipResult =
    ["scholarship", "scholarships"].includes(itemType) || itemGroup === "scholarships";
  const isVideoResult =
    ["masterclass", "masterclasses", "learn", "video", "videos"].includes(itemType) ||
    ["masterclasses", "learn", "videos"].includes(itemGroup);
  const isQuizResult = ["quiz", "quizzes"].includes(itemType) || itemGroup === "quizzes";
  const isNewsletterResult =
    ["newsletter", "newsletters"].includes(itemType) || itemGroup === "newsletters";
  const isStudyAbroadResult =
    ["studyabroad", "study_abroad", "abroad"].includes(itemType) ||
    ["studyabroad", "study_abroad", "abroad"].includes(itemGroup);
  const isMentorResult = ["mentor", "mentors"].includes(itemType) || itemGroup === "mentors";
  const isCareerResult =
    ["careers", "career"].includes(itemGroup) ||
    ["career", "stream", "category", "secondcategory", "subcategory", "careerpath"].includes(itemType);
  return (
    isCareerResult ||
    isInstituteResult ||
    isExamResult ||
    isScholarshipResult ||
    isMentorResult ||
    isVideoResult ||
    isQuizResult ||
    isNewsletterResult ||
    isStudyAbroadResult
  );
}

// In-app path a result opens (without query string), or null for external links.
function getSearchResultPath(item) {
  const url = resolveNavigationTarget(item);
  if (!url || /^https?:\/\//i.test(url)) return null;
  return url.split("?")[0].replace(/\/$/, "");
}

// Module access checks (POST /module-access/check is read-only), started as soon as results
// show so a click doesn't have to wait for one. A result older than ACCESS_CHECK_TTL_MS is
// asked again, and failures are never cached.
const ACCESS_CHECK_TTL_MS = 15000;
const accessCheckCache = new Map();
function getModuleAccessFresh(moduleId) {
  const key = String(moduleId);
  const cached = accessCheckCache.get(key);
  if (cached && Date.now() - cached.at < ACCESS_CHECK_TTL_MS) return cached.promise;
  const at = Date.now();
  const promise = checkModuleAccess(moduleId).then((response) => ({ response, checkedAt: at }));
  accessCheckCache.set(key, { at, promise });
  promise.catch(() => {
    if (accessCheckCache.get(key)?.promise === promise) accessCheckCache.delete(key);
  });
  return promise;
}

export default function GlobalSearchBar({ className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { dashboardData } = useAppState();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [searchData, setSearchData] = useState({
    total: 0,
    results: [],
    grouped: {},
    query: "",
  });
  const [lockedModule, setLockedModule] = useState(null);

  // Dashboard modules (with their Unlocked / Preview / Locked status) keyed by route
  const moduleByRoute = useMemo(() => {
    const map = new Map();
    buildDashboardModules(dashboardData?.modules || []).forEach((module) => {
      if (!map.has(module.route)) map.set(module.route, module);
    });
    return map;
  }, [dashboardData]);

  // Free items of each preview module whose list decides "first N are free", keyed by
  // route. `false` marks a failed load so a result can stop saying "Checking".
  const [freeKeysByRoute, setFreeKeysByRoute] = useState({});

  // Load one module's free items (loadPreviewFreeKeys caches them for a few minutes).
  function fetchFreeKeys(route, isActive) {
    loadPreviewFreeKeys(route)
      .then((keys) => {
        if (isActive()) {
          setFreeKeysByRoute((prev) => (prev[route] === keys ? prev : { ...prev, [route]: keys }));
        }
      })
      .catch((error) => {
        console.error("Could not load free preview items:", error);
        if (isActive()) {
          setFreeKeysByRoute((prev) => (prev[route] === false ? prev : { ...prev, [route]: false }));
        }
      });
  }

  // Results from a preview module: make sure that module's free items are known.
  useEffect(() => {
    const routes = new Set();
    searchData.results.forEach((item) => {
      if (!isDirectSearchResult(item)) return;
      const path = getSearchResultPath(item);
      const status = normalizeAccessStatus(path ? moduleByRoute.get(path)?.accessStatus : null);
      if (status === "preview" && getPreviewAccessKind(path) === "list") routes.add(path);
    });

    let active = true;
    routes.forEach((route) => fetchFreeKeys(route, () => active));
    return () => {
      active = false;
    };
  }, [searchData.results, moduleByRoute]);

  // Check access for the modules in the results now, so opening one doesn't wait for it.
  useEffect(() => {
    const ids = new Set();
    searchData.results.forEach((item) => {
      const path = getSearchResultPath(item);
      const module = path && path !== "/app/assessment" ? moduleByRoute.get(path) : null;
      if (module?.id) ids.add(module.id);
    });
    ids.forEach((moduleId) => getModuleAccessFresh(moduleId).catch(() => {}));
  }, [searchData.results, moduleByRoute]);

  // When the search box opens, warm up the small lists so results can show Unlocked /
  // Locked straight away (the large exam list is only loaded once an exam result appears).
  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    WARM_PREVIEW_ROUTES.forEach((route) => {
      if (normalizeAccessStatus(moduleByRoute.get(route)?.accessStatus) === "preview") {
        fetchFreeKeys(route, () => active);
      }
    });
    return () => {
      active = false;
    };
  }, [isOpen, moduleByRoute]);

  // Badge shown on a result, mirroring the module cards and lists.
  function getAccessBadge(item) {
    const path = getSearchResultPath(item);
    // The assessment page is always enterable (past reports); it handles its own lock.
    if (path === "/app/assessment") return null;
    const module = path ? moduleByRoute.get(path) : null;
    const status = normalizeAccessStatus(module?.accessStatus);
    if (!status || status === "unlocked") return null;
    if (status === "locked") return LOCKED_BADGE;

    // Preview module: the module card itself is enterable, like on the dashboard.
    if (String(item.type || "").toLowerCase() === "module") return PREVIEW_BADGE;
    if (!isDirectSearchResult(item)) return null;

    // A specific page: free or locked exactly as the module's own list shows it.
    const freeKeys = freeKeysByRoute[path];
    const access = resolvePreviewAccess(item, path, { freeKeys: freeKeys || undefined });
    if (access === "locked") return LOCKED_BADGE;
    if (access === "free") return FREE_BADGE;
    if (access === "pending") return freeKeys === false ? null : CHECKING_BADGE;
    return null; // the module's page checks with the server when the item is opened
  }

  // Debounced API search effect
  useEffect(() => {
    const trimmed = query.trim();

    // Invalidate any request still in flight for an older query.
    const requestId = ++requestIdRef.current;

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setIsLoading(false);
      setSearchData({ total: 0, results: [], grouped: {}, query: "" });
      if (!trimmed) setActiveTab("all");
      return;
    }

    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const response = await globalSearch({
          query: trimmed,
          type: "all",
          limit: 25,
          signal: controller.signal,
        });

        if (requestId !== requestIdRef.current) return;
        if (response && response.success !== false) {
          const entityResults = Array.isArray(response.results) ? response.results : [];
          const normalizedQuery = normalizeSearchText(trimmed);
          const groupedInstitutes = Array.isArray(response.grouped?.institutions)
            ? response.grouped.institutions
            : Array.isArray(response.grouped?.colleges)
            ? response.grouped.colleges
            : [];
          const instituteResults = [...groupedInstitutes, ...entityResults.filter((item) =>
            ["institution", "institute", "institutes", "college", "colleges"].includes(String(item.type || "").toLowerCase()) ||
            ["institutions", "colleges"].includes(String(item.group || "").toLowerCase())
          )];
          const localInstituteMatches = instituteResults.filter((item) => {
            const name = normalizeSearchText(item.title || item.name || "");
            return normalizedQuery && name.includes(normalizedQuery);
          });
          // Same-name institutions are collapsed by normalised name + location
          const normalizedInstituteResults = [...new Map(
            [...localInstituteMatches, ...instituteResults].map((item) => [
              `${normalizeSearchText(item.title || item.name || "")}|${
                normalizeSearchText(item.state || item.subtitle || "") ||
                String(item.id ?? item.navigation?.id ?? "")
              }`,
              item,
            ])
          ).values()];
          const nonInstituteResults = entityResults.filter((item) => !instituteResults.includes(item));
          const mergedEntityResults = [...nonInstituteResults, ...normalizedInstituteResults];
          const moduleResults = SEARCHABLE_MODULES
            .filter((module) =>
              [module.title, ...(module.keywords || [])].some((text) => matchesWordPrefix(text, normalizedQuery))
            )
            .map((module) => ({
              id: `module:${module.route}`,
              title: module.title,
              subtitle: module.subtitle,
              type: "module",
              group: "modules",
              badge: "Module",
              navigation: { path: module.route },
            }));
          // Subscription plans (name / price / validity / modules), cached between searches.
          const plans = await loadSearchPlans(getPlans);
          if (requestId !== requestIdRef.current) return;
          moduleResults.push(...matchPlans(plans, trimmed, "/app/subscription"));
          const results = [...moduleResults, ...mergedEntityResults];
          const grouped = { ...(response.grouped || {}) };
          if (normalizedInstituteResults.length) grouped.institutions = normalizedInstituteResults;
          grouped.modules = moduleResults;
          const total = results.length;

          setSearchData({
            total,
            results,
            grouped,
            query: trimmed,
          });
          setHighlightedIndex(0);
        }
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("Global search error:", err);
        }
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter results according to active tab
  const filteredResults = useMemo(() => {
    const { results = [], grouped = {} } = searchData;

    if (activeTab === "all") {
      return results;
    }

    const currentTabConfig = CATEGORY_TABS.find((t) => t.key === activeTab);
    if (!currentTabConfig) return results;

    // Check grouped object first (a tab can span several groups, e.g. careers + careerPaths)
    const groupedItems = getTabGroupKeys(currentTabConfig).flatMap((key) =>
      Array.isArray(grouped[key]) ? grouped[key] : []
    );
    if (groupedItems.length > 0) {
      return groupedItems;
    }

    // Fallback to filtering results array
    return results.filter((item) => {
      const itemGroup = String(item.group || "").toLowerCase();
      const itemType = String(item.type || "").toLowerCase();

      if (getTabGroupKeys(currentTabConfig).some((key) => itemGroup === key.toLowerCase())) {
        return true;
      }
      if (currentTabConfig.types && currentTabConfig.types.includes(itemType)) {
        return true;
      }
      return false;
    });
  }, [searchData, activeTab]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = { all: searchData.results.length };
    CATEGORY_TABS.forEach((tab) => {
      if (tab.key === "all") return;
      const tabGroupKeys = getTabGroupKeys(tab);
      if (tabGroupKeys.some((key) => Array.isArray(searchData.grouped?.[key]))) {
        counts[tab.key] = tabGroupKeys.reduce(
          (sum, key) => sum + (Array.isArray(searchData.grouped?.[key]) ? searchData.grouped[key].length : 0),
          0
        );
      } else {
        counts[tab.key] = searchData.results.filter((item) => {
          const itemGroup = String(item.group || "").toLowerCase();
          const itemType = String(item.type || "").toLowerCase();
          return (
            tabGroupKeys.some((key) => itemGroup === key.toLowerCase()) ||
            (tab.types && tab.types.includes(itemType))
          );
        }).length;
      }
    });
    return counts;
  }, [searchData]);

  // Available tabs (show tabs that have results or are standard)
  const visibleTabs = useMemo(() => {
    if (!query.trim() || searchData.results.length === 0) {
      return CATEGORY_TABS.slice(0, 6);
    }
    return CATEGORY_TABS.filter((tab) => tab.key === "all" || tabCounts[tab.key] > 0);
  }, [query, searchData, tabCounts]);

  // Fall back to "All" when the selected tab has no results for the new query
  useEffect(() => {
    if (activeTab !== "all" && !visibleTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab("all");
    }
  }, [activeTab, visibleTabs]);

  // Keep the keyboard highlight inside the (possibly shorter) list
  useEffect(() => {
    setHighlightedIndex((prev) => Math.min(prev, Math.max(filteredResults.length - 1, 0)));
  }, [filteredResults.length]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [activeTab]);

  async function handleSelectItem(item) {
    if (!item) return;
    const resolvedUrl = resolveNavigationTarget(item);
    const resolvedPath = resolvedUrl.split("?")[0].replace(/\/$/, "");
    const itemType = String(item.type || "").toLowerCase();
    const isDirectResult = isDirectSearchResult(item);
    const returnTo = `${location.pathname}${location.search}`;
    const searchNavigationState = {
      fromGlobalSearch: isDirectResult,
      returnTo,
      ...(isDirectResult ? { searchItem: item } : {}),
    };
    const openModuleLanding =
      itemType === "module" ||
      (!isDirectResult && ["/app/institutes", "/app/scholarships", "/app/entrance-exam", "/app/learn", "/app/quiz", "/app/newsletter", "/app/abroad"].includes(resolvedPath));
    // Search entities in these modules should open the module's full listing,
    // not auto-select one result via query params or searchItem state.
    const targetUrl = openModuleLanding ? resolvedPath : resolvedUrl;
    setIsOpen(false);
    setQuery("");
    setSearchData({ total: 0, results: [], grouped: {}, query: "" });

    if (/^https?:\/\//i.test(targetUrl)) {
      window.location.href = targetUrl;
    } else {
      const targetPath = targetUrl.split("?")[0].replace(/\/$/, "");
      const targetModule = moduleByRoute.get(targetPath);
      // The assessment page handles its own lock state, so it is never blocked here.
      if (targetModule?.id && targetPath !== "/app/assessment") {
        try {
          const { response, checkedAt } = await getModuleAccessFresh(targetModule.id);
          if (!response?.allowed) {
            setLockedModule({ title: targetModule.title });
            return;
          }
          // In preview, a specific page opens from search only if the module's own list
          // shows that item as free. The page itself can't be trusted to enforce this: some
          // pages pin the searched item to the top of their list, which makes it look free.
          if (isDirectResult && response.mode !== "full") {
            const kind = getPreviewAccessKind(targetPath);
            const freeKeys =
              kind === "list"
                ? await loadPreviewFreeKeys(targetPath, getPreviewLimit(targetPath, response))
                : undefined;
            const access = resolvePreviewAccess(item, targetPath, { freeKeys });
            if (access === "locked") {
              setLockedModule({
                title: targetModule.title,
                itemLabel: item.title,
                message: PREVIEW_LOCK_MESSAGE,
              });
              return;
            }
          }
          navigate(targetUrl, {
            state: {
              moduleId: targetModule.id,
              accessStatus: response.mode || "full",
              accessCheckedAt: checkedAt,
              ...searchNavigationState,
            },
          });
        } catch (error) {
          console.error("Could not validate module access:", error);
          if (isDirectResult) {
            // Can't confirm access -> don't open the inner page.
            setLockedModule({
              title: targetModule.title,
              itemLabel: "",
              heading: "Unable to verify access",
              message: VERIFY_FAILED_MESSAGE,
            });
            return;
          }
          navigate(targetUrl, {
            state: { moduleId: targetModule.id, ...searchNavigationState },
          });
        }
        return;
      }
      if (isDirectResult && MODULE_ROUTES.has(targetPath) && targetPath !== "/app/assessment") {
        // Module access hasn't loaded yet (or failed to) -> don't let search bypass the lock.
        setLockedModule({
          title: item.title,
          itemLabel: "",
          heading: "Unable to verify access",
          message: VERIFY_FAILED_MESSAGE,
        });
        return;
      }
      navigate(targetUrl, { state: searchNavigationState });
    }
  }

  function handleKeyDown(e) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % filteredResults.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Ignore Enter while results are loading or belong to an older query
      if (isLoading || searchData.query !== query.trim()) return;
      if (filteredResults.length > 0) {
        handleSelectItem(filteredResults[Math.min(highlightedIndex, filteredResults.length - 1)]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  function handleClear() {
    setQuery("");
    setSearchData({ total: 0, results: [], grouped: {}, query: "" });
    setActiveTab("all");
    inputRef.current?.focus();
  }

  const hasQuery = Boolean(query.trim());
  const hasResults = filteredResults.length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 flex items-center justify-center text-[#9b8f97]">
          {isLoading ? (
            <LoadingOutlined className="animate-spin text-[14px] text-[#9a2119]" />
          ) : (
            <SearchOutlined className="text-[14px]" />
          )}
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search careers, colleges, exams, mentors..."
          className="h-10 w-full rounded-full border border-[#eaded9] bg-[#faf7f5] pl-9 pr-14 text-[13px] text-[#241d1e] placeholder-[#9b8f97] shadow-sm transition-all duration-200 focus:border-[#9a2119] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9a2119]/10"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {hasQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition hover:text-gray-600"
              title="Clear search"
            >
              <CloseCircleFilled className="text-[13px]" />
            </button>
          )}

          {!hasQuery && (
            <span className="hidden items-center rounded border border-[#eaded9] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#9b8f97] md:inline-flex">
              ⌘K
            </span>
          )}
        </div>
      </div>

      {/* Dropdown Results Box */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[520px] min-w-[340px] overflow-hidden rounded-2xl border border-[#eaded9] bg-white shadow-2xl transition-all sm:min-w-[440px] md:min-w-[500px]">
          {/* Category Filter Tabs (visible when searching) */}
          {hasQuery && (
            <div className="border-b border-[#f2e9e6] bg-[#faf7f5]/80 px-2 py-1.5 backdrop-blur">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {visibleTabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const count = tabCounts[tab.key] ?? 0;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setActiveTab(tab.key);
                        setHighlightedIndex(0);
                      }}
                      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-all ${
                        isActive
                          ? "bg-[#9a2119] text-white shadow-sm"
                          : "text-[#6f6570] hover:bg-[#efe3de] hover:text-[#241d1e]"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {count > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                            isActive ? "bg-white/20 text-white" : "bg-[#efe3de] text-[#6f6570]"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results List or Empty/Initial States */}
          <div className="max-h-[420px] overflow-y-auto p-2">
            {/* 1. Loading State (initial fetch) */}
            {isLoading && !hasResults && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <LoadingOutlined className="text-2xl text-[#9a2119]" />
                <span className="mt-3 text-[13px] font-medium text-[#6f6570]">
                  Searching the career universe...
                </span>
              </div>
            )}

            {/* 2. Search Results List */}
            {hasQuery && hasResults && (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2.5 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#aa8a83]">
                  <span>{activeTab === "all" ? "Top Matches" : `${CATEGORY_TABS.find((t) => t.key === activeTab)?.label || "Results"}`}</span>
                  <span>{filteredResults.length} {filteredResults.length === 1 ? "result" : "results"}</span>
                </div>

                {filteredResults.map((item, index) => {
                  const config = getTypeConfig(item);
                  const isHighlighted = highlightedIndex === index;
                  const accessBadge = getAccessBadge(item);

                  return (
                    <div
                      key={`${item.type}:${item.id || item.title}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectItem(item);
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`group flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2.5 transition-all duration-150 ${
                        isHighlighted
                          ? "bg-[#fdf0ed] shadow-sm ring-1 ring-[#9a2119]/20"
                          : "hover:bg-[#faf4f2]"
                      }`}
                    >
                      {/* Left thumbnail */}
                      <ItemThumbnail item={item} config={config} />

                      {/* Middle content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13.5px] font-semibold text-[#241d1e] group-hover:text-[#9a2119]">
                            {item.title}
                          </span>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badgeClass}`}
                          >
                            {config.label}
                          </span>
                          {accessBadge && (
                            <span
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${accessBadge.className}`}
                            >
                              {accessBadge.icon}
                              {accessBadge.label}
                            </span>
                          )}
                        </div>

                        {getResultSubtitle(item) && (
                          <div className="truncate text-[11.5px] text-[#8c6c67]">
                            {getResultSubtitle(item)}
                          </div>
                        )}

                        {item.description && !getResultSubtitle(item) && (
                          <div className="truncate text-[11.5px] text-[#8c6c67]">
                            {item.description}
                          </div>
                        )}
                      </div>

                      {/* Right: lock for locked pages, chevron otherwise */}
                      {accessBadge?.locked ? (
                        <div className="shrink-0 text-red-400">
                          <LockOutlined className="text-[13px]" />
                        </div>
                      ) : (
                        <div className="shrink-0 text-gray-300 transition-colors group-hover:text-[#9a2119]">
                          <RightOutlined className="text-[12px]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Empty State */}
            {hasQuery && !isLoading && !hasResults && query.trim().length < MIN_QUERY_LENGTH && (
              <div className="py-8 text-center text-[12px] text-[#8c6c67]">
                Type at least {MIN_QUERY_LENGTH} characters to search.
              </div>
            )}

            {hasQuery && !isLoading && !hasResults && query.trim().length >= MIN_QUERY_LENGTH && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#fdf0ed] text-[#9a2119]">
                  <SearchOutlined className="text-xl" />
                </div>
                <div className="text-[14px] font-semibold text-[#241d1e]">
                  No results found for &ldquo;{query}&rdquo;
                </div>
                <p className="mt-1 text-[12px] text-[#8c6c67]">
                  Try searching with different keywords like &ldquo;Engineering&rdquo;, &ldquo;Medical&rdquo;, or &ldquo;Scholarship&rdquo;.
                </p>
              </div>
            )}

          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between border-t border-[#f2e9e6] bg-[#faf7f5] px-3.5 py-2 text-[11px] text-[#8c6c67]">
            <span className="flex items-center gap-1.5">
              <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-sm">↑↓</span> to navigate
              <span className="ml-2 rounded bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-sm">↵</span> to select
              <span className="ml-2 rounded bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-sm">esc</span> to close
            </span>
            <span>Global Search</span>
          </div>
        </div>
      )}
      <UnlockRedirectModal
        open={Boolean(lockedModule)}
        title={lockedModule?.heading || "Module Locked"}
        itemLabel={lockedModule?.itemLabel ?? lockedModule?.title}
        description={
          lockedModule?.message ||
          "This module is locked. Please purchase a subscription to continue accessing this module."
        }
        onCancel={() => setLockedModule(null)}
        onConfirm={() => {
          setLockedModule(null);
          navigate("/app/subscription");
        }}
      />
    </div>
  );
}
