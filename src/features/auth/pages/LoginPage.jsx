import { EyeInvisibleOutlined, EyeTwoTone, LockOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Space, Typography } from "antd";
import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getApiErrorMessage, loginWithPassword, sendOtp } from "../../../api/authApi";
import { useAppState } from "../../../state/AppStateContext";
import { useAuthStore } from "../../../store/authStore";
import { formatOtpMobile, isValidEmail, isValidMobileNumber, isValidPassword, mapApiUserToProfile, normalizeMobile } from "../../../utils/auth";
import { AuthShell } from "../components/AuthShell";
import { authPrimaryButtonStyle } from "../components/authShared";

const { Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const navState = location.state || null;
  const { onboarding, saveUserProfile, setProfileIncomplete } = useAppState();
  const setSignupForm = useAuthStore((state) => state.setSignupForm);
  const setOnboardingData = useAuthStore((state) => state.setOnboardingData);
  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const setPendingInstituteOnboarding = useAuthStore((state) => state.setPendingInstituteOnboarding);
  const clearAuthFlow = useAuthStore((state) => state.clearAuthFlow);
  const isExistingUser = params.get("userType") === "existing";
  const initialMode = isExistingUser && params.get("mode") === "email" ? "email" : "mobile";

  const [mode, setMode] = useState(initialMode);
  const [status, setStatus] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [values, setValues] = useState({ mobile: "", email: "", password: "" });
  const mobileError = values.mobile && !isValidMobileNumber(values.mobile) ? "Enter a valid 10 digit mobile number." : "";
  const emailError = isExistingUser && mode === "email" && values.email && !isValidEmail(values.email)
    ? "Enter a valid email address."
    : "";
  const passwordError = isExistingUser && mode === "email" && values.password && !isValidPassword(values.password)
    ? "Password must be at least 6 characters."
    : "";

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus(null);
  }

  function completeLogin(response) {
    const profileIncomplete = Boolean(response?.profileIncomplete);
    const requiresInstituteOnboarding = Boolean(response?.user?.isInstituteStudent) && !profileIncomplete;

    setAuthSession({
      accessToken: response.accessToken || "",
      refreshToken: response.refreshToken || "",
      user: response.user || null,
    });

    const profile = mapApiUserToProfile(response.user);
    if (profile) {
      saveUserProfile(profile);
    }

    const destination = location.state?.from?.pathname
      ? `${location.state.from.pathname}${location.state.from.search || ""}`
      : "/app/dashboard";

    setProfileIncomplete(profileIncomplete);
    setPendingInstituteOnboarding(requiresInstituteOnboarding);
    clearAuthFlow();
    navigate(requiresInstituteOnboarding ? "/onboarding" : destination, { replace: true });
  }

  async function handleSendOtp() {
    const normalizedMobile = normalizeMobile(values.mobile);

    if (!isValidMobileNumber(normalizedMobile)) {
      setStatus({ type: "error", message: "Enter a valid 10 digit mobile number." });
      return;
    }

    const formattedMobile = formatOtpMobile(normalizedMobile);

    try {
      setIsSendingOtp(true);
      setStatus(null);

      const destination = location.state?.from?.pathname
        ? `${location.state.from.pathname}${location.state.from.search || ""}`
        : "/app/dashboard";

      if (isExistingUser) {
        const loginOtpResponse = await sendOtp(formattedMobile, "login");
        // TEMP-DEBUG: remove before production — passes OTP to next screen for testing
        const devOtp = loginOtpResponse?.otp || loginOtpResponse?.data?.otp;
        navigate(
          `/otp-verify?next=${encodeURIComponent(destination)}&identifier=${encodeURIComponent(formattedMobile)}&otpType=login`,
          { state: { devOtp } }
        );
        return;
      }

      const signupOtpResponse = await sendOtp(formattedMobile, "signup");
      // TEMP-DEBUG: remove before production — passes OTP to next screen for testing
      const devOtpSignup = signupOtpResponse?.otp || signupOtpResponse?.data?.otp;
      setOnboardingData(onboarding);
      setSignupForm({ mobile: normalizedMobile });
      navigate(
        `/otp-verify?next=${encodeURIComponent("/profile-setup")}&identifier=${encodeURIComponent(formattedMobile)}&otpType=signup`,
        { state: { devOtp: devOtpSignup } }
      );
    
    } catch (error) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(error, "Failed to send OTP."),
      });
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleEmailLogin() {
    if (!isValidEmail(values.email)) {
      setStatus({ type: "error", message: "Enter a valid email address." });
      return;
    }

    if (!isValidPassword(values.password)) {
      setStatus({ type: "error", message: "Password must be at least 6 characters." });
      return;
    }

    try {
      setIsSubmittingEmail(true);
      setStatus(null);
      const response = await loginWithPassword(values.email.trim(), values.password);
      completeLogin(response);
    } catch (error) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(error, "Failed to login with email and password."),
      });
    } finally {
      setIsSubmittingEmail(false);
    }
  }

  return (
    <AuthShell
      title={isExistingUser ? "Welcome Back" : "Continue Your Journey"}
      subtitle={isExistingUser ? "Choose how you'd like to log in." : "Use OTP to continue."}
      backTo="/auth-entry"
    >
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        {navState?.passwordResetSuccess ? (
          <Alert type="success" message={navState.passwordResetSuccess} showIcon style={{ borderRadius: "10px" }} />
        ) : null}

        <div style={{ display: "flex", gap: "6px", background: "#f7ece8", borderRadius: "12px", padding: "4px" }}>
          {["mobile", ...(isExistingUser ? ["email"] : [])].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              style={{
                flex: 1,
                padding: "8px 4px",
                border: "none",
                cursor: "pointer",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: "700",
                background: mode === item ? "#9a2119" : "transparent",
                color: mode === item ? "#fff" : "#9a2119",
                transition: "all 0.2s",
                boxShadow: mode === item ? "0 2px 8px rgba(154,33,25,0.25)" : "none",
              }}
            >
              {item === "mobile" ? "Mobile OTP" : "Email"}
            </button>
          ))}
        </div>

        {mode === "mobile" ? (
          <Form layout="vertical" className="cm-form-label">
            <Form.Item label="Mobile Number">
              <Input
                className="cm-input-field"
                prefix={<PhoneOutlined style={{ color: "#9a2119" }} />}
                value={values.mobile}
                onChange={(event) => update("mobile", normalizeMobile(event.target.value))}
                size="large"
                style={{ borderRadius: "10px" }}
                inputMode="numeric"
                autoComplete="tel"
              />
              {mobileError ? <div style={{ marginTop: "6px", fontSize: "12px", color: "#c62828" }}>{mobileError}</div> : null}
            </Form.Item>
            <Button
              type="primary"
              block
              size="large"
              disabled={!isValidMobileNumber(values.mobile) || isSendingOtp}
              onClick={handleSendOtp}
              style={{ ...authPrimaryButtonStyle, width: "100%" ,color:"#fff"}}
            >
              {isSendingOtp ? "Sending OTP..." : "Send OTP"}
            </Button>
          </Form>
        ) : null}

        {mode === "email" && isExistingUser ? (
          <Form layout="vertical" className="cm-form-label">
            <Form.Item label="Email Address">
              <Input
                className="cm-input-field"
                prefix={<MailOutlined style={{ color: "#9a2119" }} />}
                value={values.email}
                onChange={(event) => update("email", event.target.value)}
                size="large"
                style={{ borderRadius: "10px" }}
                autoComplete="email"
              />
              {emailError ? <div style={{ marginTop: "6px", fontSize: "12px", color: "#c62828" }}>{emailError}</div> : null}
            </Form.Item>
            <Form.Item label="Password">
              <Input.Password
                className="cm-input-field"
                prefix={<LockOutlined style={{ color: "#9a2119" }} />}
                value={values.password}
                onChange={(event) => update("password", event.target.value)}
                iconRender={(visible) => (visible ? <EyeTwoTone twoToneColor="#9a2119" /> : <EyeInvisibleOutlined />)}
                size="large"
                style={{ borderRadius: "10px" }}
                autoComplete="current-password"
              />
              {passwordError ? <div style={{ marginTop: "6px", fontSize: "12px", color: "#c62828" }}>{passwordError}</div> : null}
            </Form.Item>
            <Button
              type="primary"
              block
              size="large"
              disabled={!isValidEmail(values.email) || !isValidPassword(values.password) || isSubmittingEmail}
              onClick={handleEmailLogin}
              style={{ ...authPrimaryButtonStyle, width: "100%" }}
            >
              {isSubmittingEmail ? "Logging in..." : "Login with Email"}
            </Button>
            <div style={{ marginTop: "10px" }}>
              <Link to="/forgot-password" style={{ fontSize: "13px", fontWeight: "700", color: "#9a2119" }}>
                Forgot Password?
              </Link>
            </div>
          </Form>
        ) : null}

        {status ? <Alert type={status.type} title={status.message} style={{ borderRadius: "10px" }} /> : null}

        <div style={{ textAlign: "center", fontSize: "13px", paddingTop: "4px" }}>
          <div style={{ marginBottom: "6px" }}>
            {isExistingUser ? (
              <Link to="/onboarding?source=auth-entry" style={{ color: "#9a2119", fontWeight: "600" }}>
                New user? Start onboarding
              </Link>
            ) : (
              <Link to="/auth-entry" style={{ color: "#9a2119", fontWeight: "600" }}>
                Existing user? Go to login options
              </Link>
            )}
          </div>
          <Text style={{ fontSize: "11px", color: "#bbb" }}>
            By continuing, you agree to Career Map&apos;s Terms of Service and Privacy Policy.
          </Text>
        </div>
      </Space>
    </AuthShell>
  );
}
