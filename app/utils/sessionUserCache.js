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
import { encryptData, decryptData } from './cacheCrypto';

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
export const getCachedUser = async (uid) => {
  if (!uid) return null;

  const key = storageKey(uid);
  let raw = null;

  const removeIfUnchanged = () => {
    try {
      if (raw !== null && localStorage.getItem(key) === raw) {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage cleanup failures.
    }
  };

  try {
    raw = localStorage.getItem(key);
    if (!raw) return null;

    const encrypted = JSON.parse(raw);
    const { user, cachedAt } = await decryptData(encrypted, uid);

    if (
      !Number.isFinite(cachedAt) ||
      cachedAt > Date.now() ||
      !user ||
      typeof user !== 'object' ||
      Array.isArray(user) ||
      typeof user.first_name !== 'string' ||
      typeof user.user_type !== 'string' ||
      Object.keys(user).length !== 2
    ) {
      removeIfUnchanged();
      return null;
    }

    if (Date.now() - cachedAt > CACHE_TTL_MS) {
      removeIfUnchanged();
      return null;
    }

    if (localStorage.getItem(key) !== raw) {
      return null;
    }

    return user;
  } catch {
    removeIfUnchanged();
    return null;
  }
};

/**
 * Write the user object to localStorage wrapped in a
 * timestamped envelope so getCachedUser() can enforce TTL.
 * @param {string} uid – the Firebase auth uid for the current user.
 * @param {Object} user – the user document data to cache.
 */
export const setCachedUser = async (
  uid,
  user,
  isRequestValid = () => true
) => {
  try {
    if (!uid || !isRequestValid()) return;

    const envelope = {
      user,
      cachedAt: Date.now(),
    };

    const encrypted = await encryptData(envelope, uid);

    if (!isRequestValid()) return;

    localStorage.setItem(
      storageKey(uid),
      JSON.stringify(encrypted)
    );
  } catch {
    // Encryption or storage may be unavailable.
    // Continue without caching.
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

/** Remove all cached user entries without touching unrelated storage. */
export const clearAllCachedUsers = () => {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);

      if (key?.startsWith('cached-user-')) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Fail silently.
  }
};

/**
 * Fetch user data using a cache-first strategy:
 * 1. Return cached user data if fresh in localStorage.
 * 2. Fall back to Firestore getDoc if missing or stale.
 * 3. Update localStorage cache if the request is still valid.
 * @param {string} uid – the user ID
 * @param {DocumentReference} userDocRef – the Firestore document reference
 * @param {() => boolean} isRequestValid – optional guard for the request's auth state
 * @returns {Promise<Object|null>} user data object, or null if doc doesn't exist
 */
export const getUserData = async (
  uid,
  userDocRef,
  isRequestValid = () => true
) => {
  const cachedUser = await getCachedUser(uid);
  if (!isRequestValid()) return null;

  if (cachedUser) {
    //console.log('Cache hit for user:', uid);
    return cachedUser;
  }

  //console.log('Fetching user from Firestore for user:', uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    const data = userDoc.data();

    const fetchedUserData = {
      first_name: data.first_name || '',
      user_type: data.user_type || 'Unknown Type',
    };
    if (!isRequestValid()) {
      return null;
    }

    await setCachedUser(uid, fetchedUserData, isRequestValid);
    if (!isRequestValid()) return null;

    return fetchedUserData;
  }

  return null;
};

