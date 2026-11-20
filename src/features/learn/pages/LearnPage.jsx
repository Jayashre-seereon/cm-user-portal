import { useEffect, useMemo, useState } from "react";
import { Alert, Button } from "antd";
import { ArrowRightOutlined, LockOutlined,UnlockOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { useSearchParams,useLocation } from "react-router-dom";
import { getMasterClasses,
 } from "../../../api/masterclassApi";
 import {startPreview,} from "../../../api/moduleAccessApi";
import { masterClasses as fallbackMasterClasses } from "../../../data/careermapData";
import { ModuleScreen, PageHero, SoftTag } from "../../../components/ui";
import { useAppState } from "../../../state/AppStateContext";
import { buildFreeKeys, isVideoUnlocked, sortNewestFirst } from "../../../utils/previewAccess";
import { buildDashboardModules } from "../../../utils/dashboard";
import { UnlockRedirectModal, usePortalNavigation } from "../../portal/components/portalPageShared";
// import { useLocation } from "react-router-dom";
function formatViews(views) {
  if (!views) {
    return "New";
  }

  if (views < 1000) {
    return `${views} views`;
  }

  return `${(views / 1000).toFixed(1)}k views`;
}

function MasterClassCard({ item, unlocked, detailUnlocked, onWatch }) {
   
  const locked = item.locked && !unlocked;
  const heroTone = locked ? "#f8e8d8" : "#fdf0ee";


  return (
    <div
      className="group relative overflow-hidden rounded-[24px] border border-[#f0e4e2] bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#9a2119] hover:shadow-lg hover:shadow-[#9a2119]/10"
      style={{ opacity: locked && !detailUnlocked ? 0.96 : 1 }}
    >
      <div className="absolute left-0 right-0 top-0 h-[3px] bg-[#f0e4e2] transition-colors group-hover:bg-[#9a2119]" />

      <div className="flex h-full flex-col gap-4 pt-2">

  {/* Master Class Image */}
  <div className="relative h-44 w-full overflow-hidden rounded-[18px] bg-[#faf4f2]">
    {item.image ? (
      <img
        src={item.image}
        alt={item.title}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    ) : (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        No image available
      </div>
    )}

    {/* Lock overlay */}
    {locked && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow">
          <LockOutlined className="text-[#9a2119]" />
        </div>
      </div>
    )}
  </div>

  {/* Existing content */}
  <div className="flex items-start gap-3">
          

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-extrabold leading-[21px] text-ink">{item.title}</div>
                </div>

             <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${locked ? "bg-[#fff6f2] text-brand" : "bg-green-50 text-green-600"}`}>
                {locked ? <LockOutlined /> : <UnlockOutlined />}
              </div>
            </div>

            <div className="mt-3 flex flex-nowrap items-center gap-2 overflow-hidden">
              <SoftTag color="red" className="shrink-0 whitespace-nowrap">
                {item.career}
              </SoftTag>
              {/* <SoftTag color="gold" className="shrink-0 whitespace-nowrap">
                {formatViews(item.views)}
              </SoftTag> */}
            
            </div>
          </div>
        </div>

       

        {!unlocked && item.locked ? (
          <div className="">
            {detailUnlocked
              ? "Your first locked class is available for free."
              : ""}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between border-t border-[#f0e4e2] pt-3">
            <Button
            type="link"
            className="!h-auto !p-0 !text-sm !font-bold !text-[#9a2119]"
            onClick={onWatch}
            icon={<PlayCircleOutlined className="!text-base" />}
          >
            {locked && !detailUnlocked ? "Unlock More Classes" : "Watch Video"} <ArrowRightOutlined />
          </Button>
        </div>
      </div>
    </div>
  );
}



export default function LearnPage() {
  const { canAccessFreeDetail, registerFreeDetailAccess, dashboardData } = useAppState();
  const { navigate, location, goToDashboard } = usePortalNavigation();
  const [params, setSearchParams] = useSearchParams();
const pageLocation = useLocation();

// The server only sends each video's lock flags when the request says which module it is for.
// A page opened without navigation state (the navbar falls back to that when its access check
// fails or times out, or a typed address) must therefore find the module id itself.
const dashboardModuleId = useMemo(
  () => buildDashboardModules(dashboardData?.modules || []).find((card) => card.route === "/app/learn")?.id,
  [dashboardData]
);
const MASTERCLASS_MODULE_ID =
  pageLocation.state?.moduleId ?? dashboardModuleId;

const accessStatus =
  pageLocation.state?.accessStatus ||
  "preview";


const unlocked =
  accessStatus === "unlocked" || accessStatus === "full";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [videoType, setVideoType] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  // In preview the free videos are the 4 newest of the FULL list (the default order), like
  // the other modules - not the first 4 of whatever the type tab / A-Z / search shows.
  const previewFreeKeys = useMemo(() => buildFreeKeys(sortNewestFirst(items)), [items]);
  const [unlockModalItem, setUnlockModalItem] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadItems() {
      try {
        setError("");
        const response = await getMasterClasses(
  MASTERCLASS_MODULE_ID
);
        if (active) {
          setItems(Array.isArray(response) ? response : []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.response?.data?.message || loadError?.message || "Failed to load career & personality videos.");
          setItems([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadItems();
    return () => {
      active = false;
    };
    // Reload once the module id is known so the list comes back with its lock flags.
  }, [MASTERCLASS_MODULE_ID]);

  useEffect(() => {
    const nextVideoType = params.get("videoType");
    const nextSortBy = params.get("sortBy");

    if (nextVideoType) setVideoType(nextVideoType);
    if (nextSortBy) setSortBy(nextSortBy);
  }, [params]);

  function updateUrlParam(key, value, defaultValue) {
    const next = new URLSearchParams(params);
    if (value && value !== defaultValue) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  const activeSearchText = (params.get("search") || params.get("video") || params.get("q") || "").trim();

  function clearSearchParam() {
    const next = new URLSearchParams(params);
    ["search", "video", "q", "videoId"].forEach((key) => next.delete(key));
    setSearchParams(next, { replace: true });
  }

  const filtered = useMemo(
    () => {
      const q = (params.get("search") || params.get("video") || params.get("q") || "").toLowerCase().trim();
      const targetId = params.get("videoId");

      return [...items]
        .filter((item) => {
          if (targetId && String(item.id) === String(targetId)) return true;
          const matchesType = videoType === "All" || item.videoType === videoType;
          const matchesSearch = !q || item.title?.toLowerCase().includes(q) || item.videoType?.toLowerCase().includes(q);
          return matchesType && matchesSearch;
        })
        .sort((a, b) => {
          const selectedId = params.get("videoId");
          if (selectedId) {
            if (String(a.id) === String(selectedId)) return -1;
            if (String(b.id) === String(selectedId)) return 1;
          }
          if (sortBy === "az") return String(a.title || "").localeCompare(String(b.title || ""));
          if (sortBy === "za") return String(b.title || "").localeCompare(String(a.title || ""));
          if (sortBy === "newest") {
            if (a.createdAt && b.createdAt) {
              return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return Number(b.id) - Number(a.id); // fallback if no createdAt
          }
          const viewDiff = (Number(b.views) || 0) - (Number(a.views) || 0);
          if (viewDiff !== 0) return viewDiff; // popular
          return Number(b.id) - Number(a.id) || 0;
        });
    },
    [items, params, sortBy, videoType]
  );

  const videoTypeOptions = useMemo(
    () => ["All", ...Array.from(new Set(items.map((item) => item.videoType)))],
    [items]
  );

  function buildLearnReturnTo(itemTitle = "") {
    const nextParams = new URLSearchParams();
    if (videoType !== "All") nextParams.set("videoType", videoType);
    if (sortBy !== "popular") nextParams.set("sortBy", sortBy);
    if (itemTitle) nextParams.set("video", itemTitle);
    const query = nextParams.toString();
    return query ? `${location.pathname}?${query}` : location.pathname;
  }

  return (
    <ModuleScreen className="space-y-5 pb-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-black text-[#9a2119]">Career &amp; Personality Videos</h1>
          <p className="mt-1 text-sm text-[#8c6c67]">Explore career and personality videos.</p>
        </div>
        <PageHero
          backOnly
          onBack={() => {
            // From global search on ANOTHER page -> back there. If the search was made from
            // this very page, that target is this page (a no-op), so go to the dashboard.
            const returnTo = pageLocation.state?.returnTo;
            const returnPath = String(returnTo || "").split("?")[0];
            const backToSearchOrigin =
              pageLocation.state?.fromGlobalSearch && returnTo && returnPath !== pageLocation.pathname;
            navigate(backToSearchOrigin ? returnTo : "/app/dashboard");
          }}
          className="shrink-0"
        />
      </div>
      {error ? <Alert type="warning" message={error} showIcon style={{ borderRadius: 16 }} /> : null}

<div className="flex flex-wrap items-center gap-2">
  {/* Video Type */}
  {videoTypeOptions.map((item) => (
    <button
      key={item}
      type="button"
      onClick={() => {
        setVideoType(item);
        updateUrlParam("videoType", item, "All");
      }}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        videoType === item
          ? "bg-[#9a2119] text-white"
          : "bg-[#faf4f2] text-[#7b605c]"
      }`}
    >
      {item}
    </button>
  ))}

  {activeSearchText ? (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#fdf0ee] px-4 py-2 text-sm font-semibold text-[#9a2119]">
      Search: {activeSearchText}
      <button type="button" aria-label="Clear search" onClick={clearSearchParam} className="border-0 bg-transparent p-0 font-black text-[#9a2119]">
        &times;
      </button>
    </span>
  ) : null}

  {/* Sort */}
  {[
    { label: "A-Z", value: "az" },
    { label: "Z-A", value: "za" },
  ].map((item) => (
    <button
      key={item.value}
      type="button"
      onClick={() => {
        setSortBy(item.value);
        updateUrlParam("sortBy", item.value, "newest");
      }}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        sortBy === item.value
          ? "bg-[#9a2119] text-white"
          : "bg-[#faf4f2] text-[#7b605c]"
      }`}
    >
      {item.label}
    </button>
  ))}
</div>



      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading ? <div className="col-span-full py-8 text-center text-sm text-muted">Loading career &amp; personality videos...</div> : null}
        {!loading && filtered.length === 0 ? (
          <div className="rounded-[24px] border border-[#f0e4e2] bg-white p-5 text-sm text-muted">
            No career & personality videos available right now.
          </div>
        ) : null}

        {!loading && filtered.map((listItem) => {
  // A video is unlocked only if the user has full access (the server says "full"), or it is
  // one of the free ones (the 4 newest, or marked free by the admin). Anything else is
  // locked - including a video that came back with NO lock flag at all, so a missing flag
  // can never unlock it. Filters and sorting don't change this.
  const videoUnlocked = isVideoUnlocked(listItem, { fullAccess: unlocked, freeKeys: previewFreeKeys });
  const item = { ...listItem, locked: !videoUnlocked, isFree: videoUnlocked };
  const detailUnlocked =
  unlocked ||
  item.isFree;

          return (
            <MasterClassCard
              key={item.id || item.title}
              item={item}
              unlocked={unlocked}
              detailUnlocked={detailUnlocked}
onWatch={() => {

  if (item.locked) {
    setUnlockModalItem(item.title);
    return;
  }

  if (item.url !== "#") {
    window.open(
      item.url,
      "_blank",
      "noopener,noreferrer"
    );
  }
}}
            />
          );
        })}
      </div>

      <UnlockRedirectModal
        open={Boolean(unlockModalItem)}
        title="Unlock Career & Personality Videos"
        itemLabel={unlockModalItem}
        description="Your free career & personality videos access has already been used. Subscribe to unlock"
        onCancel={() => setUnlockModalItem(null)}
        onConfirm={() => {
          const returnTo = buildLearnReturnTo(unlockModalItem);
          setUnlockModalItem(null);
          navigate(`/app/subscription?returnTo=${encodeURIComponent(returnTo)}`);
        }}
      />
    </ModuleScreen>
  );
}
