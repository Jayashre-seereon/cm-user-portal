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
  const { canAccessFreeDetail, registerFreeDetailAccess } = useAppState();
  const { navigate, location, goToDashboard } = usePortalNavigation();
  const [params] = useSearchParams();
const pageLocation = useLocation();

const MASTERCLASS_MODULE_ID =
  pageLocation.state?.moduleId;

const accessStatus =
  pageLocation.state?.accessStatus ||
  "preview";


const unlocked =
  accessStatus === "unlocked";
  const [items, setItems] = useState(fallbackMasterClasses);
  const [error, setError] = useState("");
  const [videoType, setVideoType] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [unlockModalItem, setUnlockModalItem] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadItems() {
      try {
        setError("");
        const response = await getMasterClasses(
  MASTERCLASS_MODULE_ID
);
        if (active && response.length) {
          setItems(response);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.response?.data?.message || loadError?.message || "Failed to load career & personality videos.");
          setItems(fallbackMasterClasses);
        }
      }
    }

    loadItems();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const nextVideoType = params.get("videoType");
    const nextSortBy = params.get("sortBy");

    if (nextVideoType) setVideoType(nextVideoType);
    if (nextSortBy) setSortBy(nextSortBy);
  }, [params]);

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
          if (sortBy === "az") return a.title.localeCompare(b.title);
          if (sortBy === "za") return b.title.localeCompare(a.title);
          if (sortBy === "newest") {
            if (a.createdAt && b.createdAt) {
              return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return Number(b.id) - Number(a.id); // fallback if no createdAt
          }
          return b.views - a.views; // popular
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
      {error ? <Alert type="warning" message={error} showIcon style={{ borderRadius: 16 }} /> : null}

<div className="flex flex-wrap items-center gap-2">
  {/* Video Type */}
  {videoTypeOptions.map((item) => (
    <button
      key={item}
      type="button"
      onClick={() => setVideoType(item)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        videoType === item
          ? "bg-[#9a2119] text-white"
          : "bg-[#faf4f2] text-[#7b605c]"
      }`}
    >
      {item}
    </button>
  ))}

  {/* Sort */}
  {[
    { label: "A-Z", value: "az" },
    { label: "Z-A", value: "za" },
  ].map((item) => (
    <button
      key={item.value}
      type="button"
      onClick={() => setSortBy(item.value)}
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
        {filtered.length === 0 ? (
          <div className="rounded-[24px] border border-[#f0e4e2] bg-white p-5 text-sm text-muted">
            No career & personality videos available right now.
          </div>
        ) : null}

        {filtered.map((item) => {
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
