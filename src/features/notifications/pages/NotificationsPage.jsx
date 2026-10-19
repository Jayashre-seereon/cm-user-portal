import { useEffect, useState } from "react";
import { BellOutlined, CheckCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Badge, Button, Spin } from "antd";
import { getNotifications } from "../../../api/notificationApi";
import { ModuleScreen, PageHero } from "../../../components/ui";
import { useAppState } from "../../../state/AppStateContext";
import { usePortalNavigation } from "../../portal/components/portalPageShared";

function NotificationCard({ item }) {
  const unread = Boolean(item.unread);

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border p-5 transition-all ${
        unread ? "border-[#f0c9bf] bg-[#fff8f5] shadow-[0_6px_20px_rgba(154,33,25,0.06)]" : "border-[#ece1db] bg-white"
      }`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${unread ? "bg-[#9a2119]" : "bg-[#eaded9]"}`} />

      <div className="flex items-start gap-4 pl-2">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: unread ? "#fdf0ef" : "#faf4f2", color: "#9a2119" }}
        >
          {unread ? <BellOutlined /> : <CheckCircleOutlined />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="m-0 truncate text-[15px] font-black text-[#1a0a09]">{item.title}</h3>
            </div>
            {unread ? (
              <Badge status="processing" color="#9a2119" />
            ) : (
              <span className="rounded-full bg-[#f3eeeb] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8c6c67]">
                Read
              </span>
            )}
          </div>

          <p className="mt-3 mb-0 text-[14px] leading-7 text-[#6f6663]">{item.message}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#9b8f97]">
            <span>{item.createdAt || item.time || "Just now"}</span>
            <span className="h-1 w-1 rounded-full bg-[#d8cbc6]" />
            <span>{item.target}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { navigate } = usePortalNavigation();
  const { notifications: liveNotifications, unreadNotificationsCount } = useAppState();
  const [items, setItems] = useState(liveNotifications);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setItems(liveNotifications);
  }, [liveNotifications]);

  async function refreshNotifications() {
    setLoading(true);
    setLoadError("");

    try {
      const data = await getNotifications();
      setItems(data);
    } catch (error) {
      setLoadError(error?.response?.data?.message || error?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  const unreadCount = unreadNotificationsCount ?? items.filter((item) => item.unread).length;

  return (
    <ModuleScreen className="space-y-5">
      {loadError ? <Alert type="warning" message={loadError} showIcon style={{ borderRadius: 16 }} /> : null}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-black tracking-tight text-[#1a0a09]">Notifications</h1>
          <p className="mt-1 mb-0 text-xs text-[#b8837e]">
            {unreadCount} unread updates from mentors, quizzes, subscriptions, and activities.
          </p>
        </div>
        <PageHero backOnly onBack={() => navigate(-1)} className="shrink-0" />
      </div>

      <div className="flex justify-end">
        <Button icon={<ReloadOutlined />} onClick={refreshNotifications} loading={loading}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {loading && !items.length ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-[24px] border border-[#f0e4e2] bg-white">
            <Spin size="large" />
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className="rounded-[24px] border border-[#f0e4e2] bg-white p-6 text-sm text-[#6f6663]">
            No notifications found.
          </div>
        ) : null}

        {items.map((item) => (
          <NotificationCard key={item.id} item={item} />
        ))}
      </div>
    </ModuleScreen>
  );
}
