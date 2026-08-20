/**
 * sessionUserCache.js
 *
 * Lightweight helpers for reading/writing the current user object
 * to localStorage so we can potentially avoid unnecessary
 * Firestore getDoc() calls across page loads and browser tabs.
 *
 * TTL:
 *   Cached entries expire after CACHE_TTL_MS (default 5 min).
 *   getCachedUser() returns null for stale entries so the caller
 *   falls through to a fresh Firestore read automatically.
 *
 * Multi-tab:
 *   localStorage is shared across tabs for the same origin, so
 *   multiple tabs can reuse the same cached user data.
 */

import { getDoc } from 'firebase/firestore';

/** Build a per-user storage key so different accounts never collide. */
const storageKey = (uid) => `cached-user-${uid}`;

/** How long a cached entry is considered fresh (5 minutes). */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Read the cached user object from localStorage.
 * Returns the parsed user object, or null if nothing is cached
 * or the entry has expired past CACHE_TTL_MS.
 * @param {string} uid – the Firebase auth uid for the current user.
 */
export const getCachedUser = (uid) => {
  try {
    if (!uid) return null;
    const raw = localStorage.getItem(storageKey(uid));
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
      localStorage.removeItem(storageKey(uid));
      return null;
    }

    // If the entry is older than the TTL, treat it as a cache miss.
    if (Date.now() - cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(storageKey(uid));
      return null;
    }

    return user;
  } catch {
    // Guard against malformed JSON or a sandboxed environment
    // where localStorage throws. Remove the bad entry so we
    // don't keep hitting this path on every read.
    try {
      localStorage.removeItem(storageKey(uid));
    } catch {
      // Ignore storage cleanup failures.
    }
    return null;
  }
};

/**
 * Write the user object to localStorage wrapped in a
 * timestamped envelope so getCachedUser() can enforce TTL.
 * @param {string} uid – the Firebase auth uid for the current user.
 * @param {Object} user – the user document data to cache.
 */
export const setCachedUser = (uid, user) => {
  try {
    if (!uid) return;
    const envelope = JSON.stringify({ user, cachedAt: Date.now() });
    localStorage.setItem(storageKey(uid), envelope);
  } catch {
    // localStorage may be full or unavailable; fail silently.
  }
};

/**
 * Remove the cached user from localStorage.
 * Call this on logout to prevent stale data.
 * @param {string} uid – the Firebase auth uid for the user to clear.
 */
export const clearCachedUser = (uid) => {
  try {
    if (!uid) return;
    localStorage.removeItem(storageKey(uid));
  } catch {
    // Fail silently.
  }
};

/**
 * Fetch user data using a cache-first strategy:
 * 1. Return cached user data if fresh in localStorage.
 * 2. Fall back to Firestore getDoc if missing or stale.
 * 3. Update localStorage cache with fetched data before returning.
 * @param {string} uid – the user ID
 * @param {DocumentReference} userDocRef – the Firestore document reference
 * @returns {Promise<Object|null>} user data object, or null if doc doesn't exist
 */
export const getUserData = async (uid, userDocRef) => {
  const cachedUser = getCachedUser(uid);
  if (cachedUser) {
    console.log('✅ Cache hit for user:', uid);
    return cachedUser;
  }

  console.log('⬇️ Fetching user from Firestore for user:', uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    const fetchedUserData = userDoc.data();
    setCachedUser(uid, fetchedUserData);
    return fetchedUserData;
  }

  return null;
};

