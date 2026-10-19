import axios from "axios";
import { useAuthStore } from "../store/authStore";

function cleanBaseUrl(baseUrl) {
  return baseUrl?.replace(/\/$/, "");
}

function resolveApiBaseUrl(baseUrl) {
  const cleaned = cleanBaseUrl(baseUrl);

  if (!cleaned) {
    return "http://localhost:5000/api";
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

function redirectToAuthEntry() {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/app")) {
    window.location.replace("/auth-entry");
  }
}

async function refreshSession() {
  if (!refreshSessionPromise) {
    refreshSessionPromise = (async () => {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        throw new Error("Refresh token missing");
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken,
      });
      const nextAccessToken = response?.data?.accessToken;

      if (!nextAccessToken) {
        throw new Error("Refresh token request did not return an access token");
      }

      useAuthStore.getState().updateAuthSession({
        accessToken: nextAccessToken,
        refreshToken: response?.data?.refreshToken,
        user: response?.data?.user,
      });

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
      useAuthStore.getState().logout();
      redirectToAuthEntry();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
