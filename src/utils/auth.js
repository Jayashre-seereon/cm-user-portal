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
  return normalizeMobile(value).length === 10;
}

export function isValidPassword(value = "", minLength = 6) {
  return String(value).trim().length >= minLength;
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
