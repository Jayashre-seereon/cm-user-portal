import { checkModuleAccess } from "../../api/moduleAccessApi";
import { buildDashboardModules, moduleRouteMap } from "../../utils/dashboard";
import {
  getPreviewAccessKind,
  getPreviewLimit,
  loadPreviewFreeKeys,
  resolvePreviewAccess,
} from "../../utils/previewAccess";
import { resolveNavigationTarget } from "../../utils/searchNavigation";

/**
 * Lock / unlock rules for what Career Bee opens - the same rules as the global
 * search (GlobalSearchBar.handleSelectItem), so the chat is never a back door:
 *   Locked module   -> nothing inside it opens (unlock prompt instead).
 *   Preview module  -> an item opens only if the module's own list shows it as free.
 *   Unlocked module -> opens.
 */

export const PREVIEW_LOCK_MESSAGE = "This page is locked. Please purchase a subscription to open";
export const MODULE_LOCK_MESSAGE =
  "This module is locked. Please purchase a subscription to continue accessing this module.";
const VERIFY_FAILED_MESSAGE = "We couldn't verify your access right now. Please try again in a moment.";

const MODULE_ROUTES = new Set(Object.values(moduleRouteMap).filter((route) => route !== "/app/subscription"));

export function normalizeAccessStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "unlocked" || value === "full") return "unlocked";
  if (value === "preview") return "preview";
  if (value === "locked") return "locked";
  return null;
}

/** Dashboard modules (with Unlocked / Preview / Locked status) keyed by route. */
export function buildModuleByRoute(dashboardModules = []) {
  const map = new Map();
  buildDashboardModules(dashboardModules).forEach((module) => {
    if (!map.has(module.route)) map.set(module.route, module);
  });
  return map;
}

const pathOf = (url) => String(url || "").split("?")[0].replace(/\/$/, "");

/** In-app path a result card opens, or null for external links. */
export function getLinkPath(item) {
  const url = resolveNavigationTarget(item);
  if (!url || /^https?:\/\//i.test(url)) return null;
  return pathOf(url);
}

/**
 * Badge for a result card: "locked" | "free" | "pending" | null (no badge needed).
 * `freeKeysByRoute` holds the loaded free items of preview "list" modules.
 */
export function getLinkAccess(item, moduleByRoute, freeKeysByRoute = {}) {
  const path = getLinkPath(item);
  if (!path || path === "/app/assessment") return null;
  const status = normalizeAccessStatus(moduleByRoute.get(path)?.accessStatus);
  if (!status || status === "unlocked") return null;
  if (status === "locked") return "locked";
  const freeKeys = freeKeysByRoute[path];
  const access = resolvePreviewAccess(item, path, { freeKeys: freeKeys || undefined });
  if (access === "locked" || access === "free") return access;
  if (access === "pending") return freeKeys === false ? null : "pending";
  return null;
}

/** Preview "list" routes among the given cards whose free items still need loading. */
export function previewRoutesToLoad(items, moduleByRoute) {
  const routes = new Set();
  items.forEach((item) => {
    const path = getLinkPath(item);
    if (!path) return;
    const status = normalizeAccessStatus(moduleByRoute.get(path)?.accessStatus);
    if (status === "preview" && getPreviewAccessKind(path) === "list") routes.add(path);
  });
  return [...routes];
}

export { loadPreviewFreeKeys };

/**
 * Decides what tapping a result card (`item`) or a page button (`page`) does.
 * @returns {Promise<{ action: "navigate", url: string, state?: object } | { action: "external", url: string } | { action: "locked", lock: object }>}
 */
export async function resolveChatOpen({ item, page, moduleByRoute, isLoggedIn, returnTo }) {
  // Page button: open the module's landing page, if the module is open for this user.
  if (page) {
    const url = String(page.web || "");
    const path = pathOf(url);
    const module = moduleByRoute.get(path);
    if (!module?.id || path === "/app/assessment") return { action: "navigate", url };
    try {
      const response = await checkModuleAccess(module.id);
      if (!response?.allowed) return { action: "locked", lock: { title: module.title, message: MODULE_LOCK_MESSAGE } };
      return { action: "navigate", url, state: { moduleId: module.id, accessStatus: response.mode || "full" } };
    } catch {
      return { action: "navigate", url, state: { moduleId: module.id } };
    }
  }

  // Result card: one specific page inside a module (same as a global-search result).
  const url = resolveNavigationTarget(item);
  if (/^https?:\/\//i.test(url)) return { action: "external", url };
  const path = pathOf(url);
  const baseState = { fromGlobalSearch: true, returnTo, searchItem: item };
  const module = moduleByRoute.get(path);

  if (module?.id && path !== "/app/assessment") {
    try {
      const response = await checkModuleAccess(module.id);
      if (!response?.allowed) {
        return { action: "locked", lock: { title: module.title, message: MODULE_LOCK_MESSAGE } };
      }
      if (response.mode !== "full") {
        const freeKeys =
          getPreviewAccessKind(path) === "list"
            ? await loadPreviewFreeKeys(path, getPreviewLimit(path, response))
            : undefined;
        if (resolvePreviewAccess(item, path, { freeKeys }) === "locked") {
          return { action: "locked", lock: { title: module.title, itemLabel: item.title, message: PREVIEW_LOCK_MESSAGE } };
        }
      }
      return { action: "navigate", url, state: { moduleId: module.id, accessStatus: response.mode || "full", ...baseState } };
    } catch {
      return {
        action: "locked",
        lock: { title: module.title, itemLabel: "", heading: "Unable to verify access", message: VERIFY_FAILED_MESSAGE },
      };
    }
  }

  // Logged in but the module list hasn't loaded: don't let the chat bypass the lock.
  if (isLoggedIn && MODULE_ROUTES.has(path) && path !== "/app/assessment") {
    return {
      action: "locked",
      lock: { title: item.title, itemLabel: "", heading: "Unable to verify access", message: VERIFY_FAILED_MESSAGE },
    };
  }
  // Guests: the app's login guard takes over.
  return { action: "navigate", url, state: baseState };
}
