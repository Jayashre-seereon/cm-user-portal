// Shared display formatters.
export function formatCurrency(value) {
  const numeric = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  if (value === null || value === undefined || value === "" || !Number.isFinite(numeric)) {
    return "";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numeric);
}

// 10-digit Indian mobile -> "+91 98765 43210"; other numbers are returned as typed.
export function formatPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  const national = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  if (national.length === 10) return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
  return String(value).trim();
}

export function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
