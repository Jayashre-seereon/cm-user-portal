import { useEffect, useMemo, useState } from "react";
import { Alert } from "antd";
import {
  CalendarOutlined,
  ArrowRightOutlined,
   LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { UnlockRedirectModal } from "../../portal/components/portalPageShared";
import { getEntranceExams ,getCategories} from "../../../api/entranceExamApi";
import { entranceExams as fallbackEntranceExams } from "../../../data/careermapData";
import { ModuleScreen, PageHero } from "../../../components/ui";
import { usePortalNavigation } from "../../portal/components/portalPageShared";
import { checkModuleAccess } from "../../../api/moduleAccessApi";
import { Select } from "antd";
const { Option } = Select;


export default function EntranceExamPage() {
  const { goToDashboard } = usePortalNavigation();
  const location = useLocation();
  const navigate = useNavigate();

  const accessStatus = location.state?.accessStatus || "preview";
  const isSubscribed = accessStatus === "unlocked";

  const [unlockModalItem, setUnlockModalItem] = useState(null);
  const [items, setItems] = useState(fallbackEntranceExams);
  const [error, setError] = useState("");
  const [moduleMode, setModuleMode] = useState(accessStatus);
 const [selectedExam, setSelectedExam] = useState(null);
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(""); 
  const [mode, setMode] = useState("");
// LOAD ENTRANCE EXAMS

useEffect(() => {
  let active = true;

  async function loadExams() {
    try {
      setError("");

      const response = await getEntranceExams();

      console.log("Entrance Exams API Response:", response);

      if (active) {
        setItems(
          Array.isArray(response) && response.length > 0
            ? response
            : fallbackEntranceExams
        );
      }
    } catch (loadError) {
      console.error("Failed to load entrance exams:", loadError);

      if (active) {
        setError(
          loadError?.response?.data?.message ||
          loadError?.message ||
          "Failed to load entrance exams."
        );

        // Keep fallback data if API fails
        setItems(fallbackEntranceExams);
      }
    }
  }

  loadExams();

  return () => {
    active = false;
  };
}, []);

// LOAD CATEGORIES
useEffect(() => {
  let active = true;

  async function loadCategories() {
    try {
      const response = await getCategories();

      console.log("Categories API Response:", response);

      if (active) {
        setCategories(
          Array.isArray(response?.data)
            ? response.data
            : []
        );
      }
    } catch (error) {
      console.error("Failed to load categories:", error);

      if (active) {
        setCategories([]);
      }
    }
  }

  loadCategories();

  return () => {
    active = false;
  };
}, []);

  useEffect(() => {
    let active = true;

    async function loadAccessMode() {
      const moduleId = location.state?.moduleId;
      if (!moduleId) return;

      try {
        const response = await checkModuleAccess(moduleId);
        if (active && response?.mode) {
          setModuleMode(response.mode);
        }
      } catch {
        if (active) {
          setModuleMode(accessStatus);
        }
      }
    }

    loadAccessMode();
    return () => {
      active = false;
    };
  }, [accessStatus, location.state?.moduleId]);

  // Auto-open exam details when navigated from Global Search or URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const examId = searchParams.get("examId") || location.state?.searchItem?.id;
    const examName =
      searchParams.get("exam") ||
      searchParams.get("search") ||
      location.state?.searchItem?.title;

    if (!examId && !examName) return;

    if (items.length > 0) {
      const found = items.find(
        (item) =>
          (examId && String(item.id) === String(examId)) ||
          (examName &&
            (item.name?.toLowerCase() === examName.toLowerCase() ||
              item.title?.toLowerCase() === examName.toLowerCase()))
      );

      if (found) {
        setSelectedExam(found);
      } else if (examName) {
        const partialMatch = items.find((item) =>
          item.name?.toLowerCase().includes(examName.toLowerCase())
        );
        if (partialMatch) setSelectedExam(partialMatch);
      }
    }
  }, [items, location.search, location.state]);


  const examOptions = useMemo(
  () => items.map((item) => ({ value: String(item.id), label: item.name })),
  [items]
);
function scrollToSection(id) {
  const element = document.getElementById(id);

  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}
const categoryOptions = useMemo(() => {
  return categories.map((item) => ({
    value: String(item.id),
    label: item.title,
  }));
}, [categories]);

const modeOptions = useMemo(() => {
  const uniqueModes = [
    ...new Set(
      items
        .map((item) => item.mode)
        .filter(
          (item) =>
            item &&
            item !== "Mode not available"
        )
    ),
  ];

  return uniqueModes.map((item) => ({
    value: item,
    label: item,
  }));
}, [items]);
const filtered = useMemo(
  () =>
    items.filter((item) => {
      const matchesCategory =
        !category ||
        String(item.categoryObj?.id) === String(category);

      const matchesExam =
        !selectedExamId ||
        String(item.id) === String(selectedExamId);

      const matchesMode =
        !mode ||
        String(item.mode) === String(mode);

      return (
        matchesCategory &&
        matchesExam &&
        matchesMode
      );
    }),
  [
    items,
    category,
    selectedExamId,
    mode,
  ]
);


const examSections = useMemo(() => {
  if (!selectedExam) return [];

  const rawHtml =
    selectedExam?.aboutHtml ||
    selectedExam?.about ||
    selectedExam?.details?.[0]?.description ||
    selectedExam?.description ||
    "";

  if (!rawHtml || typeof window === "undefined") {
    return [];
  }

  const doc = new DOMParser().parseFromString(
    rawHtml.replace(/&nbsp;/g, " "),
    "text/html"
  );

  const sections = [];
  let currentSection = null;

  Array.from(doc.body.children).forEach((node, index) => {
    const tag = node.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      currentSection = {
        id: `exam-section-${index}`,
        title: node.textContent?.trim() || `Section ${index + 1}`,
        content: "",
      };

      sections.push(currentSection);
    } else {
      if (!currentSection) {
        currentSection = {
          id: `exam-section-${index}`,
          title: "Overview",
          content: "",
        };

        sections.push(currentSection);
      }

      currentSection.content += node.outerHTML;
    }
  });

  return sections;
}, [selectedExam]);

if (selectedExam) {
  return (
    <ModuleScreen className="space-y-4">
      <PageHero
        backOnly
        onBack={() => setSelectedExam(null)}
      />

      <div className="content-stagger grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px] lg:items-start">

        {/* LEFT SIDE */}
        <div className="space-y-5">

          {/* EXAM HEADER */}
          <div className="overflow-hidden rounded-[26px] border border-[#f0e4e2] bg-white shadow-sm">
            <div className="h-2 bg-gradient-to-r from-[#9a2119] to-[#c84f15]" />

            <div className="space-y-4 p-6">
              <div>
                <p className="m-0 text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8837e]">
                  Entrance Examination
                </p>

                <h1 className="m-0 mt-1 text-2xl font-black leading-snug text-[#1a0a09]">
                  {selectedExam.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                  <CalendarOutlined />
                  Issue: {selectedExam.issueDate}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf0ee] px-3 py-1.5 text-xs font-semibold text-[#9a2119]">
                  <CalendarOutlined />
                  Last Date: {selectedExam.lastDate}
                </span>
              </div>
            </div>
          </div>

          {/* DESCRIPTION SECTIONS */}
          {examSections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="scroll-mt-24 overflow-hidden rounded-[26px] border border-[#f0e4e2] bg-white shadow-sm"
            >
              <div className="border-b border-[#f0e4e2] px-5 py-3">
                <h3
                  className="m-0 text-[15px] font-bold !text-[#9a2119]"
                  style={{ color: "#9a2119" }}
                >
                  {section.title}
                </h3>
              </div>

              <div
                className="prose prose-sm max-w-none px-5 py-4
                  prose-headings:text-[#9a2119]
                  prose-p:text-[#4f4347]
                  prose-p:leading-7
                  prose-li:text-[#4f4347]
                  prose-li:leading-7
                  prose-strong:text-[#1a0a09]
                  prose-table:border
                  prose-table:border-[#f0e4e2]
                  prose-td:border
                  prose-td:border-[#f0e4e2]
                  prose-td:p-2
                  prose-th:border
                  prose-th:border-[#f0e4e2]
                  prose-th:p-2"
                dangerouslySetInnerHTML={{
                  __html: section.content,
                }}
              />
            </div>
          ))}

          {!examSections.length ? (
            <div className="rounded-[26px] border border-[#f0e4e2] bg-white p-6 text-sm text-gray-500">
              No description available.
            </div>
          ) : null}

        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-4 lg:sticky lg:top-4">

          <div className="overflow-hidden rounded-[26px] border border-[#f0e4e2] bg-white shadow-sm">

            <div className="space-y-4 p-5">

              {/* WEBSITE */}
              {selectedExam.website &&
              selectedExam.website !== "#" ? (
                <a
                  href={selectedExam.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#9a2119] text-sm font-semibold text-white transition hover:bg-[#7a1a13]"
                >
                  Explore Official Website
                  <ArrowRightOutlined />
                </a>
              ) : null}

              <div className="h-px bg-[#f0e4e2]" />

              {/* ON THIS PAGE */}
              <div>
                <p className="m-0 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#b8837e]">
                  On This Page
                </p>

                <div className="flex flex-col gap-1">
                  {examSections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() =>
                        scrollToSection(section.id)
                      }
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] font-semibold text-[#9a2119] transition hover:bg-[#fdf0ee]"
                    >
                      <ArrowRightOutlined className="text-xs" />

                      <span>{section.title}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </ModuleScreen>
  );
}
  return (
    <>
      <ModuleScreen className="space-y-4">
        {error ? (
          <Alert type="warning" title={error} showIcon style={{ borderRadius: 16 }} />
        ) : null}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="m-0 text-2xl font-black text-[#1a0a09]">Entrance Exams</h1>
            <p className="mt-1 text-xs text-[#b8837e]">
              {filtered.length} exams available across streams and authorities.
            </p>
          </div>

          <PageHero backOnly onBack={goToDashboard} className="shrink-0" />
        </div>

      <div className="flex flex-wrap items-center gap-2">
  {/* Search Exam */}
  <div className="relative">
    <Select
      showSearch
      allowClear
      placeholder="Search Exam"
      optionFilterProp="label"
      value={selectedExamId || undefined}
      onChange={(value) => setSelectedExamId(value || "")}
      options={examOptions}
      style={{ minWidth: 220 }}
      className="pill-select"
    />
  </div>

  {/* Category */}
  <div className="relative">
   <Select
  showSearch
  allowClear
  placeholder="All Domains"
  optionFilterProp="label"
  value={category || undefined}
  onChange={(value) => setCategory(value || "")}
  options={categoryOptions}
  style={{ minWidth: 220 }}
  className="pill-select"
/>
  </div>

  {/* Mode */}
<div className="relative">
  <Select
    showSearch
    allowClear
    placeholder="All Types"
    optionFilterProp="label"
    value={mode || undefined}
    onChange={(value) => setMode(value || "")}
    options={modeOptions}
    style={{ minWidth: 180 }}
    className="pill-select"
  />
</div>

  {(category || selectedExamId || mode) ? (
    <button
      type="button"
      onClick={() => {
        setCategory("");
        setSelectedExamId("");
        setMode("");
      }}
      className="rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-[#9a2119] underline-offset-2 hover:underline"
    >
      Clear
    </button>
  ) : null}
</div>

        <div className="content-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((item, index) => {
            const isPreviewMode = moduleMode === "preview";
            const isFree = !isPreviewMode || index < 4;

            return (
           <div
              key={item.id || item.name}
              className="group relative flex flex-col gap-2.5 rounded-2xl border border-[#f0e4e2] border-t-[3px] border-t-[#9a2119] bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#9a2119]/10"
              onClick={() => {
                if (!isFree) {
                  setUnlockModalItem({ title: item.name });
                }
              }}
            >
            
               <div className={`absolute  right-3 flex h-8 w-8 items-center justify-center rounded-full ${isFree ? "bg-green-50" : "bg-red-50"}`}>
                {isFree ? <UnlockOutlined className="text-green-600" /> : <LockOutlined className="text-red-500" />}
              </div>
              <p className="m-0 line-clamp-2 flex-1 text-[25px] font-bold leading-snug text-[#1a0a09]">
                {item.name}
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  <CalendarOutlined className="text-[10px]" />
                  Issue: {item.issueDate}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf0ee] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9a2119]">
                  <CalendarOutlined className="text-[10px]" />
                  Last: {item.lastDate}
                </span>
              </div>
<div className="mt-auto flex items-center justify-between border-t border-[#f0e4e2] pt-3">
                <button
                  type="button"
                 onClick={(e) => {
  e.stopPropagation();

  if (!isFree) {
    setUnlockModalItem({
      title: item.name,
    });
    return;
  }

  setSelectedExam(item);
}}
                  className=" py-1 text-sm font-bold text-[#9a2119] "
                >
                  View
                </button>

                {item.website && item.website !== "#" ? (
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();

                      if (isSubscribed) {
                        return;
                      }

                      if (isFree) {
                        return;
                      }

                      e.preventDefault();
                      setUnlockModalItem({ title: item.name });
                    }}
                    className="flex items-center gap-1 text-sm font-bold text-[#9a2119]"
                  >
                    Explore <ArrowRightOutlined />
                  </a>
                ) : (
                  <span className="text-sm font-bold text-gray-400">No Website</span>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No results found</div>
        ) : null}
      </ModuleScreen>

   <UnlockRedirectModal
        open={!!unlockModalItem}
        title="Unlock Entrance Exam"
        itemLabel={unlockModalItem?.title}
        description="Free preview already used. Please purchase a subscription to continue."
        onCancel={() => setUnlockModalItem(null)}
        onConfirm={() => {
          navigate(`/app/subscription?returnTo=${encodeURIComponent(location.pathname)}`);
          setUnlockModalItem(null);
        }}
      />


    </>
  );
}
  
