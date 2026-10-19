import { Alert, Button, Col, Form, Input, Row, Select } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage, signupUser } from "../../../api/authApi";
import { useAppState } from "../../../state/AppStateContext";
import { useAuthStore } from "../../../store/authStore";
import {
  buildLandingData,
  buildUsername,
  isValidEmail,
  isValidDateInput,
  isValidMobileNumber,
  isValidPassword,
  splitFullName,
} from "../../../utils/auth";
import { AuthShell } from "../components/AuthShell";

const { Option } = Select;

// "2020-08-19" → "19-08-2020"  (display only)
function toDisplayDate(isoOrRaw) {
  if (!isoOrRaw) return "";
  // already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(isoOrRaw)) return isoOrRaw;
  // YYYY-MM-DD  or  ISO string
  const m = String(isoOrRaw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return isoOrRaw;
}

// "19-08-2020" → "2020-08-19"  (API value)
function toIsoDate(display) {
  if (!display) return "";
  // already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(display)) return display;
  const m = String(display).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return display;
}

// validate display string DD-MM-YYYY
function isValidDisplayDate(val) {
  if (!val) return false;
  if (!/^\d{2}-\d{2}-\d{4}$/.test(val)) return false;
  const iso = toIsoDate(val);
  const d = new Date(iso);
  return !Number.isNaN(d.getTime());
}

// format typed digits into DD-MM-YYYY automatically
function formatDateInput(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const { onboarding, saveUserProfile, userProfile, setProfileIncomplete } = useAppState();
  const signupForm = useAuthStore((state) => state.signupForm);
  const onboardingData = useAuthStore((state) => state.onboardingData);
  const tempToken = useAuthStore((state) => state.tempToken);
  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const clearAuthFlow = useAuthStore((state) => state.clearAuthFlow);

  const mergedOnboarding = useMemo(
    () => ({
      ...onboarding,
      ...onboardingData,
      selectedInterests: onboardingData.selectedInterests?.length
        ? onboardingData.selectedInterests
        : onboarding.selectedInterests,
      selectedStrengths: onboardingData.selectedStrengths?.length
        ? onboardingData.selectedStrengths
        : onboarding.selectedStrengths,
      selectedPriorities: onboardingData.selectedPriorities?.length
        ? onboardingData.selectedPriorities
        : onboarding.selectedPriorities,
    }),
    [onboarding, onboardingData]
  );

  const [values, setValues] = useState({
    name: signupForm.name || mergedOnboarding.name || userProfile.name || "",
    username: buildUsername(
      signupForm.name || mergedOnboarding.name,
      signupForm.email || userProfile.email
    ),
    email: signupForm.email || userProfile.email || "",
    mobile: (signupForm.mobile || userProfile.mobile || "").replace("+91", ""),
    password: signupForm.password || userProfile.password || "",
    address: userProfile.address || "",
    city: signupForm.city || userProfile.city || "",
    stateName: signupForm.state || userProfile.stateName || "",
    district: userProfile.district || "",
    country: userProfile.country || "India",
    // gender pre-filled same as name/email
    gender: signupForm.gender || userProfile.gender || "",
    // dob stored as DD-MM-YYYY for display; converted to YYYY-MM-DD on submit
    dob: toDisplayDate(signupForm.dob || userProfile.dob || ""),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const emailError =
    values.email && !isValidEmail(values.email) ? "Enter a valid email address." : "";
  const mobileError =
    values.mobile && !isValidMobileNumber(values.mobile)
      ? "Enter a valid 10 digit mobile number."
      : "";
  const passwordError =
    values.password && !isValidPassword(values.password)
      ? "Password must be at least 6 characters."
      : "";
  const dobError =
    values.dob && !isValidDisplayDate(values.dob)
      ? "Enter a valid date in DD-MM-YYYY format."
      : "";

  const canSubmit =
    values.name.trim() &&
    values.username.trim() &&
    isValidEmail(values.email) &&
    isValidMobileNumber(values.mobile) &&
    isValidPassword(values.password) &&
    values.address.trim() &&
    values.city.trim() &&
    values.stateName.trim() &&
    values.country.trim() &&
    values.gender &&
    isValidDisplayDate(values.dob) &&
    !isSubmitting;

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus(null);
  }

  async function handleSubmit() {
    if (!tempToken) {
      setStatus({ type: "error", message: "Please verify OTP first." });
      return;
    }

    const { firstName, lastName } = splitFullName(values.name);
    // convert DD-MM-YYYY → ISO for API
    const isoDate = toIsoDate(values.dob);

    const payload = {
      firstName,
      lastName,
      username: values.username.trim(),
      email: values.email.trim(),
      password: values.password,
      country: values.country.trim() || "India",
      state: values.stateName.trim(),
      city: values.city.trim(),
      district: values.district.trim(),
      gender: values.gender,
      address: values.address.trim(),
      dataOfBirth: new Date(isoDate).toISOString(),
      image: "image_url.png",
      mobile: "+91" + values.mobile,
      status: "Active",
      landingData: buildLandingData(mergedOnboarding),
    };

    try {
      setIsSubmitting(true);
      const response = await signupUser(payload, tempToken);

      setAuthSession({
        accessToken: response.accessToken || "",
        refreshToken: response.refreshToken || "",
        user: response.user || null,
      });

      clearAuthFlow();

      saveUserProfile({
        ...userProfile,
        ...values,
        mobile: "+91" + values.mobile,
        dob: isoDate, // store ISO internally
      });
      setProfileIncomplete(false);

      navigate("/promo");
    } catch (error) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(error, "Failed to create profile."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Complete Your Profile" subtitle="Help us serve you better." backTo="/login">
      <Form layout="vertical">
        <Row gutter={12}>

          {/* Full Name */}
          <Col xs={24} md={12}>
            <Form.Item label="Full Name">
              <Input
                value={values.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </Form.Item>
          </Col>

          {/* Username */}
          <Col xs={24} md={12}>
            <Form.Item label="Username">
              <Input
                value={values.username}
                onChange={(e) => update("username", e.target.value)}
              />
            </Form.Item>
          </Col>

          {/* Email */}
          <Col xs={24} md={12}>
            <Form.Item
              label="Email"
              validateStatus={emailError ? "error" : ""}
              help={emailError}
            >
              <Input
                value={values.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </Form.Item>
          </Col>

          {/* Mobile */}
          <Col xs={24} md={12}>
            <Form.Item
              label="Mobile Number"
              validateStatus={mobileError ? "error" : ""}
              help={mobileError}
            >
              <Input
                addonBefore="+91"
                value={values.mobile}
                maxLength={10}
                onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))}
              />
            </Form.Item>
          </Col>

          {/* Password */}
          <Col xs={24} md={12}>
            <Form.Item
              label="Password"
              validateStatus={passwordError ? "error" : ""}
              help={passwordError}
            >
              <Input.Password
                value={values.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </Form.Item>
          </Col>

          {/* Gender — pre-filled from signupForm/userProfile like name & email */}
          <Col xs={24} md={12}>
            <Form.Item label="Gender">
              <Select
                value={values.gender || undefined}
                placeholder="Select gender"
                onChange={(val) => update("gender", val)}
              >
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Date of Birth — user types/sees DD-MM-YYYY, API gets YYYY-MM-DD */}
          <Col xs={24} md={12}>
            <Form.Item
              label="Date of Birth"
              validateStatus={dobError ? "error" : ""}
              help={dobError || "Format: DD-MM-YYYY"}
            >
              <Input
                value={values.dob}
                placeholder="DD-MM-YYYY"
                maxLength={10}
                onChange={(e) => update("dob", formatDateInput(e.target.value))}
              />
            </Form.Item>
          </Col>

          {/* Country */}
          <Col xs={24} md={12}>
            <Form.Item label="Country">
              <Input
                value={values.country}
                onChange={(e) => update("country", e.target.value)}
              />
            </Form.Item>
          </Col>

          {/* State */}
          <Col xs={24} md={12}>
            <Form.Item label="State">
              <Input
                value={values.stateName}
                onChange={(e) => update("stateName", e.target.value)}
              />
            </Form.Item>
          </Col>

          {/* District */}
          <Col xs={24} md={12}>
            <Form.Item label="District">
              <Input
                value={values.district}
                onChange={(e) => update("district", e.target.value)}
              />
            </Form.Item>
          </Col>

          {/* City */}
          <Col xs={24} md={12}>
            <Form.Item label="City">
              <Input
                value={values.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </Form.Item>
          </Col>

          {/* Address — full width */}
          <Col xs={24}>
            <Form.Item label="Address">
              <Input.TextArea
                value={values.address}
                rows={3}
                onChange={(e) => update("address", e.target.value)}
              />
            </Form.Item>
          </Col>

        </Row>

        {status && (
          <Alert
            type={status.type}
            message={status.message}
            showIcon
            className="mb-4"
            style={{ borderRadius: 10 }}
          />
        )}

        <Button
          type="primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={isSubmitting}
          block
          style={{ borderRadius: 10, height: 44, fontWeight: 700 }}
        >
          {isSubmitting ? "Creating..." : "Submit"}
        </Button>
      </Form>
    </AuthShell>
  );
}
