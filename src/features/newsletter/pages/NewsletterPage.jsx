import { useEffect, useState,useMemo } from "react";
import { Alert, Empty } from "antd";
import { ArrowRightOutlined, UnlockOutlined, FileTextOutlined, LockOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { ModuleScreen, PageHero } from "../../../components/ui";
import { useAppState } from "../../../state/AppStateContext";
import { checkModuleAccess, startPreview } from "../../../api/moduleAccessApi";
import { UnlockRedirectModal, usePortalNavigation } from "../../portal/components/portalPageShared";
import { getNewsletters } from "../../../api/newsletterApi";

// Normalize whatever the API/route gives us into one of: 'full' | 'preview' | 'locked'
// 'unlocked' is treated as an alias for 'full'.
function normalizeMode(rawMode) {
  const mode = String(rawMode || "").trim().toLowerCase();
  if (mode === "full" || mode === "unlocked") return "full";
  if (mode === "preview") return "preview";
  return "locked";
}

function getFileKindLabel(url) {
  const clean = String(url || "").split("?")[0].toLowerCase();
  if (/\.(pdf)$/.test(clean)) return "PDF";
  if (/\.(jpg|jpeg|png|webp|svg|gif)$/.test(clean)) return "Image";
  if (/\.(doc|docx)$/.test(clean)) return "Document";
  if (/\.(ppt|pptx)$/.test(clean)) return "Presentation";
  if (/\.(xls|xlsx)$/.test(clean)) return "Spreadsheet";
  if (/\.(mp4|webm|mov|ogg)$/.test(clean)) return "Video";
  return "File";
}

function NewsletterCard({ item, canView }) {
  const fileUrl = item.media || item.url;
  const kind = getFileKindLabel(fileUrl);

 return (
  <div className="overflow-hidden rounded-[24px] border border-[#f0e4e2] bg-white shadow-sm">
    <div className="space-y-3 p-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8837e]">
          Career Insights
          </p>

          <h3 className="m-0 mt-1 text-[18px] font-black text-[#1a0a09]">
            {item.title}
          </h3>
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-end gap-2">

          {/* Lock / Unlock Icon */}
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
              canView
                ? "bg-[#ecfdf3] text-[#16a34a]"
                : "bg-[#f8e8d8] text-[#9a2119]"
            }`}
          >
            {canView ? <UnlockOutlined /> : <LockOutlined />}
          </span>

          {/* PDF / IMAGE */}
          <span className="rounded-full bg-[#fdf0ee] px-3 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-[#9a2119]">
            {kind}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="m-0 text-[14px] leading-7 text-[#4f4347]">
        {item.description}
      </p>

      {/* Buttons only when unlocked */}
      {canView ? (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 rounded-full border border-[#f0e4e2] bg-[#fffdfa] px-2 py-2 text-[10px] font-semibold text-[#9a2119] transition hover:bg-[#fdf0ee]"
          >
            <FileTextOutlined />
            View
          </a>

          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 rounded-full border border-transparent bg-[#9a2119] px-2 py-2 text-[10px] font-semibold text-white transition hover:bg-[#7a1a13]"
            >
              Open Link
              <ArrowRightOutlined />
            </a>
          ) : null}
        </div>
      ) : null}

    </div>
  </div>
);
}

export default function NewsletterPage() {
  const { isUnlocked } = useAppState();
  const { navigate, location, goToDashboard } = usePortalNavigation();
  const pageLocation = useLocation();
  const moduleId = pageLocation.state?.moduleId;
  // Only used as a starting guess while the live API call resolves — never trusted on its own.
  const initialAccessStatus = pageLocation.state?.accessStatus;

  const [moduleMode, setModuleMode] = useState(() => normalizeMode(initialAccessStatus));
  const [previewLimit, setPreviewLimit] = useState(4);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [previewRemaining, setPreviewRemaining] = useState(0);
  const [previewExpired, setPreviewExpired] = useState(false);
  const [unlockModalItem, setUnlockModalItem] = useState(null);
  const [selectedType, setSelectedType] = useState("ALL");
  const hasFullAccess = moduleMode === "full" || isUnlocked("newsletter");
  const isPreview = moduleMode === "preview";

  useEffect(() => {
    let active = true;

   async function loadItems() {
  try {
    const response = await getNewsletters();
    if (active) {
      setItems([...response].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
  } catch (err) {
    if (active) {
      setError(err?.response?.data?.message || err?.message || "Failed to load career insights.");
    }
  }
}

    loadItems();
    return () => {
      active = false;
    };
  }, []);
const filteredItems = useMemo(() => {
  if (selectedType === "ALL") {
    return items;
  }

  return items.filter(
    (item) => item.type?.toUpperCase() === selectedType
  );
}, [items, selectedType]);
  // Always resolve access live from the API — the passed-in accessStatus is only
  // a starting guess for the very first render, never a substitute for the real check.
  useEffect(() => {
    let active = true;

    async function loadAccessMode() {
      if (!moduleId) return;

      try {
        const response = await checkModuleAccess(moduleId);
        if (!active) return;

        if (response?.allowed) {
          setModuleMode(normalizeMode(response?.mode));
          const limit = Number(response?.previewItemLimit);
          setPreviewLimit(Number.isFinite(limit) && limit > 0 ? limit : 4);
        } else {
          setModuleMode("locked");
        }
      } catch {
        if (active) setModuleMode("locked"); // fail closed when we can't verify access
      }
    }

    loadAccessMode();
    return () => {
      active = false;
    };
  }, [moduleId]);

  useEffect(() => {
    if (!previewRemaining || previewExpired) return;

    const timer = setInterval(() => {
      setPreviewRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPreviewExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [previewRemaining, previewExpired]);


  function isItemUnlocked(index) {
    if (hasFullAccess) return true;
    if (isPreview) return index < previewLimit;
    return false;
  }

  async function openNewsletter(item, index) {
    try {
      if (!isItemUnlocked(index)) {
        setUnlockModalItem(item);
        return;
      }

      if (hasFullAccess) {
        return;
      }

      // One of the first `previewLimit` items in preview mode: start the timed preview session.
      const preview = await startPreview({
        moduleId,
        pageType: "newsletter",
        pageId: item.id,
      });

      setPreviewRemaining(preview.remainingSeconds ?? preview.previewDurationSeconds ?? 15);
      setPreviewExpired(false);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to open newsletter.");
    }
  }

  function handleGoToPlans() {
    const returnTo = location.pathname;
    setUnlockModalItem(null);
    navigate(`/app/subscription?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return (
    <ModuleScreen className="space-y-5">
      

      <PageHero backOnly onBack={goToDashboard} />
      {error ? <Alert type="warning" message={error} showIcon style={{ borderRadius: 16 }} /> : null}
<div className="mb-5 flex flex-wrap gap-2">
  {[
    { label: "All", value: "ALL" },
    { label: "Weekly", value: "WEEKLY" },
    { label: "Quarterly", value: "QUARTERLY" },
  ].map((tab) => (
    <button
      key={tab.value}
      type="button"
      onClick={() => setSelectedType(tab.value)}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
        selectedType === tab.value
          ? "bg-[#9a2119] text-white"
          : "border border-[#f0e4e2] bg-white text-[#9a2119] hover:bg-[#fdf0ee]"
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {filteredItems.length > 0 ? (
  filteredItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openNewsletter(item, index)}
              className="text-left"
            >
              <NewsletterCard item={item} canView={isItemUnlocked(index)} />
            </button>
          ))
        ) : !error ? (
          <Empty description="No career insights available right now." />
        ) : null}
      </div>

      <UnlockRedirectModal
        open={Boolean(unlockModalItem)}
        title="Unlock Career Insights"
        itemLabel={unlockModalItem?.title}
        description="Your free career insights preview has already been used. Subscribe to continue."
        onCancel={() => setUnlockModalItem(null)}
        onConfirm={handleGoToPlans}
      />
    </ModuleScreen>
  );
}