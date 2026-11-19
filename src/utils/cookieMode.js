// True when the API lives on the same site as this web app (same host, localhost, or the same
// registrable domain such as thecareermap.in + api.thecareermap.in). Only then can the browser send the
// backend's httpOnly refresh cookie, so the refresh token no longer needs to be kept in localStorage.
// On a different site (for example an onrender.com API) the old body-token flow is used unchanged.
function detect() {
  try {
    if (typeof window === "undefined") return false;
    const base = import.meta.env.VITE_API_BASE_URL;
    if (!base) return false;
    const apiHost = new URL(base, window.location.href).hostname.toLowerCase();
    const pageHost = window.location.hostname.toLowerCase();
    if (apiHost === pageHost) return true;
    const local = new Set(["localhost", "127.0.0.1", "[::1]"]);
    if (local.has(apiHost) && local.has(pageHost)) return true;
    if (/^[\d.]+$/.test(apiHost) || /^[\d.]+$/.test(pageHost)) return false;
    const site = (host) => host.split(".").slice(-2).join(".");
    const apiSite = site(apiHost);
    // never treat shared hosting domains as one site
    const shared = ["onrender.com", "vercel.app", "netlify.app", "herokuapp.com", "ngrok-free.dev", "github.io"];
    return !shared.includes(apiSite) && apiSite === site(pageHost) && apiSite.includes(".");
  } catch {
    return false;
  }
}

export const COOKIE_MODE = detect();
