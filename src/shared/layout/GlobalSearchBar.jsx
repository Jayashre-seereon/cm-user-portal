import {
  AppstoreOutlined,
  BookOutlined,
  BulbOutlined,
  CloseCircleFilled,
  GlobalOutlined,
  LoadingOutlined,
  NotificationOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  RightOutlined,
  SearchOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { globalSearch } from "../../api/searchApi";
import { resolveNavigationTarget } from "../../utils/searchNavigation";

const CATEGORY_TABS = [
  { key: "all", label: "All", groupKey: null },
  { key: "careers", label: "Careers", groupKey: "careers", types: ["stream", "category", "secondcategory", "subcategory", "careerpath"] },
  { key: "institutions", label: "Colleges", groupKey: "institutions", types: ["institution", "college"] },
  { key: "entranceExams", label: "Exams", groupKey: "entranceExams", types: ["entranceexam", "exam"] },
  { key: "mentors", label: "Mentors", groupKey: "mentors", types: ["mentor"] },
  { key: "scholarships", label: "Scholarships", groupKey: "scholarships", types: ["scholarship"] },
  { key: "studyAbroad", label: "Abroad", groupKey: "studyAbroad", types: ["studyabroad"] },
  { key: "masterclasses", label: "Videos", groupKey: "masterclasses", types: ["masterclass"] },
  { key: "quizzes", label: "Quizzes", groupKey: "quizzes", types: ["quiz"] },
  { key: "newsletters", label: "Career Insights", groupKey: "newsletters", types: ["newsletter"] },
];

const POPULAR_SHORTCUTS = [
  { label: "Engineering Careers", query: "Engineering", group: "careers", route: "/app/library" },
  { label: "Top Colleges", query: "Institute", group: "institutions", route: "/app/institutes" },
  { label: "Entrance Exams", query: "Exam", group: "entranceExams", route: "/app/entrance-exam" },
  { label: "1-on-1 Mentorship", query: "Mentor", group: "mentors", route: "/app/book-mentor" },
  { label: "Scholarships", query: "Scholarship", group: "scholarships", route: "/app/scholarships" },
];

function getTypeConfig(item = {}) {
  const type = String(item.type || "").toLowerCase();
  const group = String(item.group || "").toLowerCase();

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

export default function GlobalSearchBar({ className = "" }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [searchData, setSearchData] = useState({
    total: 0,
    results: [],
    grouped: {},
  });

  // Debounced API search effect
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setIsLoading(false);
      setSearchData({ total: 0, results: [], grouped: {} });
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

        if (response && response.success !== false) {
          const results = Array.isArray(response.results) ? response.results : [];
          const grouped = response.grouped || {};
          const total = typeof response.total === "number" ? response.total : results.length;

          setSearchData({
            total,
            results,
            grouped,
          });
          setHighlightedIndex(0);
        }
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("Global search error:", err);
        }
      } finally {
        setIsLoading(false);
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

    // Check grouped object first
    if (currentTabConfig.groupKey && Array.isArray(grouped[currentTabConfig.groupKey]) && grouped[currentTabConfig.groupKey].length > 0) {
      return grouped[currentTabConfig.groupKey];
    }

    // Fallback to filtering results array
    return results.filter((item) => {
      const itemGroup = String(item.group || "").toLowerCase();
      const itemType = String(item.type || "").toLowerCase();

      if (currentTabConfig.groupKey && itemGroup === currentTabConfig.groupKey.toLowerCase()) {
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
      if (tab.groupKey && Array.isArray(searchData.grouped?.[tab.groupKey])) {
        counts[tab.key] = searchData.grouped[tab.groupKey].length;
      } else {
        counts[tab.key] = searchData.results.filter((item) => {
          const itemGroup = String(item.group || "").toLowerCase();
          const itemType = String(item.type || "").toLowerCase();
          return (
            (tab.groupKey && itemGroup === tab.groupKey.toLowerCase()) ||
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

  function handleSelectItem(item) {
    if (!item) return;
    const targetUrl = resolveNavigationTarget(item);
    setIsOpen(false);
    setQuery("");
    setSearchData({ total: 0, results: [], grouped: {} });

    if (/^https?:\/\//i.test(targetUrl)) {
      window.location.href = targetUrl;
    } else {
      navigate(targetUrl, { state: { searchItem: item } });
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
      if (filteredResults.length > 0) {
        handleSelectItem(filteredResults[highlightedIndex] || filteredResults[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  function handleClear() {
    setQuery("");
    setSearchData({ total: 0, results: [], grouped: {} });
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

                  return (
                    <div
                      key={`${item.id || item.title}-${item.type}-${index}`}
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
                        </div>

                        {item.subtitle && (
                          <div className="truncate text-[11.5px] text-[#8c6c67]">
                            {item.subtitle}
                          </div>
                        )}

                        {item.description && !item.subtitle && (
                          <div className="truncate text-[11.5px] text-[#8c6c67]">
                            {item.description}
                          </div>
                        )}
                      </div>

                      {/* Right Chevron */}
                      <div className="shrink-0 text-gray-300 transition-colors group-hover:text-[#9a2119]">
                        <RightOutlined className="text-[12px]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Empty State */}
            {hasQuery && !isLoading && !hasResults && (
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

            {/* 4. Initial Focus State (Quick Shortcuts / Popular Searches) */}
            {!hasQuery && (
              <div className="p-2">
                <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[#aa8a83]">
                  Popular Categories & Quick Links
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {POPULAR_SHORTCUTS.map((shortcut) => (
                    <button
                      key={shortcut.label}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setQuery(shortcut.query);
                      }}
                      className="flex items-center gap-2.5 rounded-xl border border-[#eaded9] bg-[#faf7f5] p-2.5 text-left transition hover:border-[#9a2119] hover:bg-[#fdf0ed]"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#9a2119] text-white">
                        <SearchOutlined className="text-[11px]" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-semibold text-[#241d1e]">
                          {shortcut.label}
                        </div>
                        <div className="text-[10.5px] text-[#8c6c67]">
                          Search &ldquo;{shortcut.query}&rdquo;
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
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
    </div>
  );
}
