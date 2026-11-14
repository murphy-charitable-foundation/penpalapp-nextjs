import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// Mock SafeStorage class (copied from useAnalytics.js for testing)
class SafeStorage {
  static #inMemoryStorage = new Map();
  static #isStorageAvailable = null;

  static #checkStorageAvailable() {
    if (SafeStorage.#isStorageAvailable !== null) {
      return SafeStorage.#isStorageAvailable;
    }

    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, "1");
      localStorage.removeItem(testKey);
      SafeStorage.#isStorageAvailable = true;
    } catch (e) {
      SafeStorage.#isStorageAvailable = false;
    }
    return SafeStorage.#isStorageAvailable;
  }

  static getItem(key) {
    try {
      if (SafeStorage.#checkStorageAvailable()) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      // Silently fall back to in-memory storage
    }
    return SafeStorage.#inMemoryStorage.get(key) ?? null;
  }

  static setItem(key, value) {
    try {
      if (SafeStorage.#checkStorageAvailable()) {
        localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      // Silently fall back to in-memory storage
    }
    SafeStorage.#inMemoryStorage.set(key, value);
  }

  static removeItem(key) {
    try {
      if (SafeStorage.#checkStorageAvailable()) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      // Silently fall back to in-memory storage
    }
    SafeStorage.#inMemoryStorage.delete(key);
  }

  static reset() {
    SafeStorage.#inMemoryStorage.clear();
    SafeStorage.#isStorageAvailable = null;
  }
}

const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

describe('SafeStorage', () => {
  beforeEach(() => {
    SafeStorage.reset();
    const values = new Map();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key),
        clear: () => values.clear(),
      },
    });
  });

  afterEach(() => {
    SafeStorage.reset();
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", originalLocalStorage);
    } else {
      delete globalThis.localStorage;
    }
  });

  test('should store and retrieve values from localStorage when available', () => {
    SafeStorage.setItem('testKey', 'testValue');
    assert.equal(SafeStorage.getItem("testKey"), "testValue");
  });

  test('should return null for non-existent keys', () => {
    assert.equal(SafeStorage.getItem("nonExistentKey"), null);
  });

  test('should remove items from localStorage', () => {
    SafeStorage.setItem('testKey', 'testValue');
    SafeStorage.removeItem('testKey');
    assert.equal(SafeStorage.getItem("testKey"), null);
  });

  test('should fall back to in-memory storage when localStorage is blocked', () => {
    // Temporarily block localStorage
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error("localStorage is not allowed");
    };

    SafeStorage.reset();

    SafeStorage.setItem("testKey", "testValue");
    assert.equal(SafeStorage.getItem("testKey"), "testValue");

    // Restore localStorage
    localStorage.setItem = originalSetItem;
  });

  test('should handle consecutive operations with in-memory fallback', () => {
    SafeStorage.setItem("key1", "value1");
    SafeStorage.setItem("key2", "value2");
    
    assert.equal(SafeStorage.getItem("key1"), "value1");
    assert.equal(SafeStorage.getItem("key2"), "value2");
    
    SafeStorage.removeItem("key1");
    assert.equal(SafeStorage.getItem("key1"), null);
    assert.equal(SafeStorage.getItem("key2"), "value2");
  });
});
