/**
 * sessionUserCache.js
 *
 * Lightweight helpers for reading/writing the current user object
 * to sessionStorage so we can potentially avoid unnecessary
 * Firestore getDoc() calls during the same browser session.
 *
 * Integration plan:
 *   - Before calling getDoc() in UserContext, check getCachedUser(uid).
 *   - After fetching the user from Firestore, call setCachedUser(uid, user).
 *
 * TTL:
 *   Cached entries expire after CACHE_TTL_MS (default 5 min).
 *   getCachedUser() returns null for stale entries so the caller
 *   falls through to a fresh Firestore read automatically.
 *
 * Open questions / TODO:
 *   - Profile updates: when the user edits their profile, we need to
 *     either invalidate the cache or update it in place.
 *   - Multi-tab: sessionStorage is per-tab, so each tab will still
 *     hit Firestore once. That's probably fine for now.
 */

/** Build a per-user storage key so different accounts never collide. */
const storageKey = (uid) => `cached-user-${uid}`;

/** How long a cached entry is considered fresh (5 minutes). */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Read the cached user object from sessionStorage.
 * Returns the parsed user object, or null if nothing is cached
 * or the entry has expired past CACHE_TTL_MS.
 * @param {string} uid – the Firebase auth uid for the current user.
 */
export const getCachedUser = (uid) => {
  try {
    if (!uid) return null;
    const raw = sessionStorage.getItem(storageKey(uid));
    if (!raw) return null;

    const { user, cachedAt } = JSON.parse(raw);

    // Reject malformed cache entries. If cachedAt is not a valid number,
    // the TTL check below would evaluate against NaN and the entry would
    // never expire.
    if (
      !Number.isFinite(cachedAt) ||
      !user ||
      typeof user !== "object"
    ) {
      sessionStorage.removeItem(storageKey(uid));
      return null;
    }

    // If the entry is older than the TTL, treat it as a cache miss.
    if (Date.now() - cachedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(storageKey(uid));
      return null;
    }

    return user;
  } catch {
    // Guard against malformed JSON or a sandboxed environment
    // where sessionStorage throws. Remove the bad entry so we
    // don't keep hitting this path on every read.
    try {
      sessionStorage.removeItem(storageKey(uid));
    } catch {
      // Ignore storage cleanup failures.
    }
    return null;
  }
};

/**
 * Write the user object to sessionStorage wrapped in a
 * timestamped envelope so getCachedUser() can enforce TTL.
 * @param {string} uid – the Firebase auth uid for the current user.
 * @param {Object} user – the user document data to cache.
 */
export const setCachedUser = (uid, user) => {
  try {
    if (!uid) return;
    const envelope = JSON.stringify({ user, cachedAt: Date.now() });
    sessionStorage.setItem(storageKey(uid), envelope);
  } catch {
    // sessionStorage may be full or unavailable; fail silently.
  }
};

/**
 * Remove the cached user from sessionStorage.
 * Call this on logout to prevent stale data.
 * @param {string} uid – the Firebase auth uid for the user to clear.
 */
export const clearCachedUser = (uid) => {
  try {
    if (!uid) return;
    sessionStorage.removeItem(storageKey(uid));
  } catch {
    // Fail silently.
  }
};
