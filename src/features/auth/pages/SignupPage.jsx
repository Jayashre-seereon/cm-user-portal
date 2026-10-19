import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { Alert, Button, Form, Input } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage, sendSignupOtp } from "../../../api/authApi";
import { useAuthStore } from "../../../store/authStore";
import { formatOtpMobile, isValidEmail, isValidMobileNumber, isValidPassword, normalizeMobile } from "../../../utils/auth";
import { AuthShell } from "../components/AuthShell";
import { authPrimaryButtonStyle } from "../components/authShared";

export default function SignupPage() {
  const navigate = useNavigate();
  const setSignupForm = useAuthStore((state) => state.setSignupForm);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    city: "",
    state: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const emailError = form.email && !isValidEmail(form.email) ? "Enter a valid email address." : "";
  const mobileError = form.mobile && !isValidMobileNumber(form.mobile) ? "Enter a valid 10 digit mobile number." : "";
  const passwordError = form.password && !isValidPassword(form.password) ? "Password must be at least 6 characters." : "";
  const confirmPasswordError =
    form.confirmPassword && form.password !== form.confirmPassword ? "Password and confirm password must match." : "";
  const canSubmit =
    form.name.trim() &&
    isValidEmail(form.email) &&
    isValidMobileNumber(form.mobile) &&
    isValidPassword(form.password) &&
    form.password === form.confirmPassword &&
    form.city.trim() &&
    form.state.trim() &&
    !isSubmitting;

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus(null);
  }

  async function handleRegister() {
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.city.trim() || !form.state.trim()) {
      setStatus({ type: "error", message: "Please fill all fields." });
      return;
    }

    if (!isValidEmail(form.email)) {
      setStatus({ type: "error", message: "Enter a valid email address." });
      return;
    }

    if (!isValidMobileNumber(form.mobile)) {
      setStatus({ type: "error", message: "Enter a valid 10 digit mobile number." });
      return;
    }

    if (!isValidPassword(form.password)) {
      setStatus({ type: "error", message: "Password must be at least 6 characters." });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus({ type: "error", message: "Password and confirm password must match." });
      return;
    }

    const otpMobile = formatOtpMobile(form.mobile);

    try {
      setIsSubmitting(true);
      setStatus(null);
      await sendSignupOtp(otpMobile);
      setSignupForm({
        ...form,
        mobile: normalizeMobile(form.mobile),
      });
      navigate(`/otp-verify?next=${encodeURIComponent("/profile-setup")}&identifier=${encodeURIComponent(otpMobile)}&otpType=signup`);
    } catch (error) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(error, "Failed to send OTP."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Create Account" subtitle="Join Career Map today." backTo="/auth-entry">
      <Form layout="vertical" className="cm-form-label" style={{ display: "grid", gap: "2px" }}>
        {[
          ["name", "Full Name"],
          ["email", "Email Address"],
          ["mobile", "Mobile Number"],
          ["password", "Password"],
          ["confirmPassword", "Confirm Password"],
          ["city", "City"],
          ["state", "State"],
        ].map(([key, label]) => (
          <Form.Item key={key} label={label}>
            {String(key).toLowerCase().includes("password") ? (
              <Input.Password
                className="cm-input-field"
                value={form[key]}
                onChange={(event) => update(key, event.target.value)}
                iconRender={(visible) => (visible ? <EyeTwoTone twoToneColor="#9a2119" /> : <EyeInvisibleOutlined />)}
                size="large"
                style={{ borderRadius: "10px" }}
                autoComplete={key === "password" ? "new-password" : "new-password"}
              />
            ) : (
              <Input
                className="cm-input-field"
                value={form[key]}
                onChange={(event) => update(key, key === "mobile" ? normalizeMobile(event.target.value) : event.target.value)}
                size="large"
                style={{ borderRadius: "10px" }}
                inputMode={key === "mobile" ? "numeric" : undefined}
                autoComplete={key === "email" ? "email" : key === "mobile" ? "tel" : undefined}
              />
            )}
            {key === "email" && emailError ? <div style={{ marginTop: "6px", fontSize: "12px", color: "#c62828" }}>{emailError}</div> : null}
            {key === "mobile" && mobileError ? <div style={{ marginTop: "6px", fontSize: "12px", color: "#c62828" }}>{mobileError}</div> : null}
            {key === "password" && passwordError ? <div style={{ marginTop: "6px", fontSize: "12px", color: "#c62828" }}>{passwordError}</div> : null}
            {key === "confirmPassword" && confirmPasswordError ? (
              <div style={{ marginTop: "6px", fontSize: "12px", color: "#c62828" }}>{confirmPasswordError}</div>
            ) : null}
          </Form.Item>
        ))}
        <Button type="primary" block size="large" style={authPrimaryButtonStyle} onClick={handleRegister} disabled={!canSubmit}>
          {isSubmitting ? "Sending OTP..." : "Register"}
        </Button>
        {status ? <Alert type={status.type} title={status.message} style={{ borderRadius: "10px" }} /> : null}
      </Form>
    </AuthShell>
  );
}
