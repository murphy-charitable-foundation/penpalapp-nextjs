import test from "node:test";
import assert from "node:assert/strict";
import { logError } from "../app/utils/serverAnalytics.mjs";

function configure(t) {
  for (const [key, value] of Object.entries({ GA_MEASUREMENT_ID: "G-TEST", GA_API_SECRET: "test-secret" })) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }
  return t.mock.method(console, "error", () => {});
}

test("server analytics keeps private details in logs and sends only safe categories", async (t) => {
  const logs = configure(t);
  const requests = [];
  t.mock.method(globalThis, "fetch", async (...args) => {
    requests.push(args);
    return { ok: true };
  });
  const error = Object.assign(new TypeError("Private message from someone@example.com"), { code: "private-code" });
  error.stack = "TypeError: private message\n at send (/srv/private-uid/api.js:12:34)";
  const errorInfo = { userId: "verified-uid", description: "Private details", arbitrary: "secret" };
  await logError(error, errorInfo);
  const [url, options] = requests[0];
  assert.equal(url.origin + url.pathname, "https://www.google-analytics.com/mp/collect");
  assert.equal(url.searchParams.get("measurement_id"), "G-TEST");
  assert.equal(url.searchParams.get("api_secret"), "test-secret");
  const payload = JSON.parse(options.body);
  const eventId = payload.client_id;
  assert.match(eventId, /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/);
  assert.deepEqual(payload, {
    client_id: eventId,
    events: [{ name: "uncaught_error", params: {
      error_name: "TypeError", error_code: "unknown", error_source: "server",
      error_source_type: "server", error_event_id: eventId, engagement_time_msec: 1,
    } }],
  });
  assert.equal(options.signal instanceof AbortSignal, true);
  assert.deepEqual(logs.mock.calls[0].arguments, ["Server error", { eventId, error, errorInfo }]);

  await logError(error, errorInfo);
  assert.notEqual(JSON.parse(requests[1][1].body).client_id, eventId,
    "Repeated private content must not produce a persistent ID or fingerprint");
});

test("server diagnostics work without optional GA configuration", async (t) => {
  const logs = configure(t);
  delete process.env.GA_API_SECRET;
  t.mock.method(globalThis, "fetch", () => assert.fail("Unconfigured GA sent a request"));
  await logError(new Error("Local diagnostic"));
  assert.equal(logs.mock.callCount(), 1);
});

test("server navigation control-flow errors produce no logs or GA requests", async (t) => {
  const logs = configure(t);
  t.mock.method(globalThis, "fetch", () => assert.fail("Control-flow error reached GA"));
  await logError(new Error("NEXT_REDIRECT"));
  await logError({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  assert.equal(logs.mock.callCount(), 0);
});

test("server analytics delivery failures never expose secret-bearing request errors", async (t) => {
  const logs = configure(t);
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Request failed: https://example.com/?api_secret=test-secret");
  });
  await assert.doesNotReject(logError(new Error("Original failure")));
  assert.deepEqual(logs.mock.calls.at(-1).arguments, ["Server analytics request failed or timed out."]);
  assert.equal(JSON.stringify(logs.mock.calls).includes("test-secret"), false);
});

test("server analytics non-success responses are reported without response content", async (t) => {
  const logs = configure(t);
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 503 }));
  await logError(new Error("Original failure"));
  assert.deepEqual(logs.mock.calls.at(-1).arguments, ["Server analytics request failed with status", 503]);
});

test("server analytics aborts delivery at the configured three-second timeout", async (t) => {
  const logs = configure(t);
  t.mock.method(AbortSignal, "timeout", (milliseconds) => {
    assert.equal(milliseconds, 3000);
    const controller = new AbortController();
    queueMicrotask(() => controller.abort());
    return controller.signal;
  });
  t.mock.method(globalThis, "fetch", (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  }));
  await assert.doesNotReject(logError(new Error("Original failure")));
  assert.deepEqual(logs.mock.calls.at(-1).arguments, ["Server analytics request failed or timed out."]);
});
