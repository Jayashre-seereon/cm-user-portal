import { useAuthStore } from "../../store/authStore";

/**
 * Career Bee conversation storage (sessionStorage, one key per user id or "guest").
 * Every storage access is wrapped in try/catch: storage can be blocked or full.
 */

const KEY_PREFIX = "careermap-career-bee:";
export const MAX_STORED_MESSAGES = 60;

export function getChatOwnerKey(user) {
  const id = user?.id ?? user?._id;
  return id !== undefined && id !== null && String(id) !== "" ? `user-${id}` : "guest";
}

function storageKey(ownerKey) {
  return `${KEY_PREFIX}${ownerKey}`;
}

export function loadConversation(ownerKey) {
  try {
    const raw = window.sessionStorage.getItem(storageKey(ownerKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.content === "string"
    );
  } catch {
    return [];
  }
}

export function saveConversation(ownerKey, messages) {
  try {
    if (!messages.length) {
      window.sessionStorage.removeItem(storageKey(ownerKey));
      return;
    }
    window.sessionStorage.setItem(storageKey(ownerKey), JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
  } catch {
    // Storage unavailable or full: the conversation still works in memory.
  }
}

export function clearAllConversations() {
  try {
    const keys = [];
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key && key.startsWith(KEY_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
}

// Logout hook: both logout paths (AppState.logout and authStore.logout, which the
// axios refresh-failure path also calls) clear the access token. Listening here
// clears Career Bee conversations without touching the existing logout code.
// (Those paths already call sessionStorage.clear(); this keeps the guarantee
// even if that ever changes.)
if (typeof window !== "undefined") {
  let previousToken = useAuthStore.getState().accessToken;
  useAuthStore.subscribe((state) => {
    const nextToken = state.accessToken;
    if (previousToken && !nextToken) {
      clearAllConversations();
    }
    previousToken = nextToken;
  });
}
