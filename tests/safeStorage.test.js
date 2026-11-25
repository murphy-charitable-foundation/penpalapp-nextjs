import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { SafeStorage } from "../app/utils/safeStorage.js";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
let storage;
let key;
let sequence = 0;

function setWindow(value) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value,
  });
}

beforeEach(() => {
  const values = new Map();
  storage = {
    getItem: (name) => values.get(String(name)) ?? null,
    setItem: (name, value) => values.set(String(name), String(value)),
    removeItem: (name) => values.delete(String(name)),
  };
  key = `safe-storage-test-${sequence++}`;
  setWindow({ localStorage: storage });
});

afterEach(() => {
  // Remove fallback state through the public API; no test-only reset method.
  setWindow({ localStorage: { removeItem() {} } });
  SafeStorage.removeItem(key);
  if (originalWindow) {
    Object.defineProperty(globalThis, "window", originalWindow);
  } else {
    delete globalThis.window;
  }
});

test("SafeStorage reads and writes the actual browser storage", () => {
  assert.equal(SafeStorage.getItem(key), null);
  SafeStorage.setItem(key, "saved");
  assert.equal(storage.getItem(key), "saved");
  assert.equal(SafeStorage.getItem(key), "saved");

  storage.setItem(key, "changed in another tab");
  assert.equal(SafeStorage.getItem(key), "changed in another tab");
});

test("SafeStorage uses storage string values and preserves empty strings", () => {
  SafeStorage.setItem(key, 123);
  assert.equal(SafeStorage.getItem(key), "123");
  SafeStorage.setItem(key, "");
  assert.equal(SafeStorage.getItem(key), "");
  SafeStorage.setItem(key, null);
  assert.equal(SafeStorage.getItem(key), "null");
});

test("SafeStorage removes values from browser storage and its fallback", () => {
  SafeStorage.setItem(key, "saved");
  SafeStorage.removeItem(key);
  assert.equal(storage.getItem(key), null);
  assert.equal(SafeStorage.getItem(key), null);
  delete globalThis.window;
  assert.equal(SafeStorage.getItem(key), null);
});

test("SafeStorage works during SSR without a window", () => {
  delete globalThis.window;
  assert.equal(SafeStorage.getItem(key), null);
  SafeStorage.setItem(key, "server fallback");
  assert.equal(SafeStorage.getItem(key), "server fallback");
  SafeStorage.removeItem(key);
  assert.equal(SafeStorage.getItem(key), null);
});

test("SafeStorage works in a browser without localStorage", () => {
  setWindow({});
  SafeStorage.setItem(key, "browser fallback");
  assert.equal(SafeStorage.getItem(key), "browser fallback");
  SafeStorage.removeItem(key);
  assert.equal(SafeStorage.getItem(key), null);
});

test("SafeStorage handles a SecurityError from the localStorage getter", () => {
  setWindow({
    get localStorage() {
      throw new DOMException("Access denied", "SecurityError");
    },
  });
  SafeStorage.setItem(key, "fallback");
  assert.equal(SafeStorage.getItem(key), "fallback");
  SafeStorage.removeItem(key);
  assert.equal(SafeStorage.getItem(key), null);
});

test("SafeStorage retains the latest write when quota is exceeded", () => {
  storage.setItem(key, "old value");
  const write = storage.setItem;
  storage.setItem = () => {
    throw new DOMException("Storage full", "QuotaExceededError");
  };

  // Readable storage should remain readable even when writes are blocked.
  assert.equal(SafeStorage.getItem(key), "old value");
  SafeStorage.setItem(key, "new value");
  assert.equal(SafeStorage.getItem(key), "new value");
  assert.equal(storage.getItem(key), "old value");

  storage.setItem = write;
  assert.equal(SafeStorage.getItem(key), "new value");
  assert.equal(storage.getItem(key), "new value");
});

test("SafeStorage retains the last read value if reads become blocked", () => {
  storage.setItem(key, "existing value");
  assert.equal(SafeStorage.getItem(key), "existing value");
  storage.getItem = () => {
    throw new DOMException("Access denied", "SecurityError");
  };
  assert.equal(SafeStorage.getItem(key), "existing value");
});

test("SafeStorage persists fallback writes once storage becomes available", () => {
  delete globalThis.window;
  SafeStorage.setItem(key, "latest value");
  storage.setItem(key, "stale value");
  setWindow({ localStorage: storage });

  assert.equal(SafeStorage.getItem(key), "latest value");
  assert.equal(storage.getItem(key), "latest value");
  storage.setItem(key, "external update");
  assert.equal(SafeStorage.getItem(key), "external update");
});

test("SafeStorage does not cache an initial lack of storage", () => {
  delete globalThis.window;
  assert.equal(SafeStorage.getItem(key), null);
  storage.setItem(key, "available later");
  setWindow({ localStorage: storage });
  assert.equal(SafeStorage.getItem(key), "available later");
});

test("SafeStorage retries failed removals without exposing stale values", () => {
  SafeStorage.setItem(key, "old value");
  const remove = storage.removeItem;
  storage.removeItem = () => {
    throw new DOMException("Access denied", "SecurityError");
  };
  SafeStorage.removeItem(key);
  assert.equal(storage.getItem(key), "old value");
  assert.equal(SafeStorage.getItem(key), null);

  storage.removeItem = remove;
  assert.equal(SafeStorage.getItem(key), null);
  assert.equal(storage.getItem(key), null);
});

test("SafeStorage forgets values removed externally", () => {
  SafeStorage.setItem(key, "saved");
  storage.removeItem(key);
  assert.equal(SafeStorage.getItem(key), null);
  delete globalThis.window;
  assert.equal(SafeStorage.getItem(key), null);
});
