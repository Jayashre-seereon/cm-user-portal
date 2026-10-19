import { PhoneOutlined } from "@ant-design/icons";
import { Alert, Button, Input, Space } from "antd";
import { useState } from "react";
import { useNavigate, useSearchParams,useLocation } from "react-router-dom";
import { getApiErrorMessage, sendOtp, verifyOtp } from "../../../api/authApi";
import { useAppState } from "../../../state/AppStateContext";
import { useAuthStore } from "../../../store/authStore";
import { formatOtpMobile, mapApiUserToProfile } from "../../../utils/auth";
import { AuthShell } from "../components/AuthShell";
import { authPrimaryButtonStyle } from "../components/authShared";

export default function OtpVerifyPage() {
    const navigate = useNavigate();
  const { saveUserProfile, setProfileIncomplete } = useAppState();
  const [params] = useSearchParams();
  // TEMP-DEBUG: remove before production
  const location = useLocation();
  const initialDevOtp = location.state?.devOtp;
  const signupForm = useAuthStore((state) => state.signupForm);
  const setTempToken = useAuthStore((state) => state.setTempToken);
  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const setPendingInstituteOnboarding = useAuthStore((state) => state.setPendingInstituteOnboarding);
  const clearAuthFlow = useAuthStore((state) => state.clearAuthFlow);
  const flowType = params.get("otpType") === "login" ? "login" : "signup";
  const next = params.get("next") || "/profile-setup";
  const identifier = params.get("identifier");
  const mobileNumber = formatOtpMobile(identifier || signupForm.mobile);

  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      setStatus({ type: "error", message: "Enter the 6 digit OTP." });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus(null);
      const response = await verifyOtp(mobileNumber, otp, flowType);

      if (flowType === "login") {
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

        setProfileIncomplete(profileIncomplete);
        setPendingInstituteOnboarding(requiresInstituteOnboarding);
        clearAuthFlow();
        navigate(requiresInstituteOnboarding ? "/onboarding" : next, { replace: true });
        return;
      }

      setTempToken(response.tempToken || "");
      setStatus({ type: "success", message: response.message || "OTP verified successfully." });
      navigate(next, { replace: true });
    } catch (error) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(error, "Failed to verify OTP."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    try {
      setIsResending(true);
      setStatus(null);
      // const response = await sendOtp(mobileNumber, flowType);
      // setStatus({ type: "success", message: response.message || "OTP resent successfully." });
            const response = await sendOtp(mobileNumber, flowType);
      // TEMP-DEBUG: remove this before production — shows OTP on screen for testing
      const devOtp = response.otp || response.data?.otp;
      setStatus({
        type: "success",
        message: devOtp
          ? `${response.message || "OTP resent successfully."} (OTP: ${devOtp})`
          : response.message || "OTP resent successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(error, "Failed to resend OTP."),
      });
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthShell title="Verify OTP" subtitle={`Enter the 6-digit code sent to ${mobileNumber || "your phone"}.`} backTo="/login">
      <Space orientation="vertical" size="large" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
               <div
          style={{
            borderRadius: "16px",
            padding: "16px 24px",
            background: "#fdf5f4",
            border: "1px solid rgba(154,33,25,0.15)",
            textAlign: "center",
            width: "100%",
          }}
        >
          <div style={{ fontSize: "28px", marginBottom: "6px", color: "#9a2119" }}>
            <PhoneOutlined />
          </div>
          <div style={{ fontSize: "13px", color: "#888" }}>OTP sent to</div>
          <div style={{ fontSize: "15px", fontWeight: "800", color: "#9a2119" }}>{mobileNumber || "your phone"}</div>

          {/* TEMP-DEBUG: remove before production */}
          {initialDevOtp ? (
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#9a2119", marginTop: "8px" }}>
              OTP: {initialDevOtp}
            </div>
          ) : null}
        </div>
        <div className="cm-otp" style={{ display: "flex", justifyContent: "center" }}>
          <Input.OTP length={6} value={otp} onChange={setOtp} />
        </div>
        <Button
          type="primary"
          block
          size="large"
          disabled={otp.length !== 6 || isSubmitting}
          onClick={handleVerifyOtp}
          style={{ ...authPrimaryButtonStyle, width: "100%" }}
        >
          {isSubmitting ? "Verifying..." : "Verify and Continue"}
        </Button>
        <Button type="link" onClick={handleResendOtp} disabled={!mobileNumber || isResending} style={{ color: "#9a2119", fontWeight: 700 }}>
          {isResending ? "Resending OTP..." : "Resend OTP"}
        </Button>
        {status ? <Alert type={status.type} title={status.message} style={{ borderRadius: "10px", width: "100%" }} /> : null}
      </Space>
    </AuthShell>
  );
}
