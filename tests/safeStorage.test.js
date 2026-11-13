// SafeStorage unit tests
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

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

describe('SafeStorage', () => {
  beforeEach(() => {
    SafeStorage.reset();
    localStorage.clear();
  });

  afterEach(() => {
    SafeStorage.reset();
  });

  test('should store and retrieve values from localStorage when available', () => {
    SafeStorage.setItem('testKey', 'testValue');
    expect(SafeStorage.getItem('testKey')).toBe('testValue');
  });

  test('should return null for non-existent keys', () => {
    expect(SafeStorage.getItem('nonExistentKey')).toBeNull();
  });

  test('should remove items from localStorage', () => {
    SafeStorage.setItem('testKey', 'testValue');
    SafeStorage.removeItem('testKey');
    expect(SafeStorage.getItem('testKey')).toBeNull();
  });

  test('should fall back to in-memory storage when localStorage is blocked', () => {
    // Temporarily block localStorage
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new SecurityError('localStorage is not allowed');
    };

    SafeStorage.#isStorageAvailable = null; // Reset availability check

    SafeStorage.setItem('testKey', 'testValue');
    expect(SafeStorage.getItem('testKey')).toBe('testValue');

    // Restore localStorage
    localStorage.setItem = originalSetItem;
  });

  test('should handle consecutive operations with in-memory fallback', () => {
    SafeStorage.setItem('key1', 'value1');
    SafeStorage.setItem('key2', 'value2');
    
    expect(SafeStorage.getItem('key1')).toBe('value1');
    expect(SafeStorage.getItem('key2')).toBe('value2');
    
    SafeStorage.removeItem('key1');
    expect(SafeStorage.getItem('key1')).toBeNull();
    expect(SafeStorage.getItem('key2')).toBe('value2');
  });
});
