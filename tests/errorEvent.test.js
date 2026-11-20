import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildErrorEvent, normalizeError } from "../app/utils/errorEvent.mjs";

test("error analytics contains only allowlisted categories, even with private context", () => {
  const error = new TypeError("Message from child@example.com: private conversation");
  error.code = "auth/network-request-failed";
  error.stack = "TypeError: private conversation\n at child@example.com (/users/private-uid/messages/secret:12:34)";
  const event = buildErrorEvent(error, {
    source: "window.onerror",
    description: "private message",
    userId: "private-uid",
    error_name: "override@example.com",
    error_code: "override-code",
    error_stack: "override stack",
    error_page_path: "/conversation/private-uid",
    error_fingerprint: "content-derived-id",
    extra: { email: "child@example.com" },
  }, "/profile/private-uid?email=child@example.com");

  assert.deepEqual(event, {
    error_name: "TypeError",
    error_code: "auth/network-request-failed",
    error_source: "window.onerror",
    error_source_type: "error",
  });
});

test("user-controlled categories and message-derived codes are not accepted", () => {
  const error = new Error("someone@example.com (auth/user-not-found)");
  error.name = "someone@example.com";
  error.code = "auth/someone@example.com";
  assert.deepEqual(buildErrorEvent(error, { source: "someone@example.com" }), {
    error_name: "Error",
    error_code: "unknown",
    error_source: "handled",
    error_source_type: "error",
  });
  assert.deepEqual(buildErrorEvent(new Error("Alice's private message")),
    buildErrorEvent(new Error("Bob's different private message")));
});

test("browser errors and rejection events preserve safe categories and local diagnostics", () => {
  const error = new Error("Private detail");
  error.code = "permission-denied";
  const errorEvent = { type: "error", error, filename: "/users/private-uid.js", lineno: 42 };
  assert.equal(normalizeError(errorEvent).error, error);
  assert.deepEqual(buildErrorEvent(errorEvent, { source: "window.onerror" }), {
    error_name: "Error", error_code: "permission-denied",
    error_source: "window.onerror", error_source_type: "error_event",
  });
  const rejection = { type: "unhandledrejection", reason: "Private rejection" };
  assert.equal(normalizeError(rejection).error.message, "Private rejection");
  assert.deepEqual(buildErrorEvent(rejection, { source: "unhandled_rejection" }), {
    error_name: "Error", error_code: "unknown",
    error_source: "unhandled_rejection", error_source_type: "promise_rejection",
  });
});

test("arbitrary and hostile thrown values cannot break the error reporter", () => {
  const hostile = new Proxy({}, { get() { throw new Error("Getter failure"); } });
  const revoked = Proxy.revocable({}, {});
  revoked.revoke();
  for (const value of [undefined, null, 1, true, 1n, Symbol("private"), () => {}, hostile, revoked.proxy]) {
    const event = buildErrorEvent(value, hostile);
    assert.equal(event.error_name, "Error");
    assert.equal(event.error_code, "unknown");
    assert.equal(event.error_source, "handled");
    assert.equal(event.error_source_type, typeof value);
  }
});

test("Next.js navigation control-flow errors are excluded, including wrapped/plain errors", () => {
  const redirect = new Error("NEXT_REDIRECT");
  const notFound = Object.assign(new Error("Not found"), { digest: "NEXT_NOT_FOUND" });
  for (const input of [
    redirect,
    notFound,
    { type: "error", error: redirect },
    { reason: notFound },
    { message: "Redirect", digest: "NEXT_REDIRECT;replace;/private-uid;307;" },
    ...[401, 403, 404].map((status) => ({ digest: `NEXT_HTTP_ERROR_FALLBACK;${status}` })),
  ]) {
    assert.equal(buildErrorEvent(input), null);
  }
  assert.notEqual(buildErrorEvent({ digest: "NEXT_REDIRECTED_USER_DATA" }), null);
});

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
let nextSetup = 0;

async function browserAnalytics(t, logEvent) {
  const key = `analytics.test.${nextSetup++}`;
  globalThis[Symbol.for(key)] = logEvent;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    location: { href: "https://example.test/conversation/private-id?email=private@example.test" },
  } });
  t.after(() => {
    delete globalThis[Symbol.for(key)];
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else delete globalThis.window;
  });
  const firebase = dataModule(`
    export const getAnalytics = () => "analytics-instance";
    export const logEvent = globalThis[Symbol.for(${JSON.stringify(key)})];
  `);
  const config = dataModule("export const app = {};");
  const errorEvent = new URL("../app/utils/errorEvent.mjs", import.meta.url).href;
  const source = (await readFile(new URL("../app/utils/analytics.js", import.meta.url), "utf8"))
    .replace('from "firebase/analytics"', `from ${JSON.stringify(firebase)}`)
    .replace('from "../firebaseConfig.js"', `from ${JSON.stringify(config)}`)
    .replace('from "./errorEvent.mjs"', `from ${JSON.stringify(errorEvent)}`);
  return import(dataModule(source));
}

test("the production browser logger sends only safe error metadata", async (t) => {
  const calls = [];
  const analytics = await browserAnalytics(t, (...args) => calls.push(args));
  t.mock.method(console, "error", () => {});
  const error = Object.assign(new Error("Private user message"), { code: "partial-failure" });
  analytics.logError(error, { source: "web_worker", userId: "secret", error_name: "secret" });
  assert.deepEqual(calls, [["analytics-instance", "uncaught_error", {
    error_name: "Error", error_code: "partial-failure",
    error_source: "web_worker", error_source_type: "error",
    page_location: "https://redacted.invalid/",
    page_referrer: "https://redacted.invalid/",
    page_title: "Redacted page",
  }]]);
  analytics.logError({ digest: "NEXT_NOT_FOUND" });
  assert.equal(calls.length, 1);
});

test("browser error reporting does not throw if the analytics SDK fails", async (t) => {
  const analytics = await browserAnalytics(t, () => { throw new Error("Analytics unavailable"); });
  t.mock.method(console, "error", () => {});
  assert.doesNotThrow(() => analytics.logError(new Error("Original failure")));
});

test("dormant reminder analytics only sends fixed reason values", async (t) => {
  const calls = [];
  const analytics = await browserAnalytics(t, (...args) => calls.push(args));
  for (const reason of ["user", "admin", "someone@example.com", undefined]) {
    analytics.logDormantMessageSent(reason);
  }
  assert.deepEqual(calls.map((call) => call[2]), ["user", "admin", "unknown", "unknown"].map((reason) => ({
    dormant_conversation_reason: reason,
    page_location: "https://redacted.invalid/",
    page_referrer: "https://redacted.invalid/",
    page_title: "Redacted page",
  })));
});
