import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { COOKIE_MODE } from "../utils/cookieMode";

function cleanBaseUrl(baseUrl) {
  return baseUrl?.replace(/\/$/, "");
}

function resolveApiBaseUrl(baseUrl) {
  const cleaned = cleanBaseUrl(baseUrl);

  if (!cleaned) {
    // Local development fallback only; production builds must set VITE_API_BASE_URL.
    return import.meta.env.DEV ? "http://localhost:5000/api" : "/api";
  }

  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

function getHeaderValue(headers, key) {
  if (!headers) {
    return "";
  }

  if (typeof headers.get === "function") {
    return headers.get(key) || headers.get(key.toLowerCase()) || "";
  }

  return headers[key] || headers[key.toLowerCase()] || "";
}

function setHeaderValue(headers, key, value) {
  if (!headers) {
    return;
  }

  if (typeof headers.set === "function") {
    headers.set(key, value);
    return;
  }

  headers[key] = value;
}

function removeHeaderValue(headers, key) {
  if (!headers) {
    return;
  }

  if (typeof headers.delete === "function") {
    headers.delete(key);
    headers.delete(key.toLowerCase());
    return;
  }

  delete headers[key];
  delete headers[key.toLowerCase()];
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: COOKIE_MODE,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshSessionPromise = null;

function isPublicAuthRoute(requestUrl) {
  return (
    requestUrl.includes("/auth/login/password") ||
    requestUrl.includes("/auth/send-otp") ||
    requestUrl.includes("/auth/verify-otp") ||
    requestUrl.includes("/auth/refresh-token") ||
    requestUrl.includes("/auth/logout") ||
    requestUrl.includes("/user/signup") ||
    requestUrl.includes("/user/forgot-password") ||
    requestUrl.includes("/user/reset-password")
  );
}

const PUBLIC_PATH_PREFIXES = [
  "/auth-entry",
  "/onboarding",
  "/login",
  "/signup",
  "/otp-verify",
  "/profile-setup",
  "/forgot-password",
  "/reset-password",
  "/splash",
];

function redirectToAuthEntry() {
  if (typeof window === "undefined") {
    return;
  }

  const path = window.location.pathname;
  const isPublicPath = path === "/" || PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (!isPublicPath) {
    window.location.replace("/auth-entry");
  }
}

// Only an explicit rejection of the refresh token ends the session; network
// errors, timeouts and 5xx responses must not log the user out.
function isRefreshRejected(refreshError) {
  const refreshStatus = refreshError?.response?.status;

  if (refreshStatus) {
    return refreshStatus === 401 || refreshStatus === 403;
  }

  return !refreshError?.request;
}

async function refreshSession() {
  if (!refreshSessionPromise) {
    refreshSessionPromise = (async () => {
      const refreshToken = useAuthStore.getState().refreshToken;

      // Cookie mode: the httpOnly cookie carries the token; a token still in storage from an
      // older login is sent once so the server can move that session to the cookie.
      if (!refreshToken && !COOKIE_MODE) {
        throw new Error("Refresh token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        refreshToken ? { refreshToken } : {},
        COOKIE_MODE ? { withCredentials: true } : undefined
      );
      const nextAccessToken = response?.data?.accessToken;

      if (!nextAccessToken) {
        throw new Error("Refresh token request did not return an access token");
      }

      // The refresh cookie may belong to a different account (e.g. another login on the same
      // browser). Never swap this user's session for someone else's.
      const signedInUser = useAuthStore.getState().user;
      const signedInId = signedInUser?.id ?? signedInUser?._id;
      if (signedInId != null && response?.data?.userId != null && String(response.data.userId) !== String(signedInId)) {
        const mismatch = new Error("Session belongs to a different account");
        mismatch.response = { status: 401 };
        throw mismatch;
      }

      useAuthStore.getState().updateAuthSession({
        accessToken: nextAccessToken,
        refreshToken: response?.data?.refreshToken,
        user: response?.data?.user,
      });
      // Now that the cookie holds the session, drop any copy kept in browser storage.
      if (COOKIE_MODE) useAuthStore.getState().updateAuthSession({ refreshToken: "" });

      return nextAccessToken;
    })().finally(() => {
      refreshSessionPromise = null;
    });
  }

  return refreshSessionPromise;
}

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    const requestUrl = String(config.url || "");
    const explicitAuthorization = getHeaderValue(config.headers, "Authorization");
    const publicAuthRoute = isPublicAuthRoute(requestUrl);

    if (explicitAuthorization) {
      return config;
    }

    if (token && !publicAuthRoute) {
      setHeaderValue(config.headers, "Authorization", `Bearer ${token}`);
    } else if (!token) {
      removeHeaderValue(config.headers, "Authorization");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || "");
    const shouldSkipRefresh = isPublicAuthRoute(requestUrl);

    if (status !== 401 || shouldSkipRefresh) {
      return Promise.reject(error);
    }

    if (error?.config?._retry) {
      useAuthStore.getState().logout();
      redirectToAuthEntry();
      return Promise.reject(error);
    }

    try {
      const nextAccessToken = await refreshSession();
      const retryConfig = {
        ...error.config,
        _retry: true,
        headers: { ...(error.config.headers || {}) },
      };

      setHeaderValue(retryConfig.headers, "Authorization", `Bearer ${nextAccessToken}`);
      return api.request(retryConfig);
    } catch (refreshError) {
      if (isRefreshRejected(refreshError)) {
        useAuthStore.getState().logout();
        redirectToAuthEntry();
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;
