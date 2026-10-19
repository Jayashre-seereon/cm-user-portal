import {
  ArrowRightOutlined,
  BankOutlined,
  BookOutlined,
  BranchesOutlined,
  BranchesOutlined as BranchesOutlinedAlias,
  CreditCardOutlined,
  DollarOutlined,
  ExperimentOutlined,
  EnvironmentOutlined,
  FolderOpenOutlined,
  HeartFilled,
  HeartOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  RightOutlined,
  ReadOutlined,
  RocketOutlined,
  SolutionOutlined,
  TeamOutlined,
  TrophyOutlined,
  UnlockOutlined,
  LockOutlined,
  StarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

import { useEffect, useMemo, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import { Empty } from "antd";
import {
  getCareerLibraryCategoriesByStream,
  getCareerLibraryDetails,
  getCareerLibraryNext,
  getCareerLibraryStreams,
} from "../../../api/careerLibraryApi";
import { Country, State } from "country-state-city";
import { careerLibrary, palette } from "../../../data/careermapData";
import { ModuleScreen, Text } from "../../../components/ui";
import { useAppState } from "../../../state/AppStateContext";
import {
  PremiumGate,
  UnlockRedirectModal,
  usePortalNavigation,
} from "../../portal/components/portalPageShared";
import { checkModuleAccess, startPreview, } from "../../../api/moduleAccessApi";

const streamIcons = {
  Science: <ExperimentOutlined />,
  Commerce: <CreditCardOutlined />,
  "Arts & Humanities": <BookOutlined />,
  Vocational: <BranchesOutlined />,
  Neutral: <BranchesOutlined />,
};

function stripHtml(value) {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
function toList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [value];
}

function getItemTitle(item) {
  return (
    item?.title ||
    item?.name ||
    item?.subcategory?.title ||
    item?.secondcategory?.name ||
    item?.category?.title ||
    item?.path ||
    item?.examname ||
    item?.pathName ||
    `Item ${item?.id ?? ""}`.trim()
  );
}
function getDetailTitle(detail) {
  return (
    detail?.subcategory?.title ||
    detail?.secondcategory?.name ||
    detail?.category?.title ||
    `Career Detail ${detail?.id ?? ""}`.trim()
  );
}

function getDetailDescription(detail) {
  return stripHtml(
    detail?.description ||
    detail?.overview ||
    detail?.subcategory?.description ||
    detail?.secondcategory?.description ||
    detail?.category?.description ||
    detail?.subcategory?.specialization ||
    detail?.secondcategory?.specialization ||
    detail?.category?.specialization ||
    ""
  );
}

function getStreamIcon(streamName) {
  const normalized = String(streamName || "").toLowerCase();
  if (normalized.includes("science")) return "flask-outline";
  if (normalized.includes("commerce")) return "calculator-outline";
  if (normalized.includes("arts")) return "color-palette-outline";
  if (normalized.includes("vocational")) return "hammer-outline";
  return "layers-outline";
}

function getStreamTone(streamName) {
  const normalized = String(streamName || "").toLowerCase();
  if (normalized.includes("science")) return palette.blue;
  if (normalized.includes("commerce")) return palette.green;
  if (normalized.includes("arts")) return palette.orange;
  if (normalized.includes("vocational")) return palette.pink;
  return palette.purple;
}

function getStepIcon(type, item) {
  const title = getItemTitle(item).toLowerCase();
  if (type === "category") {
    return title.includes("medical") || title.includes("science")
      ? "medical-outline"
      : "folder-open-outline";
  }
  if (type === "second") {
    return title.includes("education") || title.includes("study")
      ? "school-outline"
      : "albums-outline";
  }
  if (type === "sub") {
    return title.includes("detail") || title.includes("career")
      ? "sparkles-outline"
      : "document-text-outline";
  }
  return "chevron-forward";
}

function normalizeStreamItem(item, index = 0) {
  const fallback =
    careerLibrary.streams[index % careerLibrary.streams.length] ||
    careerLibrary.streams[0];
  const title =
    item?.name ||
    item?.title ||
    item?.streamName ||
    item?.label ||
    fallback?.name ||
    `Stream ${index + 1}`;
  return {
    id: item?.id ?? item?.streamId ?? index + 1,
    name: title,
    desc: stripHtml(
      item?.description || item?.desc || item?.about || fallback?.desc || ""
    ),
    icon: getStreamIcon(title),
    tone: getStreamTone(title),
    image: item?.image || null,
    raw: item,
  };
}

function normalizeStepItem(item, index = 0, type = "category") {
  const title = getItemTitle(item) || `Item ${index + 1}`;
  return {
    id:
      item?.id ??
      item?.categoryId ??
      item?.secondCategoryId ??
      item?.subCategoryId ??
      `${type}-${index}`,
    name: title,
    description: stripHtml(
      item?.description ||
      item?.desc ||
      item?.about ||
      item?.specialization ||
      item?.path ||
      ""
    ),
    coverImage: item?.coverImage || null,
    icon: getStepIcon(type, item),
    tone: palette.primary,
    raw: item,
  };
}

function normalizeSalaryRanges(value) {
  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map((salary) =>
        typeof salary === "string" ? { label: salary } : salary
      );
  }
  if (!value) return [];
  if (typeof value === "string") return [{ label: value }];
  return [{ label: String(value) }];
}

function normalizeTextItems(value) {
  return toList(value)
    .flatMap((item) => {
      if (!item) return [];
      if (typeof item === "string") return [stripHtml(item)];
      return [
        stripHtml(
          item?.name ||
          item?.title ||
          item?.examname ||
          item?.label ||
          item?.value ||
          ""
        ),
      ];
    })
    .filter(Boolean);
}

function normalizeCareerPathItems(value) {
  return toList(value).map((item, index) => {
    if (typeof item === "string") {
      return {
        id: `careerpath-${index}`,
        pathName: item,
        path: { pathtype: item },
        graduation: "",
        aftergraduation: "",
        afterpostgraduation: "",
        anyother: "",
        raw: item,
      };
    }

    return {
      id: item?.id ?? `careerpath-${index}`,
      pathName:
        item?.pathName ||
        item?.path?.pathtype ||
        item?.pathtype ||
        item?.name ||
        `Path ${index + 1}`,
      path: item?.path || (item?.pathtype ? { pathtype: item.pathtype } : null),
      graduation: stripHtml(item?.graduation || ""),
      aftergraduation: stripHtml(item?.aftergraduation || ""),
      afterpostgraduation: stripHtml(item?.afterpostgraduation || ""),
      anyother: stripHtml(item?.anyother || ""),
      raw: item,
    };
  });
}

function normalizeInstituteItems(value) {
  return toList(value).map((item, index) => {
    if (typeof item === "string") {
      return {
        id: `institution-${index}`,
        name: item,
        state: "",
        city: "",
        country: "",
        logo: null,
        location: item,
        isTop: false,
        raw: item,
      };
    }
    const city = item?.city || "";
    const state = item?.state || item?.stateName || item?.province || item?.region || "";
    const country = item?.countruy || item?.country || "";
    const location =
      [city, state, country].filter(Boolean).join(", ") ||
      item?.location ||
      "Location not available";
    return {
      id: item?.id ?? `institution-${index}`,
      name: item?.name || "Unnamed Institute",
      state,
      city,
      country, // ← now stored so the filter can use it
      location,
      logo: item?.logo || null,
      isTop: Boolean(item?.is_top ?? item?.isTop),
      raw: item,
    };
  });
}

function normalizeCountryName(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeStateName(value = "") {
  return String(value).trim().toLowerCase();
}

function groupInstitutesByTopStatus(value, targetState = "Odisha") {
  const institutes = value || [];

  const normalizedTargetState = normalizeStateName(targetState);

  const sortTopFirst = (items) => {
    return [...items].sort((a, b) => {
      return Number(b.isTop) - Number(a.isTop);
    });
  };

  const odishaInstitutes = institutes.filter(
    (item) =>
      normalizeStateName(item.state) === normalizedTargetState
  );

  const outsideInstitutes = institutes.filter(
    (item) =>
      normalizeStateName(item.state) !== normalizedTargetState
  );

  return {
    institutes,

    topInstitutes: sortTopFirst(odishaInstitutes),

    outsideInstitutes: sortTopFirst(outsideInstitutes),

    targetState,
  };
}

function formatSalaryAmount(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value ?? "");
  return new Intl.NumberFormat("en-IN").format(numericValue);
}

function formatSalaryRange(salary) {
  if (!salary) return "Salary not available";
  const currency = salary?.currency || "";
  if (salary?.minSalary != null && salary?.maxSalary != null) {
    return `${salary.profession ? salary.profession + " - " : ""}${currency} ${formatSalaryAmount(salary.minSalary)} L to ${currency} ${formatSalaryAmount(salary.maxSalary)} L /annum`;
  }
  if (salary?.label || salary?.value) return salary.label || salary.value;
  return "Salary not available";
}

function getMediaType(url) {
  if (!url) return null;
  const clean = String(url).split("?")[0].toLowerCase();
  if (/\.(mp4|webm|mov|ogg)$/.test(clean)) return "video";
  if (/\.(gif)$/.test(clean)) return "gif";
  if (/\.(jpg|jpeg|png|webp|svg)$/.test(clean)) return "image";
  return "image"; // fallback
}

function SectionCard({ icon, title, subtitle, children, id, className = "" }) {
  return (
    <section id={id} className={`scroll-mt-4 rounded-[24px] border border-[#f0e4e2] bg-white shadow-sm ${className}`}>
      <div className="flex items-start gap-3 border-b border-[#f7eeec] px-5 py-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fdf0ee] text-[#9a2119]">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="m-0 text-[18px] font-black text-[#1a0a09]">{title}</h2>
          {subtitle ? (
            <p className="m-0 mt-1 text-[12px] leading-5 text-[#8f7d79]">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="px-5 py-5 text-[#000000]" style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>{children}</div>
    </section>
  );
}

function MediaBanner({ media, title, onBack }) {
  if (!media) return null;
  const type = getMediaType(media);

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[#f0e4e2] shadow-sm h-56 sm:h-72">
      {type === "video" ? (
        <video src={media} className="h-full w-full object-cover" autoPlay muted loop playsInline />
      ) : (
        <img src={media} alt={title} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-6 py-5">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
            >
              <ArrowRightOutlined className="rotate-180" />
            </button>
          ) : null}
          <div>
            <h2
              className="m-0 text-2xl font-black"
              style={{
                color: "#ffff",
                WebkitTextFillColor: "#ffff",
                textShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              {title}
            </h2>
            <p
              className="m-0 mt-1 text-sm font-bold"
              style={{
                color: "#ffff",
                WebkitTextFillColor: "#ffff",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              Career detail view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
function DetailPill({ icon, label, tone = "#9a2119", className = "" }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-[#f0e4e2] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4f4347] ${className}`}>
      <span className="text-[12px]" style={{ color: tone }}>
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}

function formatDetailEducation(item) {
  const parts = [
    item?.subcategory?.description,
    item?.subcategory?.specialization,
    item?.subcategory?.importandt_facts,
    item?.secondcategory?.description,
    item?.secondcategory?.specialization,
    item?.secondcategory?.importandt_facts,
    item?.category?.description,
    item?.category?.specialization,
    item?.category?.importandt_facts,
    item?.education,
    item?.qualification,
    item?.studyPath,
    item?.about,
    item?.overview,
    item?.description,
    item?.detail,
  ];
  return parts.map(stripHtml).filter(Boolean).join("\n");
}

function normalizeDetailItem(item, index = 0, sourceItem = null) {
  const title =
    getDetailTitle(item) ||
    getItemTitle(sourceItem) ||
    `Career Detail ${index + 1}`;
  return {
    id: item?.id ?? sourceItem?.id ?? `${title}-${index}`,
    title,
    description: stripHtml(
      item?.description ||
      sourceItem?.description ||
      ""
    ),
    overview: stripHtml(
      item?.overview ||
      item?.description ||
      item?.about ||
      item?.detail ||
      sourceItem?.overview ||
      sourceItem?.description ||
      ""
    ),
    path: normalizeTextItems(
      item?.path ||
      item?.careerPath ||
      item?.careerpaths ||
      item?.careerPaths ||
      item?.steps ||
      sourceItem?.path ||
      sourceItem?.steps
    ),
    education: formatDetailEducation(item || sourceItem),
    exams: normalizeTextItems(
      item?.entranceexams ||
      item?.entranceExams ||
      item?.exams ||
      item?.exam ||
      sourceItem?.entranceexams ||
      sourceItem?.entranceExams ||
      sourceItem?.exams ||
      []
    ),
    jobs: toList(
      item?.jobs ||
      item?.jobScope ||
      item?.job_scope ||
      sourceItem?.jobs ||
      sourceItem?.jobScope ||
      []
    ),
    salary: stripHtml(item?.salary || item?.salaryRange || sourceItem?.salary || ""),
    salaryRanges: normalizeSalaryRanges(
      item?.salaryRanges ||
      item?.salary_ranges ||
      sourceItem?.salaryRanges ||
      []
    ),
    careerpaths: normalizeCareerPathItems(
      item?.careerpaths ||
      item?.careerPaths ||
      item?.careerPath ||
      sourceItem?.careerpaths ||
      sourceItem?.careerPaths ||
      sourceItem?.careerPath ||
      []
    ),
    specializationList: extractListItems(item?.specialization || sourceItem?.specialization),
    specializationHtml: item?.specialization || sourceItem?.specialization || "",
    importantFactorList: extractListItems(item?.important_factor || sourceItem?.important_factor),
    importantFactorHtml: item?.important_factor || sourceItem?.important_factor || "",  descriptions: Array.isArray(item?.descriptions)
      ? item.descriptions
          .map((entry, entryIndex) => ({
            id: entry?.id ?? `${title}-description-${entryIndex}`,
            title: stripHtml(entry?.title || `Description ${entryIndex + 1}`),
            description: stripHtml(entry?.description || ""),
            descriptionHtml: entry?.description || "",
            sortOrder: Number.isFinite(Number(entry?.sortOrder)) ? Number(entry.sortOrder) : entryIndex,
          }))
          .filter((entry) => entry.title || entry.description)
          .sort((a, b) => a.sortOrder - b.sortOrder)
      : [],
    media: item?.media || sourceItem?.media || "",
    institutes: normalizeInstituteItems(
      item?.institutions ||
      item?.institutes ||
      item?.topInstitutes ||
      item?.colleges ||
      sourceItem?.institutions ||
      sourceItem?.institutes ||
      []
    ),
    raw: item,
  };
}

function getFallbackNextItems(type, item) {
  const title = getItemTitle(item);
  if (type === "stream") {
    return (careerLibrary.categories[title] || []).map((category, index) =>
      normalizeStepItem({ id: `${title}-${category}`, name: category }, index, "category")
    );
  }
  if (type === "category") {
    return (careerLibrary.programs[title] || []).map((program, index) =>
      normalizeStepItem({ id: `${title}-${program}`, name: program }, index, "second")
    );
  }
  if (type === "second") {
    return (careerLibrary.specializations[title] || []).map((subCategory, index) =>
      normalizeStepItem({ id: `${title}-${subCategory}`, name: subCategory }, index, "sub")
    );
  }
  if (type === "sub") {
    const detail = careerLibrary.details[title];
    return detail ? [normalizeDetailItem(detail, 0, item)] : [];
  }
  return [];
}

const STREAM_ORDER = [
  "science",
  "commerce",
  "artsandhumanities",
  "neutral",
  "competitive",
  "vocational",
  "Career Clusters"
].map(normalizeStreamKey);

function normalizeStreamKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, ""); // strips spaces, punctuation, special chars
}

function sortStreamsByPriority(items) {
  return [...items].sort((a, b) => {
    const aIndex = STREAM_ORDER.indexOf(normalizeStreamKey(a.name));
    const bIndex = STREAM_ORDER.indexOf(normalizeStreamKey(b.name));
    const aRank = aIndex === -1 ? STREAM_ORDER.length : aIndex;
    const bRank = bIndex === -1 ? STREAM_ORDER.length : bIndex;
    return aRank - bRank; // unranked items keep their relative order (stable sort) and land at the bottom
  });
}

function normalizeStreamItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return sortStreamsByPriority(
      careerLibrary.streams.map((item, index) => normalizeStreamItem(item, index))
    );
  }
  return sortStreamsByPriority(
    items.map((item, index) => normalizeStreamItem(item, index))
  );
}

function normalizeStepItems(items, type) {
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((item, index) => normalizeStepItem(item, index, type));
}

function normalizeDetailItems(items, sourceItem) {
  if (!Array.isArray(items) || items.length === 0) {
    return sourceItem ? [normalizeDetailItem(sourceItem, 0, sourceItem)] : [];
  }
  return items.map((item, index) => normalizeDetailItem(item, index, sourceItem));
}

function LibraryBreadcrumb({
  stream,
  category,
  secondCategory,
  subCategory,
  detail,
  level,
}) {
  const parts = [];
  if (stream) parts.push(stream);
  if (category) parts.push(category);
  if (secondCategory) parts.push(secondCategory);
  if (subCategory && level === "details") parts.push(subCategory);
  if (detail && level === "details") parts.push(detail);

  if (!parts.length) return null;

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
      <span>Career Archive</span>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`} className="flex items-center gap-1.5">
          <RightOutlined className="text-[10px] opacity-40" />
          <span
            className={
              index === parts.length - 1
                ? "font-semibold text-brand"
                : ""
            }
          >
            {part}
          </span>
        </span>
      ))}
    </div>
  );
}

function getDetailDescriptionSections(detail) {
  if (Array.isArray(detail?.descriptions) && detail.descriptions.length > 0) {
    return detail.descriptions;
  }
  const fallbackDescriptionHtml = getDetailDescriptionHtml(detail);
  return fallbackDescriptionHtml
    ? [{ id: "description-0", title: "Description", descriptionHtml: fallbackDescriptionHtml }]
    : [];
}
function getDetailDescriptionHtml(detail) {
  return (
    detail?.description ||
    detail?.overview ||
    detail?.subcategory?.description ||
    detail?.secondcategory?.description ||
    detail?.category?.description ||
    detail?.subcategory?.specialization ||
    detail?.secondcategory?.specialization ||
    detail?.category?.specialization ||
    ""
  );
}
function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2 border-b border-[#f0e4e2] px-5 py-3">
      <span className="text-sm text-[#9a2119]">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-widest text-[#1a0a09]">
        {title}
      </span>
    </div>
  );
}
function InstituteFilterGroup({ institutes, badge, emptyText, showLocationFilter = true }) {
  const [filter, setFilter] = useState("all");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");

  const india = Country.getCountryByCode("IN");
  const states = State.getStatesOfCountry(india.isoCode);

  // Unique states pulled from the API data for institutes outside India
  const otherCountryStates = useMemo(() => {
    const seen = new Set();
    const result = [];
    institutes.forEach((i) => {
      if (normalizeCountryName(i.country) === "india") return;
      if (!i.state || seen.has(i.state)) return;
      seen.add(i.state);
      result.push(i.state);
    });
    return result;
  }, [institutes]);

  const filtered = institutes.filter((i) => {
    if (showLocationFilter) {
      const isIndia = normalizeCountryName(i.country) === "india";
      const matchesCountry = country === "India" ? isIndia : !isIndia;
    const matchesState = !state || normalizeStateName(i.state) === normalizeStateName(state);
      if (!matchesCountry || !matchesState) return false;
    }

    const isGovt = String(i?.raw?.institute_type || "").toLowerCase().includes("gov");
    const matchesType = filter === "all" ? true : filter === "govt" ? isGovt : !isGovt;

    return matchesType;
  });

  return (
    <div>
      <div className="mb-3 flex gap-3">
        {showLocationFilter && (
          <>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setState("");
              }}
              className="border rounded px-3 py-2"
            >
              <option value="India">India</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Select State</option>

              {country === "India" &&
                states.map((s) => (
                  <option key={s.isoCode} value={s.name}>
                    {s.name}
                  </option>
                ))}

              {country === "Other" &&
                otherCountryStates.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>
          </>
        )}

        {["all", "govt", "private"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              filter === f
                ? "filter-pill-selected !bg-[#9a2119] !text-white"
                : "filter-pill-unselected"
            }`}
          >
            {f === "govt" ? "Government" : f === "private" ? "Private" : "All"}
          </button>
        ))}
      </div>
      {filtered.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((inst) => (
            <InstituteCard key={inst.id} inst={inst} badge={badge} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">{emptyText}</p>
      )}
    </div>
  );
}

// ─── InstituteCard ────────────────────────────────────────────────────────────
function InstituteCard({ inst, badge }) {
  const isOdisha = badge === "Odisha";
  const logo = inst?.logo || null;
  const url = inst?.raw?.url || null;
  const admissionProcess = inst?.raw?.admission_process || null;
  const tentativeDate = inst?.raw?.tentative_date
    ? new Date(inst.raw.tentative_date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : null;
  const stateName = inst?.state || inst?.raw?.state || "";
  const isGovt = String(inst?.raw?.institute_type || "").toLowerCase().includes("gov");

  return (
    <div className="group overflow-hidden rounded-[24px] border border-[#f0e4e2] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#d7c3bc] hover:shadow-lg hover:shadow-[#9a2119]/10">
      <div className="flex items-center justify-between gap-3 border-b border-[#f7eeec] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${isGovt ? "bg-[#2f9367]" : "bg-[#c9a11d]"}`} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a5847c]">
            {isGovt ? "Government" : "Private"}
          </span>
        </div>
        {badge ? (
         <span
  className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
    isOdisha ? "bg-[#eaf7ef] text-[#2f9367]" : "bg-[#fdf0ee] text-[#9a2119]"
  }`}
>
  {badge}
</span>
        ) : null}
      </div>

      <div className="flex items-start gap-3 px-4 py-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-[#f0e4e2] bg-[#fffaf8]">
          {logo ? (
            <img
              src={logo}
              alt={inst.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <BankOutlined className="text-[20px] text-[#9a2119]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="m-0 line-clamp-2 text-[16px] font-black leading-snug text-[#1a0a09]">
            {inst.name}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stateName ? (
              <DetailPill icon={<EnvironmentOutlined />} label={stateName} tone="#0f8a7c" />
            ) : null}
            {inst.city ? (
              <DetailPill icon={<ReadOutlined />} label={inst.city} tone="#9a2119" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-[#f7eeec] px-4 py-4 sm:grid-cols-2">
        {admissionProcess ? (
          <div className="rounded-[16px] bg-[#fff8f4] px-3 py-2.5">
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b8837e]">
              Admission Via
            </p>
            <p className="m-0 mt-1 text-[12px] font-semibold text-[#1a0a09]">{admissionProcess}</p>
          </div>
        ) : null}
        {tentativeDate ? (
          <div className="rounded-[16px] bg-[#f7fbff] px-3 py-2.5">
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6c88a8]">
              Tentative Date
            </p>
            <p className="m-0 mt-1 text-[12px] font-semibold text-[#1a0a09]">{tentativeDate}</p>
          </div>
        ) : null}
      </div>

      {url ? (
        <div className="border-t border-[#f7eeec] px-4 py-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[13px] font-bold text-[#9a2119] transition hover:translate-x-0.5"
          >
            Explore institution
            <ArrowRightOutlined />
          </a>
        </div>
      ) : null}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LibraryPage() {
  const { isUnlocked, registerFreeDetailAccess, savedCareers, toggleSavedCareer } =
    useAppState();
  const { location, goToDashboard, navigate } = usePortalNavigation();

  const [currentLevel, setCurrentLevel] = useState("streams");
  const [selectedCountry, setSelectedCountry] = useState("India");
const [selectedState, setSelectedState] = useState("");
const [indiaStates, setIndiaStates] = useState([]);
  const [selectedStream, setSelectedStream] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSecondCategory, setSelectedSecondCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedDetailSource, setSelectedDetailSource] = useState(null);

  const [streamItems, setStreamItems] = useState(normalizeStreamItems([]));
  const [categories, setCategories] = useState([]);
  const [secondCategories, setSecondCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [details, setDetails] = useState([]);

  const [detailReturnLevel, setDetailReturnLevel] = useState("streams");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unlockModalItem, setUnlockModalItem] = useState(null);

  const pageLocation = useLocation();
  const accessStatus = pageLocation.state?.accessStatus || "preview";
  const [moduleStatus, setModuleStatus] = useState(accessStatus);
  const CAREER_LIBRARY_MODULE_ID = pageLocation.state?.moduleId;

  const [previewSessionId, setPreviewSessionId] = useState(null);

  const [previewRemaining, setPreviewRemaining] = useState(0);

  const [previewExpired, setPreviewExpired] = useState(false);
  const hasSubscriptionAccess = accessStatus === "unlocked";
useEffect(() => {

  if (selectedCountry === "India") {

    const india = Country.getCountryByCode("IN");

    const states = State.getStatesOfCountry(india.isoCode);

    setIndiaStates(states);

  } else {

    setIndiaStates([]);

  }

}, [selectedCountry]);
  useEffect(() => {
    let active = true;

    async function loadStreams() {
      try {
        setLoading(true);
        setError("");
        const response = await getCareerLibraryStreams();
        const items = Array.isArray(response?.data) ? response.data : [];
        if (!active) return;
        setStreamItems(normalizeStreamItems(items));
      } catch (_fetchError) {
        if (active) {
          setError("Unable to load streams right now.");
          setStreamItems(normalizeStreamItems([]));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStreams();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!previewRemaining) return;

    const timer = setInterval(() => {
      setPreviewRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPreviewExpired(true);
          setUnlockModalItem({
            title: "Preview Expired",
            description:
              "Your free Career Archive access has already been used. Subscribe to unlock .",
          });
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [previewRemaining]);

  useEffect(() => {
    async function loadAccess() {
      try {
        const result = await checkModuleAccess(
          CAREER_LIBRARY_MODULE_ID
        );

        if (result.allowed) {
          setModuleStatus(result.mode);

          if (result.mode === "preview") {
            setPreviewExpired(false);
          }
        }
      } catch (err) {
        console.log(err);
      }
    }

    loadAccess();
  }, []);

  // Handle deep-linking from Global Search or direct URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(pageLocation.search);
    const searchItem = pageLocation.state?.searchItem;

    const type = searchParams.get("type") || searchItem?.type || "";
    const id =
      searchParams.get("id") ||
      searchParams.get("subCategoryId") ||
      searchParams.get("secondCategoryId") ||
      searchParams.get("categoryId") ||
      searchParams.get("streamId") ||
      searchItem?.id ||
      "";
    const title =
      searchParams.get("title") ||
      searchParams.get("career") ||
      searchParams.get("search") ||
      searchItem?.title ||
      "";
    const streamId = searchParams.get("streamId") || searchItem?.streamId || "";
    const categoryId = searchParams.get("categoryId") || searchItem?.categoryId || "";
    const secondCategoryId = searchParams.get("secondCategoryId") || searchItem?.secondCategoryId || "";

    if (!type && !id && !title) return;

    let active = true;

    async function handleDeepLink() {
      try {
        setLoading(true);
        setError("");

        const normalizedType = String(type).toLowerCase();

        // 1. Subcategory / Career Detail (Direct inner detail view)
        if (
          normalizedType === "subcategory" ||
          normalizedType === "sub" ||
          normalizedType === "career" ||
          normalizedType === "careerpath" ||
          searchParams.get("subCategoryId") ||
          searchParams.get("career")
        ) {
          const targetId = id || searchParams.get("subCategoryId");
          let detailData = null;

          if (targetId) {
            try {
              const res = await getCareerLibraryDetails(targetId, CAREER_LIBRARY_MODULE_ID);
              detailData = res?.data || res;
            } catch (e) {
              console.warn("Direct getCareerLibraryDetails error, fallback to general:", e);
            }
          }

          if (!active) return;

          const sourceObj = searchItem || { id: targetId || title, title, name: title };
          const normalizedDetails = normalizeDetailItems(
            Array.isArray(detailData) ? detailData : detailData ? [detailData] : [],
            sourceObj
          );

          setSelectedDetailSource(sourceObj);
          setDetails(normalizedDetails);
          setDetailReturnLevel("streams");
          setCurrentLevel("details");
          return;
        }

        // 2. Second Category
        if (
          normalizedType === "secondcategory" ||
          normalizedType === "second" ||
          searchParams.get("secondCategoryId")
        ) {
          const targetId = id || searchParams.get("secondCategoryId");
          const nextRes = await getCareerLibraryNext("second", targetId, CAREER_LIBRARY_MODULE_ID);
          if (!active) return;

          const data = nextRes ?? {};
          const items = Array.isArray(data?.data) ? data.data : [];

          if (data?.type === "details") {
            const sourceObj = searchItem || { id: targetId, name: title, title };
            setSelectedDetailSource(sourceObj);
            setDetails(normalizeDetailItems(items, sourceObj));
            setDetailReturnLevel("streams");
            setCurrentLevel("details");
          } else {
            setSelectedSecondCategory({ id: targetId, name: title, title });
            setSubCategories(normalizeStepItems(items, "sub"));
            setCurrentLevel("subcategory");
            setDetailReturnLevel("streams");
          }
          return;
        }

        // 3. Category
        if (
          normalizedType === "category" ||
          searchParams.get("categoryId")
        ) {
          const targetId = id || searchParams.get("categoryId");
          const nextRes = await getCareerLibraryNext("category", targetId, CAREER_LIBRARY_MODULE_ID);
          if (!active) return;

          const data = nextRes ?? {};
          const items = Array.isArray(data?.data) ? data.data : [];

          if (data?.type === "details") {
            const sourceObj = searchItem || { id: targetId, name: title, title };
            setSelectedDetailSource(sourceObj);
            setDetails(normalizeDetailItems(items, sourceObj));
            setDetailReturnLevel("streams");
            setCurrentLevel("details");
          } else if (data?.type === "secondcategory") {
            setSelectedCategory({ id: targetId, name: title, title });
            setSecondCategories(normalizeStepItems(items, "second"));
            setCurrentLevel("secondcategory");
            setDetailReturnLevel("streams");
          }
          return;
        }

        // 4. Stream
        if (
          normalizedType === "stream" ||
          searchParams.get("streamId") ||
          searchParams.get("stream")
        ) {
          const targetId = id || searchParams.get("streamId");
          const streamObj = { id: targetId, name: title || "Stream", title };
          setSelectedStream(streamObj);

          if (targetId) {
            const catRes = await getCareerLibraryCategoriesByStream(targetId, CAREER_LIBRARY_MODULE_ID);
            if (!active) return;
            const items = Array.isArray(catRes?.data) ? catRes.data : [];
            setCategories(normalizeStepItems(items, "category"));
            setCurrentLevel("categories");
            setDetailReturnLevel("streams");
          }
          return;
        }

        // Fallback: If generic search with ID, try fetching detail first
        if (id) {
          try {
            const res = await getCareerLibraryDetails(id, CAREER_LIBRARY_MODULE_ID);
            if (active && res?.data) {
              const sourceObj = searchItem || { id, title, name: title };
              setSelectedDetailSource(sourceObj);
              setDetails(normalizeDetailItems(Array.isArray(res.data) ? res.data : [res.data], sourceObj));
              setDetailReturnLevel("streams");
              setCurrentLevel("details");
              return;
            }
          } catch {}
        }
      } catch (err) {
        console.warn("Deep link handling error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    handleDeepLink();

    return () => {
      active = false;
    };
  }, [pageLocation.search, pageLocation.state]);

  const detailUnlocked = hasSubscriptionAccess || moduleStatus !== "locked";

  const pageTitle = useMemo(() => {
    if (currentLevel === "streams") return "Career Archive";
    if (currentLevel === "categories") return selectedStream?.name || "Career Archive";
    if (currentLevel === "secondcategory") return selectedCategory?.name || "Career Archive";
    if (currentLevel === "subcategory") return selectedSecondCategory?.name || "Career Archive";
    if (currentLevel === "details")
      return (
        getItemTitle(
          selectedDetailSource ||
          selectedSubCategory ||
          selectedSecondCategory ||
          selectedCategory
        ) || "Career Archive"
      );
    return "Career Archive";
  }, [
    currentLevel,
    selectedCategory,
    selectedDetailSource,
    selectedSecondCategory,
    selectedStream,
    selectedSubCategory,
  ]);

  function buildReturnTo() {
    return location.pathname;
  }

  function getDetailItemsLabel() {
    return getItemTitle(
      selectedDetailSource ||
      selectedSubCategory ||
      selectedSecondCategory ||
      selectedCategory
    );
  }

  async function handleClick(type, id, item) {
    if (previewExpired) {
      setUnlockModalItem({
        title: "Preview Expired",
        description:
          "Please purchase this module to continue.",
      });

      return;
    }
    setLoading(true);
    setError("");
    setUnlockModalItem(null);
    setSelectedDetailSource(null);

    try {
      // ── STREAM ──────────────────────────────────────────────────────────────
      let currentPreviewSessionId = null;
      if (type === "stream") {
        setSelectedStream(item);
        setSelectedCategory(null);
        setSelectedSecondCategory(null);
        setSelectedSubCategory(null);
        setSecondCategories([]);
        setSubCategories([]);
        setDetails([]);
        setDetailReturnLevel("streams");

        try {
          const response = await getCareerLibraryCategoriesByStream(id, CAREER_LIBRARY_MODULE_ID);
          const items =
            Array.isArray(response?.data) && response.data.length > 0
              ? response.data
              : [];
          setCategories(normalizeStepItems(items, "category"));
          setCurrentLevel("categories");
        } catch (_err) {
          setCategories([]);
          setCurrentLevel("categories");
        }
        return;
      }

      // ── CATEGORY ────────────────────────────────────────────────────────────
      if (type === "category") {
        setSelectedCategory(item);
        let currentPreviewSessionId = null;
        if (moduleStatus === "preview") {
          currentPreviewSessionId = await createPreviewSession("category", id, item);
          if (!currentPreviewSessionId) {
            return;
          }
        }

        const response = await getCareerLibraryNext(
          type,
          id,
          CAREER_LIBRARY_MODULE_ID,
          currentPreviewSessionId
        );
        const data = response ?? {};
        const nextType = data?.type;
        const items = Array.isArray(data?.data) ? data.data : [];

        if (nextType === "secondcategory") {
          setSecondCategories(normalizeStepItems(items, "second"));
          setCurrentLevel("secondcategory");
          setDetailReturnLevel("categories");
          return;
        }

        if (nextType === "details") {
          let previewId = currentPreviewSessionId;
          if (moduleStatus === "preview" && !previewId) {
            previewId = await createPreviewSession("details", id, item);
            if (!previewId) {
              return;
            }
          }

          let detailItems = items;
          if (detailItems.length === 0) {
            try {
              const detailResponse =
                await getCareerLibraryDetails(
                  id,
                  CAREER_LIBRARY_MODULE_ID,
                  previewId
                );
              const detailData = detailResponse ?? {};
              detailItems = Array.isArray(detailData?.data) ? detailData.data : [];
            } catch (_err) { detailItems = []; }
          }
          setSelectedDetailSource(item);
          setDetails(normalizeDetailItems(detailItems, item));
          setDetailReturnLevel("categories");
          setCurrentLevel("details");
          return;
        }

        setSecondCategories([]);
        setCurrentLevel("secondcategory");
        return;
      }

      // ── SECOND CATEGORY ─────────────────────────────────────────────────────
      if (type === "second") {
        setSelectedSecondCategory(item);
        let currentPreviewSessionId = null;
        if (moduleStatus === "preview") {
          currentPreviewSessionId = await createPreviewSession("second", id, item);
          if (!currentPreviewSessionId) {
            return;
          }
        }

        const response = await getCareerLibraryNext(
          type,
          id,
          CAREER_LIBRARY_MODULE_ID,
          currentPreviewSessionId
        );
        const data = response ?? {};
        const nextType = data?.type;
        const items = Array.isArray(data?.data) ? data.data : [];

        if (nextType === "subcategory") {
          setSubCategories(normalizeStepItems(items, "sub"));
          setCurrentLevel("subcategory");
          setDetailReturnLevel("secondcategory");
          return;
        }

        if (nextType === "details") {
          let previewId = currentPreviewSessionId;
          if (moduleStatus === "preview" && !previewId) {
            previewId = await createPreviewSession("details", id, item);
            if (!previewId) {
              return;
            }
          }

          let detailItems = items;
          if (detailItems.length === 0) {
            try {
              const detailResponse = await getCareerLibraryDetails(
                id,
                CAREER_LIBRARY_MODULE_ID,
                previewId
              );
              const detailData = detailResponse ?? {};
              detailItems = Array.isArray(detailData?.data) ? detailData.data : [];
            } catch (_err) { detailItems = []; }
          }
          setSelectedDetailSource(item);
          setDetails(normalizeDetailItems(detailItems, item));
          setDetailReturnLevel("secondcategory");
          setCurrentLevel("details");
          return;
        }

        return;
      }

      // ── SUB CATEGORY ────────────────────────────────────────────────────────
      if (type === "sub") {
        setSelectedSubCategory(item);
        let currentPreviewSessionId = null;
        if (moduleStatus === "preview") {
          currentPreviewSessionId = await createPreviewSession("sub", id, item);
          if (!currentPreviewSessionId) {
            return;
          }
        }

        const response = await getCareerLibraryNext(
          type,
          id,
          CAREER_LIBRARY_MODULE_ID,
          currentPreviewSessionId
        );
        const data = response ?? {};
        const nextType = data?.type;
        let items = Array.isArray(data?.data) ? data.data : [];

        if (nextType === "details") {
          let previewId = currentPreviewSessionId;
          if (moduleStatus === "preview" && !previewId) {
            previewId = await createPreviewSession("details", id, item);
            if (!previewId) {
              return;
            }
          }

          const detailResponse =
            await getCareerLibraryDetails(
              id,
              CAREER_LIBRARY_MODULE_ID,
              previewId
            );

          const detailData = detailResponse ?? {};
          const detailItems = Array.isArray(detailData.data)
            ? detailData.data
            : [];

          setSelectedDetailSource(item);
          setDetails(normalizeDetailItems(detailItems, item));
          setDetailReturnLevel("subcategory");
          setCurrentLevel("details");

          return;
        }
        setSelectedDetailSource(item);
        setDetails(normalizeDetailItems(items, item));
        setDetailReturnLevel("subcategory");
        setCurrentLevel("details");

        if (item?.id != null) {
          registerFreeDetailAccess("career-library", String(item.id));
        }
        return;
      }
    } catch (_fetchError) {
      setError("Unable to load the next step. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  async function createPreviewSession(pageType, pageId, item) {
    if (moduleStatus !== "preview") {
      return null;
    }

    try {
      const preview = await startPreview({
        moduleId: CAREER_LIBRARY_MODULE_ID,
        pageType,
        pageId,
      });

      setPreviewSessionId(preview.previewSessionId);
      setPreviewRemaining(preview.remainingSeconds);
      setPreviewExpired(false);

      return preview.previewSessionId;
    } catch (err) {
      if (err?.response?.status === 403) {
        setUnlockModalItem(item);
        return null;
      }

      throw err;
    }
  }

  function handleBack() {
    if (currentLevel === "details") {
      if (!hasSubscriptionAccess) {
        setModuleStatus("locked");
      }
      setCurrentLevel(detailReturnLevel);
      setSelectedDetailSource(null);
      return;
    }

    if (currentLevel === "subcategory") {
      setCurrentLevel("secondcategory");
      setSelectedSubCategory(null);
      return;
    }

    if (currentLevel === "secondcategory") {
      setCurrentLevel("categories");
      setSelectedSecondCategory(null);
      return;
    }

    if (currentLevel === "categories") {
      setCurrentLevel("streams");
      setSelectedCategory(null);
      return;
    }

    goToDashboard();
  }

  // function handleLockedCareerClick(item, type) {
  //   if (moduleStatus === "locked" && !hasSubscriptionAccess) {
  //     setUnlockModalItem({ item, type });
  //     return;
  //   }
  //   handleClick(type, item?.id, item);
  // }
  function handleLockedCareerClick(item, type) {

    if (
      type === "category" &&
      item?.raw?.accessTier === "locked"
    ) {
      setUnlockModalItem({
        item,
        type,
      });

      return;
    }

    handleClick(type, item?.id, item);
  }
  function handleGoToPlans() {
    const returnTo = buildReturnTo();
    setUnlockModalItem(null);
    navigate(`/app/subscription?returnTo=${encodeURIComponent(returnTo)}`);
  }

  // ── RENDER HELPERS ──────────────────────────────────────────────────────────

  function renderStreamGrid(items) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <button
            key={`stream-${item?.id ?? index}`}
            type="button"
            onClick={() => handleClick("stream", item?.id, item)}
            className="group rounded-2xl overflow-hidden border border-gray-200 bg-white text-left transition hover:shadow-lg hover:-translate-y-1"
          >
            <div className="h-40 w-full overflow-hidden bg-gray-100">

              {item?.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-3xl text-[#9a2119]">
                  <BookOutlined />
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-[#9a2119] line-clamp-2">
                {item?.name}
              </h3>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-semibold text-[#9a2119]">View</span>
                <ArrowRightOutlined className="text-xs opacity-60 group-hover:translate-x-1 transition" />
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  function renderCategoryGrid(items, type = "category") {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const unlockedItem = moduleStatus !== "locked";
          const isFree =
            type === "category"
              ? item.raw?.accessTier !== "locked"
              : true;
          return (
            <button
              key={`${type}-${item?.id ?? index}`}
              type="button"
              onClick={() => handleLockedCareerClick(item, type)}
              className="group rounded-2xl overflow-hidden border border-gray-200 bg-white text-left transition hover:shadow-lg hover:-translate-y-1"
            >
              <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                <span className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${isFree ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {isFree ? <UnlockOutlined /> : <LockOutlined />}
                </span>
                {item?.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col gap-2">
                <h3 className="text-sm font-semibold !text-[#9a2119] line-clamp-2">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {item.description || "Explore this category"}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-semibold text-[#9a2119]">View</span>
                  <ArrowRightOutlined className="text-xs opacity-60 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  function renderStepList(items, type) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const unlockedItem = moduleStatus !== "locked";

          return (
            <button
              key={`${type}-${item?.id ?? index}`}
              type="button"
              onClick={() => handleLockedCareerClick(item, type)}
              className="flex w-full items-center rounded-[14px] border border-[#f0e4e2] bg-white p-3 text-left transition-all duration-200 hover:border-[#9a2119] hover:shadow-md hover:shadow-[#9a2119]/10"
            >
              <span className="mr-3 flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#fff0e8] text-[#9a2119]">
                <ReadOutlined />
              </span>
              <div className="min-w-0 flex-1">
                <Text className="block text-[15px] font-bold text-ink">
                  {getItemTitle(item)}
                </Text>
                {item?.description ? (
                  <Text className="mt-1 block text-xs leading-5 text-muted">
                    {item.description}
                  </Text>
                ) : null}
              </div>
              {!hasSubscriptionAccess ? (
                <div
                  className={`mr-2 rounded-full px-2 py-1 ${unlockedItem ? "bg-green-100" : "bg-[#f8e8d8]"
                    }`}
                >
                  <Text
                    className="text-[10px] font-black"
                    style={{ color: unlockedItem ? palette.green : palette.primary }}
                  >
                    {unlockedItem ? "FREE" : "LOCK"}
                  </Text>
                </div>
              ) : null}
              <ArrowRightOutlined className="text-[#9a2119] opacity-30 transition-opacity" />
            </button>
          );
        })}
      </div>
    );
  }

  // ── REDESIGNED renderDetailItem ─────────────────────────────────────────────
 // ── REDESIGNED renderDetailItem ─────────────────────────────────────────────
  function renderDetailItem(detail, index) {
    const title = detail?.title || getItemTitle(detail);
    const Section = SectionCard;
    const instituteGroups = groupInstitutesByTopStatus(detail?.institutes, "Odisha");
    const careerpaths = detail?.raw?.careerpaths || [];
    const entranceexams = detail?.raw?.entranceexams || [];
    const jobs = toList(detail?.jobs || detail?.jobScope);
    const salaryRanges = detail?.salaryRanges || [];
    const descriptionSections = getDetailDescriptionSections(detail);
    const stateLabel = "Odisha";
    const hasCareerPath = careerpaths.length > 0 || detail?.path?.length > 0;
    const hasEntranceExams = entranceexams.length > 0 || toList(detail?.exams).length > 0;
    const hasJobs = jobs.length > 0;
    const hasSalary = salaryRanges.length > 0 || Boolean(detail?.salary);
    const hasTopInstitutes = instituteGroups.topInstitutes.length > 0 || instituteGroups.outsideInstitutes.length > 0;

    const sidebarSections = [
      ...descriptionSections.map((item, itemIndex) => ({
        id: `desc-${index}-${item.id ?? itemIndex}`,
        label: item.title || `Description ${itemIndex + 1}`,
        icon: <FileTextOutlined />,
      })),
      ...(hasCareerPath ? [{ id: `path-${index}`, label: "Career Path", icon: <BranchesOutlined /> }] : []),
      ...(hasEntranceExams ? [{ id: `exams-${index}`, label: "Entrance Exams", icon: <SolutionOutlined /> }] : []),
      ...(hasJobs ? [{ id: `jobs-${index}`, label: "Job Scopes", icon: <RocketOutlined /> }] : []),
      ...(hasSalary ? [{ id: `salary-${index}`, label: "Salary Range", icon: <DollarOutlined /> }] : []),
        ...(instituteGroups.outsideInstitutes.length > 0 ? [{ id: `top-out-${index}`, label: `Institutes in INDIA`, icon: <EnvironmentOutlined /> }] : []),
      ...(hasTopInstitutes ? [{ id: `top-in-${index}`, label: `Institutes in ${stateLabel}`, icon: <BankOutlined /> }] : []),
      ];

    function scrollTo(id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return (
      <div key={`detail-${detail?.id ?? index}`} className="space-y-6">
        {detail?.media ? (
          <MediaBanner media={detail.media} title={title} onBack={handleBack} />
        ) : null}

        <div className="flex gap-6 items-start">
          <div className="hidden lg:block sticky top-4 w-72 shrink-0">
            <div className="overflow-hidden rounded-[28px] border border-[#f0e4e2] bg-white shadow-sm">
              <div className="border-b border-[#f7eeec] px-5 py-4">
                <p className="m-0 text-[11px] font-bold uppercase tracking-[0.24em] text-[#b8837e]">Quick Jump</p>
                <h3 className="mt-1 m-0 text-[18px] font-black text-[#1a0a09]">{title}</h3>
              </div>
              <div className="p-2">
                {sidebarSections.map((sec, i) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollTo(sec.id)}
                    className={`flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left transition-colors hover:bg-[#fdf7f5] hover:text-[#9a2119]
                    ${i < sidebarSections.length - 1 ? "mb-1" : ""}`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fdf0ee] text-[#9a2119]">
                      {sec.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold text-[#1a0a09]">
                        {sec.label}
                      </span>
                    </span>
                    <RightOutlined className="text-[11px] text-[#c7aaa3]" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-5">

              {descriptionSections.length > 0 ? (
                <Section
                  id={`desc-${index}`}
                  icon={<FileTextOutlined />}
                  title="Description"
                  subtitle="What this career is about and why it matters."
                >
                 <div className="space-y-4">
                    {descriptionSections.map((item, itemIndex) => (
                      <div key={item.id ?? itemIndex} id={`desc-${index}-${item.id ?? itemIndex}`} className="scroll-mt-4">
                        <h3 className="m-0 text-[15px] font-black text-[#1a0a09]">{item.title}</h3>
                        {item.descriptionHtml || item.description ? (
                          <div
                            className="prose prose-sm max-w-none mt-2
                                       prose-headings:text-ink
                                       prose-p:text-[#000000]
                                       prose-li:text-[#000000]
                                       prose-a:text-brand
                                       prose-strong:text-ink
                                       prose-table:border prose-table:border-line
                                       prose-td:border prose-td:border-line prose-td:p-2
                                       prose-th:border prose-th:border-line prose-th:p-2
                                       prose-blockquote:border-l-brand"
                            dangerouslySetInnerHTML={{ __html: item.descriptionHtml || item.description || "" }}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </Section>
              ) : null}

              {hasCareerPath ? (
              <Section
                id={`path-${index}`}
                icon={<BranchesOutlined />}
                title={`Career Path for ${title}`}
                subtitle="A simple path from education to career entry."
              >
                {careerpaths.length > 0 ? (
                  <div className="overflow-x-auto rounded-[20px] border border-[#f0e4e2]">
                    <table className="min-w-[800px] w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#fdf7f6]">
                          {["Path", "Stream", "Graduation", "After Graduation", "After Post Graduation", "Any Other"].map((col) => (
                            <th
                              key={col}
                              className="whitespace-nowrap border-b border-[#f0e4e2] px-4 py-3 text-left font-bold text-[#000000]"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {careerpaths.map((cp, cpIdx) => (
                          <tr key={cp?.id ?? cpIdx} className={cpIdx % 2 === 0 ? "bg-white" : "bg-[#fdf9f9]"}>
                            <td className="whitespace-nowrap border-b border-[#f7eeec] px-4 py-3 font-semibold text-[#9a2119]">
                              {cp?.path?.pathtype || cp?.pathName || `Path ${cpIdx + 1}`}
                            </td>
                            <td className="border-b border-[#f7eeec] px-4 py-3 text-[#62585c]">
                              {detail?.raw?.stream?.name || "—"}
                            </td>
                            <td className="border-b border-[#f7eeec] px-4 py-3 text-[#62585c]">{cp?.graduation || "—"}</td>
                            <td className="border-b border-[#f7eeec] px-4 py-3 text-[#62585c]">{cp?.aftergraduation || "—"}</td>
                            <td className="border-b border-[#f7eeec] px-4 py-3 text-[#62585c]">{cp?.afterpostgraduation || "—"}</td>
                            <td className="border-b border-[#f7eeec] px-4 py-3 text-[#62585c]">{cp?.anyother || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : detail?.path?.length > 0 ? (
                  <div className="grid gap-3">
                    {detail.path.map((step, si) => (
                      <div
                        key={si}
                        className="flex items-start gap-3 rounded-[18px] border border-[#f0e4e2] bg-[#fffdfa] px-4 py-3"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9a2119] text-[12px] font-black text-white">
                          {si + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 text-[14px] font-semibold text-[#000000]">Step {si + 1}</p>
                          <p className="m-0 mt-1 text-[13px] leading-6 text-[#000000]">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="m-0 text-sm text-gray-400">Career path details not available.</p>
                )}
              </Section>
              ) : null}

              {hasEntranceExams ? (
              <Section
                id={`exams-${index}`}
                icon={<SolutionOutlined />}
                title="Entrance Exams"
                subtitle="Relevant exams for this career path."
              >
                {entranceexams.length > 0 ? (
                  <div className="grid gap-3">
                    {entranceexams.map((exam, ei) => (
                      <div
                        key={exam?.id ?? ei}
                        className="rounded-[20px] border border-[#f0e4e2] bg-[#fffdfa] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fdf0ee] text-[#9a2119]">
                                <SolutionOutlined />
                              </div>
                              <div className="min-w-0">
                                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b8837e]">Exam Name</p>
                                <p className="m-0 text-[16px] font-black text-[#000000]">{exam?.examname || "—"}</p>
                              </div>
                            </div>
                            {/* {exam?.about && exam.about !== "Nothing" ? (
                              <p className="m-0 mt-3 text-[13px] leading-6 text-[#000000] line-clamp-2">{exam.about}</p>
                            ) : null} */}
                          </div>
<div className="flex flex-wrap items-center gap-2">
  <a
  href={exam.url}
target="_blank"
rel="noopener noreferrer"
className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f0e4e2] text-[#9a2119] transition hover:bg-[#fdf0ee]">
    <ArrowRightOutlined />
                            </a>
                              
</div>
  

                        </div>
                      </div>
                    ))}
                  </div>
                ) : toList(detail?.exams).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {toList(detail.exams).map((exam, ei) => (
                      <DetailPill key={ei} icon={<SolutionOutlined />} label={exam} />
                    ))}
                  </div>
                ) : (
                  <p className="m-0 text-sm text-gray-400">Entrance exam details not available.</p>
                )}
              </Section>
              ) : null}

             {(detail?.specializationHtml || detail?.importantFactorHtml) && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Section
                    id={`spec-${index}`}
                    icon={<StarOutlined />}
                    title="Specialization"
                    subtitle="Key specializations in this field."
                  >
                    {detail.specializationHtml ? (
                      <div
                        className="prose prose-sm max-w-none
                                   prose-headings:text-ink
                                   prose-p:text-[#000000]
                                   prose-li:text-[#000000]
                                   prose-a:text-brand
                                   prose-strong:text-ink
                                   prose-table:border prose-table:border-line
                                   prose-td:border prose-td:border-line prose-td:p-2
                                   prose-th:border prose-th:border-line prose-th:p-2
                                   prose-blockquote:border-l-brand"
                        dangerouslySetInnerHTML={{ __html: detail.specializationHtml }}
                      />
                    ) : (
                      <p className="m-0 text-sm text-gray-400">Not available.</p>
                    )}
                  </Section>

                  <Section
                    id={`imp-${index}`}
                    icon={<CheckCircleOutlined />}
                    title="Important Factors"
                    subtitle="Things to know before choosing this path."
                  >
                    {detail.importantFactorHtml ? (
                      <div
                        className="prose prose-sm max-w-none
                                   prose-headings:text-ink
                                   prose-p:text-[#000000]
                                   prose-li:text-[#000000]
                                   prose-a:text-brand
                                   prose-strong:text-ink
                                   prose-table:border prose-table:border-line
                                   prose-td:border prose-td:border-line prose-td:p-2
                                   prose-th:border prose-th:border-line prose-th:p-2
                                   prose-blockquote:border-l-brand"
                        dangerouslySetInnerHTML={{ __html: detail.importantFactorHtml }}
                      />
                    ) : (
                      <p className="m-0 text-sm text-gray-400">Not available.</p>
                    )}
                  </Section>
                </div>
              )}

              {hasJobs ? (
              <Section
                id={`jobs-${index}`}
                icon={<RocketOutlined />}
                title="Job Scopes"
                subtitle="Common roles and career directions after this path."
              >
                {jobs.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {jobs.map((scope, ji) => (
                      <div
                        key={ji}
                        className="flex items-start gap-3 rounded-[18px] border border-[#f0e4e2] bg-white px-4 py-3"
                      >
                        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff0e8] text-[#9a2119]">
                          <TrophyOutlined />
                        </span>
                        <p className="m-0 text-[14px] leading-6 text-[#000000]">{scope}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="m-0 text-sm text-gray-400">Job scope not available.</p>
                )}
              </Section>
              ) : null}

              {hasSalary ? (
              <Section
                id={`salary-${index}`}
                icon={<DollarOutlined />}
                title="Salary Range"
                subtitle="Expected salary bands in the field."
              >
                {salaryRanges.length > 0 ? (
                  <ul className="m-0 list-none space-y-3 p-0">
                    {salaryRanges.map((salary, si) => (
                      <li key={salary?.id ?? si} className="flex items-center gap-3">
                        <DollarOutlined className="text-[#9a2119]" />
                        <span className="text-[14px] font-semibold text-[#1a0a09]">{formatSalaryRange(salary)}</span>
                      </li>
                    ))}
                  </ul>
                ) : detail?.salary ? (
                  <div className="rounded-[18px] border border-[#f0e4e2] bg-[#fffdfa] px-4 py-4">
                    <p className="m-0 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b8837e]">Expected Range</p>
                    <p className="m-0 mt-2 text-[16px] font-black text-[#9a2119]">{detail.salary}</p>
                  </div>
                ) : (
                  <p className="m-0 text-sm text-gray-400">Salary details not available.</p>
                )}
              </Section>
              ) : null}
  {instituteGroups.outsideInstitutes.length > 0 ? (
              <Section
                id={`top-out-${index}`}
                icon={<EnvironmentOutlined />}
                title="Institutes in INDIA
"
                subtitle="All institutes from other states are shown here."
              >
                <InstituteFilterGroup
                  institutes={instituteGroups.outsideInstitutes}
               
                  emptyText="No institutes found outside Odisha."
                />
              </Section>
              ) : null}

              {instituteGroups.topInstitutes.length > 0 ? (
              <Section
                id={`top-in-${index}`}
                icon={<BankOutlined />}
                title="Institutes in Odisha"
                subtitle="Institutes in Odisha highlighted from this career map data."
              >
                <InstituteFilterGroup
                  institutes={instituteGroups.topInstitutes}
                 
                  emptyText="No Odisha institutes found."
                  showLocationFilter={false}
                />
              </Section>
              ) : null}

            

          </div>
        </div>
      </div>
    );
  }

  // ── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <ModuleScreen className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <LibraryBreadcrumb
            stream={selectedStream?.name}
            category={selectedCategory?.name}
            secondCategory={selectedSecondCategory?.name}
            subCategory={selectedSubCategory?.name}
            detail={getDetailItemsLabel()}
            level={currentLevel}
          />
          {currentLevel !== "details" && (
            <>
              <div className="mb-2 flex items-center gap-3">
                {currentLevel !== "streams" ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eedad4] bg-white text-[#1a0a09] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <ArrowRightOutlined className="rotate-180" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goToDashboard}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eedad4] bg-white text-[#1a0a09] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <ArrowRightOutlined className="rotate-180" />
                  </button>
                )}
                <div className="min-w-0">
                  <h1 className="m-0 text-2xl font-black leading-snug text-[#9a2119]">
                    {pageTitle}
                  </h1>
                  <p className="mt-1 mb-0 text-xs text-[#9a2119]">
                    {currentLevel === "streams"
                      ? "Choose a stream to begin exploring career paths."
                      : currentLevel === "categories"
                        ? "Select a category within this stream."
                        : currentLevel === "secondcategory"
                          ? "Choose the next step in this career path."
                          : "Open a specialization to view full details."}
                  </p>
                </div>
              </div>
              <div className="mt-2 h-[3px] w-8 rounded-full bg-[#9a2119]" />
            </>
          )}
        </div>
        {moduleStatus === "preview" &&
          previewRemaining > 0 &&
          currentLevel === "details" && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 p-3">
              <ClockCircleOutlined className="text-green-700" />
              <div className="m-0 font-semibold text-green-700">
                Preview ends in {previewRemaining} seconds
              </div>
            </div>
          )}

        {previewExpired && currentLevel === "details" && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3">
            <LockOutlined className="text-red-700" />
            <div className="m-0 font-semibold text-red-700">
              Preview expired. Please purchase a subscription.
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="m-0 text-sm text-muted">
          {currentLevel === "details"
            ? "Loading details..."
            : currentLevel === "categories"
              ? "Loading categories..."
              : "Loading streams..."}
        </p>
      ) : null}
      {error ? (
        <p className="m-0 text-sm font-semibold text-red-500">{error}</p>
      ) : null}

      {currentLevel === "streams" ? (
        <div className="space-y-3">
          {streamItems.length > 0 ? (
            renderStreamGrid(streamItems)
          ) : !loading ? (
            <Empty description="No streams available right now." />
          ) : null}
        </div>
      ) : currentLevel === "categories" ? (
        <div className="space-y-3">
          {categories.length > 0 ? (
            renderCategoryGrid(categories, "category")
          ) : !loading ? (
            <Empty description="No categories available for this stream." />
          ) : null}
        </div>
      ) : currentLevel === "secondcategory" ? (
        <div className="space-y-3">
          {renderCategoryGrid(secondCategories, "second")}
          {!loading && secondCategories.length === 0 ? (
            <Empty description="No next steps available." />
          ) : null}
        </div>
      ) : currentLevel === "subcategory" ? (
        <div className="space-y-3">
          {renderCategoryGrid(subCategories, "sub")}
          {!loading && subCategories.length === 0 ? (
            <Empty description="No specializations available." />
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {!detailUnlocked ? (
            <PremiumGate
              title="Unlock "
              description="Subscribe to more careers, salary insights, education paths, and institute details."
              returnTo={buildReturnTo()}
            />
          ) : null}
          {details.length > 0 ? (
            details.map((detail, index) => renderDetailItem(detail, index))
          ) : !loading ? (
            <Empty description="No details available for this selection." />
          ) : null}
        </div>
      )}

      <UnlockRedirectModal
        open={Boolean(unlockModalItem)}
        title="Unlock Career Archive"
        itemLabel={unlockModalItem ? getItemTitle(unlockModalItem.item) : ""}
        description="Your free Career Archive access has already been used. Subscribe to unlock"
        onCancel={() => {
          setUnlockModalItem(null);
          handleBack();
        }}
        onConfirm={handleGoToPlans}
      />
    </ModuleScreen>
  );
}
