import {
  ArrowRightOutlined,
  CustomerServiceOutlined,
  LockOutlined,
  SafetyOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Alert, Button, Col, Form, Input, Row, Space, Tag, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "../../../state/AppStateContext";
import { usePortalNavigation } from "../../portal/components/portalPageShared";
import { PageHero, SectionCard, SoftTag } from "../../../components/ui";
import { changeUserPassword, createHelpRequest } from "../../../api/userApi";
import { getApiErrorMessage, logoutUser } from "../../../api/authApi";
import { isValidEmail, isValidPassword } from "../../../utils/auth";
import { useLocation } from "react-router-dom";

function SettingAction({ icon, title, description, onClick, cta = "Open" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-4 rounded-[22px] border border-[#eedad4] bg-white px-5 py-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-[#d9b7ae] hover:shadow-lg"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fdf0ed] text-brand">
          {icon}
        </div>
        <div>
          <div className="text-[15px] font-black text-ink">{title}</div>
          <div className="mt-1 text-sm leading-6 text-muted">{description}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm font-bold text-brand">
        <span>{cta}</span>
        <ArrowRightOutlined className="transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}

export default function SettingsPage() {
  const { logout, requestProfileEdit, userProfile } = useAppState();
  const { navigate } = usePortalNavigation();
  const location = useLocation();
  const [view, setView] = useState("menu");
  const [status, setStatus] = useState(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSendingHelp, setIsSendingHelp] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [helpForm, setHelpForm] = useState({
    email: userProfile.email || "",
    subject: "",
    message: "",
  });
  const helpEmailError = helpForm.email && !isValidEmail(helpForm.email) ? "Please enter a valid email address." : "";
  const currentPasswordError = passwordForm.currentPassword && !passwordForm.currentPassword.trim()
    ? "Enter your current password."
    : "";
  const newPasswordError = passwordForm.newPassword && !isValidPassword(passwordForm.newPassword)
    ? "New password must be at least 6 characters."
    : "";
  const confirmPasswordError =
    passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
      ? "New password and confirm password must match."
      : "";
  const canSavePassword =
    passwordForm.currentPassword.trim() &&
    isValidPassword(passwordForm.newPassword) &&
    passwordForm.newPassword === passwordForm.confirmPassword &&
    !isSavingPassword;

  useEffect(() => {
    setHelpForm((current) => ({
      ...current,
      email: userProfile.email || current.email,
    }));
  }, [userProfile.email]);

  useEffect(() => {
    if (location.state?.openHelpCenter) {
      setView("help");
      navigate("/app/settings", { replace: true, state: null });
    }
  }, [location.state?.openHelpCenter, navigate]);

  const profileSummary = useMemo(
    () => ({
      name: userProfile.name || "Your profile",
      email: userProfile.email || "No email added",
      mobile: userProfile.mobile || "Mobile not linked",
    }),
    [userProfile]
  );

  function showView(nextView) {
    setStatus(null);
    setView(nextView);
  }

  async function handlePasswordChange() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setStatus({ type: "error", message: "Fill all password fields." });
      return;
    }

    if (!isValidPassword(passwordForm.newPassword)) {
      setStatus({ type: "error", message: "New password must be at least 6 characters." });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatus({ type: "error", message: "New password and confirm password must match." });
      return;
    }

    try {
      setIsSavingPassword(true);
      setStatus(null);
      const response = await changeUserPassword(passwordForm);
      setStatus({
        type: "success",
        message: response?.message || "Password changed successfully.",
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(error, "Failed to change password."),
      });
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleSendHelp() {
    if (!helpForm.email.trim() || !helpForm.subject.trim() || !helpForm.message.trim()) {
      setStatus({ type: "error", message: "Please add your email, subject, and message." });
      return;
    }

    try {
      setIsSendingHelp(true);
      setStatus(null);
      const response = await createHelpRequest(helpForm);
      setStatus({
        type: "success",
        message: response?.message || "Your help request has been sent.",
      });
      setHelpForm((current) => ({
        ...current,
        subject: "",
        message: "",
      }));
      message.success("Support request submitted");
    } catch (error) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(error, "Failed to send support request."),
      });
    } finally {
      setIsSendingHelp(false);
    }
  }

  if (view === "password") {
    return (
      <div className="space-y-6">
        <PageHero
          backOnly
          onBack={() => showView("menu")}
        />
        <SectionCard
          title={<Space><LockOutlined className="text-brand" /> Change Password</Space>}
          extra={<Button onClick={() => showView("menu")}>Back</Button>}
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            <Form layout="vertical" className="cm-form-label">
              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item label="Current Password">
                    <Input.Password
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                      }
                      className="!rounded-xl !h-11"
                      autoComplete="current-password"
                    />
                    {currentPasswordError ? (
                      <div className="mt-2 text-[12px] text-[#c62828]">{currentPasswordError}</div>
                    ) : null}
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="New Password">
                    <Input.Password
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                      }
                      className="!rounded-xl !h-11"
                      autoComplete="new-password"
                    />
                    {newPasswordError ? <div className="mt-2 text-[12px] text-[#c62828]">{newPasswordError}</div> : null}
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Confirm Password">
                    <Input.Password
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                      }
                      className="!rounded-xl !h-11"
                      autoComplete="new-password"
                    />
                    {confirmPasswordError ? (
                      <div className="mt-2 text-[12px] text-[#c62828]">{confirmPasswordError}</div>
                    ) : null}
                  </Form.Item>
                </Col>
              </Row>

              <Button
                type="primary"
                onClick={handlePasswordChange}
                loading={isSavingPassword}
                disabled={!canSavePassword}
                className="!h-12 !rounded-xl !px-8 font-bold"
              >
                Save Password
              </Button>
            </Form>

            <div className="rounded-[22px] border border-[#eedad4] bg-[#fffaf8] p-5">
              <SoftTag color="volcano">Security</SoftTag>
              <h3 className="mt-4 text-lg font-black text-ink">Password tips</h3>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-muted">
                <li>Use at least 6 characters.</li>
                <li>Keep it different from your mobile OTP code.</li>
                <li>Change it whenever you feel your account needs a refresh.</li>
              </ul>
            </div>
          </div>
          {status ? (
            <Alert className="mt-5" type={status.type} message={status.message} showIcon />
          ) : null}
        </SectionCard>
      </div>
    );
  }

  if (view === "help") {
    return (
      <div className="space-y-6">
        <PageHero backOnly onBack={() => showView("menu")} />
        <SectionCard
          title={<Space><CustomerServiceOutlined className="text-brand" /> Help Centre</Space>}
          extra={<Button onClick={() => showView("menu")}>Back</Button>}
        >
          <div className="space-y-5">
            <Form layout="vertical" className="cm-form-label">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Your Email">
                    <Input
                      value={helpForm.email}
                      onChange={(event) => setHelpForm((current) => ({ ...current, email: event.target.value }))}
                      className="!rounded-xl !h-11"
                    />
                    {helpEmailError ? <div className="mt-2 text-[12px] text-[#c62828]">{helpEmailError}</div> : null}
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Subject">
                    <Input
                      value={helpForm.subject}
                      onChange={(event) => setHelpForm((current) => ({ ...current, subject: event.target.value }))}
                      className="!rounded-xl !h-11"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Message">
                    <Input.TextArea
                      rows={6}
                      value={helpForm.message}
                      onChange={(event) => setHelpForm((current) => ({ ...current, message: event.target.value }))}
                      className="!rounded-2xl"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Button
                type="primary"
                onClick={handleSendHelp}
                loading={isSendingHelp}
                className="!h-12 !rounded-xl !px-8 font-bold"
              >
                Send Request
              </Button>
            </Form>
          </div>
          {status ? (
            <Alert className="mt-5" type={status.type} message={status.message} showIcon />
          ) : null}
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        backOnly
        onBack={() => navigate(-1)}
      />

      <SectionCard
        title={<Space><SettingOutlined className="text-brand" /> Settings</Space>}
        extra={<Tag color="default" className="!m-0 !rounded-full !px-4 !py-1 !font-bold">{profileSummary.name}</Tag>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SettingAction
            icon={<UserOutlined />}
            title="Edit Profile"
            description="Update your name, email, address, city, state, gender, and date of birth."
            cta="Edit"
            onClick={() => {
              requestProfileEdit();
              navigate("/app/profile");
            }}
          />
          <SettingAction
            icon={<LockOutlined />}
            title="Change Password"
            description="Secure your account with a new password from the same place."
            onClick={() => showView("password")}
          />
          <SettingAction
            icon={<CustomerServiceOutlined />}
            title="Help Centre"
            description="Send support requests directly to the backend help desk."
            onClick={() => showView("help")}
          />
          <SettingAction
            icon={<SafetyOutlined />}
            title="Logout"
            description="Sign out from the user portal on this device."
            cta="Logout"
            onClick={async () => {
              try {
                await logoutUser();
              } catch {
                // Fall back to local logout even if the backend logout fails.
              } finally {
                logout();
                navigate("/auth-entry");
              }
            }}
          />
        </div>
      </SectionCard>

      {status ? <Alert type={status.type} message={status.message} showIcon /> : null}
    </div>
  );
}
