export function normalizeMobile(value = "") {
  const digits = String(value).replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length > 10) {
    return digits.slice(-10);
  }

  return digits.slice(0, 10);
}

export function formatOtpMobile(value = "") {
  const mobile = normalizeMobile(value);
  return mobile ? `+91${mobile}` : "";
}

export function isValidEmail(value = "") {
  const email = String(value).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidMobileNumber(value = "") {
  // Indian mobile numbers are 10 digits and start with 6-9
  return /^[6-9]\d{9}$/.test(normalizeMobile(value));
}

export function isValidPassword(value = "", minLength = 6) {
  return String(value).trim().length >= minLength;
}

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include a letter and a number.";

// Policy for SETTING a password (signup, reset, change). Never used on login so older passwords still work.
export function isStrongPassword(value = "") {
  const v = String(value);
  return v.length >= 8 && v.length <= 128 && /[A-Za-z]/.test(v) && /\d/.test(v);
}

export function splitFullName(fullName = "") {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

export function buildUsername(name = "", email = "") {
  const emailPrefix = email.split("@")[0]?.trim();

  if (emailPrefix) {
    return emailPrefix.toLowerCase();
  }

  return name.trim().toLowerCase().replace(/\s+/g, "") || "careermapuser";
}

export function buildLandingData(onboarding = {}) {
  return {
    class: onboarding.selectedClass || "",
    stream: onboarding.selectedStream || "",
    interest: onboarding.selectedInterests || [],
    clarity: onboarding.selectedClarity || "",
    strength: onboarding.selectedStrengths || [],
    priority: onboarding.selectedPriorities || [],
  };
}

export function isValidDateInput(value = "") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function mapApiUserToProfile(user) {
  if (!user) {
    return null;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  return {
    name: fullName,
    email: user.email || "",
    mobile: user.mobile || "",
    password: "",
    address: user.address || "",
    city: user.city || "",
    stateName: user.state || "",
    district: user.district || "",
    country: user.country || "India",
    gender: user.gender || "",
    dob: user.dataOfBirth ? String(user.dataOfBirth).slice(0, 10) : "",
    childName: "",
  };
}
