import { useAuthStore } from "../store/authStore";

// Tiny shared in-flight + short-lived cache helper so identical GETs fired together
// (provider + page, repeated effects) hit the network once. Keyed by access token so a
// different user never sees another user's cached response.
const entries = new Map();

export function sharedRequest(key, fetcher, { ttlMs = 3000, force = false } = {}) {
  const token = useAuthStore.getState().accessToken || "";
  const cacheKey = `${token}::${key}`;
  const now = Date.now();
  const existing = entries.get(cacheKey);

  if (!force && existing && (existing.pending || now - existing.at < ttlMs)) {
    return existing.promise;
  }

  const entry = { at: now, pending: true, promise: null };
  entry.promise = Promise.resolve()
    .then(fetcher)
    .then(
      (value) => {
        entry.pending = false;
        entry.at = Date.now();
        return value;
      },
      (error) => {
        // Never cache failures.
        if (entries.get(cacheKey) === entry) entries.delete(cacheKey);
        throw error;
      }
    );
  entries.set(cacheKey, entry);
  return entry.promise;
}

export function clearSharedRequests() {
  entries.clear();
}
