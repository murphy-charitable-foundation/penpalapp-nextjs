/** Browser storage that remains usable when localStorage is unavailable. */
export class SafeStorage {
  static #inMemoryStorage = new Map();
  static #pendingChanges = new Map();

  static #getStorage() {
    try {
      return typeof window === "undefined" ? null : window.localStorage;
    } catch {
      // Accessing localStorage itself can throw a SecurityError.
      return null;
    }
  }

  static getItem(key) {
    key = String(key);
    const storage = SafeStorage.#getStorage();

    // A failed write/removal takes precedence over an older persisted value.
    // Retry it when this key is used again; storage can become available later.
    if (SafeStorage.#pendingChanges.has(key)) {
      const value = SafeStorage.#pendingChanges.get(key);
      try {
        if (storage) {
          if (value === null) {
            storage.removeItem(key);
          } else {
            storage.setItem(key, value);
          }
          SafeStorage.#pendingChanges.delete(key);
        }
      } catch {
        // Keep the pending change and its in-memory value.
      }
      return value;
    }

    try {
      if (storage) {
        const value = storage.getItem(key);
        if (value === null) {
          SafeStorage.#inMemoryStorage.delete(key);
        } else {
          SafeStorage.#inMemoryStorage.set(key, value);
        }
        return value;
      }
    } catch {
      // Retain the last value observed before storage became unavailable.
    }
    return SafeStorage.#inMemoryStorage.get(key) ?? null;
  }

  static setItem(key, value) {
    key = String(key);
    value = String(value);
    SafeStorage.#inMemoryStorage.set(key, value);
    SafeStorage.#pendingChanges.set(key, value);

    try {
      const storage = SafeStorage.#getStorage();
      if (storage) {
        storage.setItem(key, value);
        SafeStorage.#pendingChanges.delete(key);
      }
    } catch {
      // Quota limits and denied access must not interrupt the caller.
    }
  }

  static removeItem(key) {
    key = String(key);
    SafeStorage.#inMemoryStorage.delete(key);
    SafeStorage.#pendingChanges.set(key, null);

    try {
      const storage = SafeStorage.#getStorage();
      if (storage) {
        storage.removeItem(key);
        SafeStorage.#pendingChanges.delete(key);
      }
    } catch {
      // Keep a pending removal so an old stored value cannot reappear.
    }
  }
}
