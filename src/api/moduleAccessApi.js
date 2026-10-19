import api from "./axios";
import { useAuthStore } from "../store/authStore";

export async function checkModuleAccess(moduleId) {
  const response = await api.post("/module-access/check", {
    moduleId,
  });

  return response.data;
}

/**
 * Start a new 15-second preview session
 */
export async function startPreview({
  moduleId,
  pageType,
  pageId,
}) {
  const response = await api.post("/module-access/preview/start", {
    moduleId,
    pageType,
    pageId,
  });

  return response.data;
}

/**
 * Verify preview session
 */
export async function verifyPreview(previewSessionId) {
  const response = await api.post("/module-access/preview/verify", {
    previewSessionId,
  });

  return response.data;
}