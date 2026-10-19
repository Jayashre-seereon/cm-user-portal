import {
  AppstoreOutlined,
  BellOutlined,
  BookOutlined,
  BulbOutlined,
  CreditCardOutlined,
  DownOutlined,
  FundProjectionScreenOutlined,
  GlobalOutlined,
  HomeOutlined,
  LogoutOutlined,
  NotificationOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Badge, Button, Divider, Dropdown, Popover, Space, Typography } from "antd";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logoutUser } from "../../api/authApi";
import { checkModuleAccess } from "../../api/moduleAccessApi";
import { UnlockRedirectModal } from "../../features/portal/components/portalPageShared";
import { useAppState } from "../../state/AppStateContext";
import { buildDashboardModules } from "../../utils/dashboard";
import BrandMark from "../branding/BrandMark";
import GlobalSearchBar from "./GlobalSearchBar";

const moduleItems = [
  { key: "/app/library", icon: <BookOutlined />, label: "Career Archive" },
  { key: "/app/assessment", icon: <FundProjectionScreenOutlined />, label: "Career Psychometric Assessment" },
  { key: "/app/learn", icon: <ReadOutlined />, label: "Career & Personality Videos" },
  { key: "/app/entrance-exam", icon: <BulbOutlined />, label: "Entrance Exam" },
  { key: "/app/book-mentor", icon: <TeamOutlined />, label: "Book Your Mentor" },
  { key: "/app/scholarships", icon: <TrophyOutlined />, label: "Scholarships" },
  { key: "/app/institutes", icon: <AppstoreOutlined />, label: "Institutes" },
  { key: "/app/newsletter", icon: <NotificationOutlined />, label: "Career Insights" },
  { key: "/app/abroad", icon: <GlobalOutlined />, label: "Study Abroad" },
  { key: "/app/subscription", icon: <CreditCardOutlined />, label: "Subscriptions" },
  { key: "/app/quiz", icon: <QuestionCircleOutlined />, label: "Quiz" },
];

export default function WebsiteNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [lockedModule, setLockedModule] = useState(null);
  const { unreadNotificationsCount, userProfile, logout, notifications, dashboardData } = useAppState();
  const previewNotifications = (notifications || []).slice(0, 3);

  const moduleMenu = {
    items: moduleItems.map((item) => ({ key: item.key, icon: item.icon, label: item.label })),
    selectedKeys: [location.pathname],
    onClick: ({ key }) => handleModuleNavClick(key),
    className: "!grid !grid-cols-2 !gap-0 !min-w-[320px] !rounded-2xl !p-1.5 !shadow-lg md:!min-w-[360px]",
  };

  const profileMenuItems = [
    { key: "profile", icon: <UserOutlined />, label: "Profile" },
    { key: "settings", icon: <SettingOutlined />, label: "Settings" },
    { key: "logout", icon: <LogoutOutlined />, label: "Logout", danger: true },
  ];

  async function handleModuleNavClick(routePath) {
    const curated = buildDashboardModules(dashboardData?.modules || []);
    const matchedModule = curated.find((card) => card.route === routePath);

    if (!matchedModule?.id) {
      navigate(routePath);
      return;
    }

    try {
      const response = await checkModuleAccess(matchedModule.id);

      if (!response?.allowed) {
        setLockedModule({
          title: matchedModule.title,
          message: response?.message,
        });
        return;
      }

      navigate(routePath, {
        state: {
          accessStatus: response.mode,
          moduleId: matchedModule.id,
        },
      });
    } catch (err) {
      console.error(err);
      navigate(routePath);
    }
  }

  const notificationOverlay = (
    <div className="w-[300px]">
      <div className="mb-3 flex items-center justify-between">
        <Typography.Text className="!text-[14px] !font-semibold !text-ink">
          Notifications
        </Typography.Text>
        <div className="flex items-center gap-2">
          <Badge count={unreadNotificationsCount} size="small" />
          <button
            type="button"
            className="text-[11px] text-[#9b8f97] transition-colors hover:text-brand"
            onClick={() => {}}
          >
            Mark all read
          </button>
        </div>
      </div>

      <Space direction="vertical" size={8} className="!w-full">
        {previewNotifications.map((item) => (
          <div
            key={item.id}
            className={`cursor-pointer rounded-xl border px-3 py-2.5 transition-colors ${
              item.unread
                ? "border-[#f2d1c7] bg-[#fff7f4] hover:bg-[#fef0eb]"
                : "border-[#efe3de] bg-white hover:bg-[#faf5f3]"
            }`}
          >
            <div className="mb-1 flex items-start justify-between gap-3">
              <Typography.Text className="!text-[13px] !font-semibold !text-ink">
                {item.title}
              </Typography.Text>
              {item.unread ? <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9a2119]" /> : null}
            </div>
            <Typography.Paragraph className="!mb-1 !text-[12px] !leading-5 !text-[#6f6570]">
              {item.message}
            </Typography.Paragraph>
            <Typography.Text className="!text-[11px] !text-[#9b8f97]">
              {item.time}
            </Typography.Text>
          </div>
        ))}
      </Space>

      <Divider className="!my-3" />
      <div className="flex items-center justify-between">
        <Button
          type="link"
          className="!h-auto !p-0 !text-[13px] !font-semibold !text-brand"
          onClick={() => {
            setNotificationsOpen(false);
            navigate("/app/notifications");
          }}
        >
          View all {"->"}
        </Button>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-[#eaded9] bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-[1280px] px-3 md:px-6">
        <div className="flex min-h-14 items-center justify-between gap-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-5">
            <Link to="/app/dashboard" className="shrink-0">
              <BrandMark />
            </Link>

            <nav className="min-w-0 flex-1 overflow-x-auto">
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Link
                  to="/app/dashboard"
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors ${
                    location.pathname === "/app/dashboard"
                      ? "bg-[#fdf0ed] text-brand"
                      : "text-[#4b3d47] hover:bg-[#faf4f2] hover:text-brand"
                  }`}
                >
                  <HomeOutlined className="text-[13px]" />
                  Home
                </Link>

                <Dropdown menu={moduleMenu} trigger={["click", "hover"]}>
                  <button
                    type="button"
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors ${
                      moduleItems.some((item) => item.key === location.pathname)
                        ? "bg-[#fdf0ed] text-brand"
                        : "text-[#4b3d47] hover:bg-[#faf4f2] hover:text-brand"
                    }`}
                  >
                    Modules
                    <DownOutlined className="text-[11px] opacity-60" />
                  </button>
                </Dropdown>
              </div>
            </nav>

            {/* Desktop Global Search Bar */}
            <div className="relative hidden min-w-[260px] max-w-[420px] flex-1 lg:block">
              <GlobalSearchBar />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Mobile Search Toggle */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#eaded9] bg-[#faf4f2] text-[#9a2119] transition hover:border-[#d8b4ad] lg:hidden"
              title="Search"
            >
              <SearchOutlined className="text-[14px]" />
            </button>

            <Popover
              trigger="click"
              placement="bottomRight"
              open={notificationsOpen}
              onOpenChange={setNotificationsOpen}
              content={notificationOverlay}
              overlayInnerStyle={{ borderRadius: 16, padding: 16 }}
            >
              <Badge count={unreadNotificationsCount} size="small" offset={[-2, 2]}>
                <Button
                  className="!flex !h-8 !w-8 !items-center !justify-center !rounded-lg !border-[#9a2119] !bg-[#faf4f2] !text-[#9a2119] hover:!border-[#d8b4ad] hover:!text-brand"
                  icon={<BellOutlined />}
                />
              </Badge>
            </Popover>

            <div className="mx-1 hidden h-5 w-px bg-[#eaded9] md:block" />

            <Dropdown
              menu={{
                items: profileMenuItems,
                onClick: async ({ key }) => {
                  if (key === "profile") navigate("/app/profile");
                  if (key === "settings") navigate("/app/settings");
                  if (key === "logout") {
                    try {
                      await logoutUser();
                    } catch {
                      // Fall back to local logout even if the backend logout fails.
                    } finally {
                      logout();
                      navigate("/auth-entry");
                    }
                  }
                },
              }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <button type="button" className="flex items-center gap-2 px-1 py-1">
                <Avatar
                  size={28}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#9a2119", borderRadius: 6 }}
                />
                <span className="hidden text-[13px] font-medium text-[#2e1f28] md:inline">
                  {userProfile?.name || "demo2026"}
                </span>
                <DownOutlined className="text-[11px] text-[#9b8f97]" />
              </button>
            </Dropdown>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {mobileSearchOpen && (
          <div className="border-t border-[#eaded9] py-2 lg:hidden">
            <GlobalSearchBar />
          </div>
        )}
      </div>

      <UnlockRedirectModal
        open={!!lockedModule}
        title={`Unlock ${lockedModule?.title || "Module"}`}
        itemLabel={lockedModule?.title}
        description={
          lockedModule?.message ||
          "Free preview already used. Please purchase a subscription to continue accessing this module."
        }
        onCancel={() => setLockedModule(null)}
        onConfirm={() => {
          navigate(`/app/subscription?returnTo=${encodeURIComponent(location.pathname)}`);
          setLockedModule(null);
        }}
      />
    </header>
  );
}
