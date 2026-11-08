import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  getAppServiceWorkerRegistration,
  getOrRegisterAppServiceWorker,
  isServiceWorkerSupported,
  registerAppServiceWorker,
} from "../app/utils/serviceWorker.js";

function browser(t, window, navigator) {
  for (const [name, value] of Object.entries({ window, navigator })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else delete globalThis[name];
    });
  }
}

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
let nextSetup = 0;

async function notifications(t, setup) {
  const key = `notification.test.setup.${nextSetup++}`;
  globalThis[Symbol.for(key)] = setup;
  t.after(() => delete globalThis[Symbol.for(key)]);
  const firebase = dataModule(`export const handleNotificationSetup = globalThis[Symbol.for(${JSON.stringify(key)})];`);
  const serviceWorker = new URL("../app/utils/serviceWorker.js", import.meta.url).href;
  let source = await readFile(new URL("../app/utils/notification.js", import.meta.url), "utf8");
  source = source
    .replace("from '../firebaseConfig'", `from ${JSON.stringify(firebase)}`)
    .replace("from './serviceWorker'", `from ${JSON.stringify(serviceWorker)}`);
  return import(dataModule(source));
}

for (const scenario of [
  { name: "SSR", window: undefined, navigator: undefined },
  { name: "browsers without service workers", window: { isSecureContext: true }, navigator: {} },
  { name: "browsers without registration support", window: { isSecureContext: true }, navigator: { serviceWorker: {} } },
  {
    name: "insecure origins",
    window: { isSecureContext: false },
    navigator: { serviceWorker: {
      register: () => assert.fail("Unexpected registration on an insecure origin"),
      getRegistration: () => assert.fail("Unexpected registration lookup on an insecure origin"),
      getRegistrations: () => assert.fail("Unexpected worker cleanup on an insecure origin"),
    } },
  },
]) {
  test(`${scenario.name} skip service workers and notifications quietly`, async (t) => {
    browser(t, scenario.window, scenario.navigator);
    const setup = t.mock.fn(() => assert.fail("Unexpected notification setup"));
    const { initializeNotifications } = await notifications(t, setup);
    // Observe app calls after imports so Node's deferred module warnings stay visible.
    const errors = t.mock.method(console, "error", () => {});

    assert.equal(isServiceWorkerSupported(), false);
    assert.equal(await getAppServiceWorkerRegistration(), null);
    assert.equal(await registerAppServiceWorker(), null);
    assert.equal(await getOrRegisterAppServiceWorker(), null);
    await initializeNotifications();
    assert.equal(setup.mock.callCount(), 0);
    assert.equal(errors.mock.callCount(), 0);
  });
}

test("secure browsers register the app worker after cleaning up legacy Firebase workers", async (t) => {
  const observed = [];
  const registration = { scope: "/" };
  t.mock.method(console, "log", () => {});
  browser(t, { isSecureContext: true }, { serviceWorker: {
    getRegistration: async (scope) => {
      assert.equal(scope, "/");
      return undefined;
    },
    getRegistrations: async () => [
      { active: { scriptURL: "https://example.com/sw.js" }, unregister: () => assert.fail("App worker removed") },
      { active: { scriptURL: "https://example.com/firebase-messaging-sw.js" }, unregister: async () => observed.push("legacy-active") },
      { scriptURL: "https://example.com/firebase-messaging-sw.js", unregister: async () => observed.push("legacy-script") },
    ],
    register: async (script, options) => {
      assert.equal(script, "/sw.js");
      assert.deepEqual(options, { scope: "/" });
      observed.push("register");
      return registration;
    },
  } });

  assert.equal(isServiceWorkerSupported(), true);
  assert.equal(await getOrRegisterAppServiceWorker(), registration);
  assert.deepEqual(observed, ["legacy-active", "legacy-script", "register"]);
});

test("secure browsers reuse the existing app registration", async (t) => {
  const registration = { scope: "/" };
  browser(t, { isSecureContext: true }, { serviceWorker: {
    getRegistration: async (scope) => {
      assert.equal(scope, "/");
      return registration;
    },
    getRegistrations: () => assert.fail("Existing registration triggered worker cleanup"),
    register: () => assert.fail("Existing registration triggered a second registration"),
  } });

  assert.equal(await getOrRegisterAppServiceWorker(), registration);
});

test("supported service worker registration preserves genuine failures", async (t) => {
  const failure = new Error("Service worker script failed to load");
  browser(t, { isSecureContext: true }, { serviceWorker: {
    getRegistrations: async () => [],
    register: async () => { throw failure; },
  } });

  await assert.rejects(registerAppServiceWorker(), (error) => error === failure);
});

test("supported browsers initialize notifications", async (t) => {
  browser(t, { isSecureContext: true }, { serviceWorker: { register() {} } });
  const setup = t.mock.fn(async () => {});
  const { initializeNotifications } = await notifications(t, setup);
  const errors = t.mock.method(console, "error", () => {});

  await initializeNotifications();
  assert.equal(setup.mock.callCount(), 1);
  assert.equal(errors.mock.callCount(), 0);
});

test("supported notification setup reports genuine failures", async (t) => {
  browser(t, { isSecureContext: true }, { serviceWorker: { register() {} } });
  const failure = new Error("Notification token registration failed");
  const { initializeNotifications } = await notifications(t, async () => { throw failure; });
  const errors = t.mock.method(console, "error", () => {});

  await initializeNotifications();
  assert.equal(errors.mock.callCount(), 1);
  assert.deepEqual(errors.mock.calls[0].arguments, ["Notification setup failed:", failure]);
});
