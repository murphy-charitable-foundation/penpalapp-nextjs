import test from "node:test";
import assert from "node:assert/strict";
import { logError } from "../app/utils/serverAnalytics.mjs";
import { buildErrorEvent } from "../app/utils/errorEvent.mjs";

test("server error reporting", async (t) => {
  const original = {
    fetch: globalThis.fetch,
    error: console.error,
    warn: console.warn,
    measurementId: process.env.GA_MEASUREMENT_ID,
    apiSecret: process.env.GA_API_SECRET,
  };
  const errors = [];
  const warnings = [];
  let requests = [];
  console.error = (...args) => errors.push(args);
  console.warn = (...args) => warnings.push(args);
  globalThis.fetch = async (...args) => {
    requests.push(args);
    return { ok: true };
  };
  process.env.GA_MEASUREMENT_ID = "G-TEST";
  process.env.GA_API_SECRET = "test-secret";
  t.after(() => {
    globalThis.fetch = original.fetch;
    console.error = original.error;
    console.warn = original.warn;
    if (original.measurementId === undefined) delete process.env.GA_MEASUREMENT_ID;
    else process.env.GA_MEASUREMENT_ID = original.measurementId;
    if (original.apiSecret === undefined) delete process.env.GA_API_SECRET;
    else process.env.GA_API_SECRET = original.apiSecret;
  });

  const error = new Error("Private message from someone@example.com");
  error.stack = "Error: Private message\n    at send (/srv/api.js:12:34)";
  error.code = "private-code";
  await logError(error, { userId: "verified-uid", description: "Private details", privateField: "secret" });
  assert.equal(requests.length, 1);
  const [url, options] = requests[0];
  assert.equal(url.origin + url.pathname, "https://www.google-analytics.com/mp/collect");
  assert.equal(url.searchParams.get("measurement_id"), "G-TEST");
  assert.equal(url.searchParams.get("api_secret"), "test-secret");
  const payload = JSON.parse(options.body);
  assert.equal(payload.user_id, "verified-uid");
  assert.equal(payload.events[0].name, "uncaught_error");
  assert.equal(payload.client_id, payload.events[0].params.error_event_id);
  assert.equal(payload.events[0].params.error_line, 12);
  assert.equal(payload.events[0].params.error_column, 34);
  assert.ok(Object.keys(payload.events[0].params).length <= 25);
  for (const [key, value] of Object.entries(payload.events[0].params)) {
    assert.ok(key.length <= 40);
    assert.ok(typeof value === "number" || (typeof value === "string" && value.length <= 100));
  }
  assert.ok(!options.body.includes("Private"));
  assert.ok(!options.body.includes("someone@example.com"));
  assert.ok(!options.body.includes("private-code"));
  assert.ok(!options.body.includes("secret"));
  assert.equal(errors[0][1].error, error);
  assert.equal(errors[0][1].eventId, payload.client_id);
  assert.equal(errors[0][1].userId, "verified-uid");

  requests = [];
  await logError(new Error("Anonymous error"));
  assert.equal("user_id" in JSON.parse(requests[0][1].body), false);

  let resolveFetch;
  globalThis.fetch = () => new Promise((resolve) => { resolveFetch = resolve; });
  let completed = false;
  const pending = logError(new Error("Awaited error")).then(() => { completed = true; });
  await Promise.resolve();
  assert.equal(completed, false);
  resolveFetch({ ok: true });
  await pending;
  globalThis.fetch = async (...args) => {
    requests.push(args);
    return { ok: true };
  };

  requests = [];
  const redirect = new Error("NEXT_REDIRECT");
  await logError(redirect);
  assert.equal(requests.length, 0);

  delete process.env.GA_API_SECRET;
  await logError(new Error("No configuration"));
  assert.equal(requests.length, 0);
  assert.match(warnings.at(-1)[0], /missing/);

  process.env.GA_API_SECRET = "test-secret";
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  await logError(new Error("HTTP failure"));
  assert.deepEqual(errors.at(-1), ["Server analytics request failed with status", 503]);

  globalThis.fetch = async () => { throw new Error("secret-bearing URL"); };
  await logError(new Error("Network failure"));
  assert.deepEqual(errors.at(-1), ["Server analytics request failed or timed out."]);
});

test("shared event formatter preserves client error schema", () => {
  const error = new Error("Firebase error (auth/user-not-found)");
  error.stack = "Error: failure\n    at load (https://example.com/app.js:10:20)";
  const event = buildErrorEvent(error, { description: "loading", extra: "value" }, "/inbox");
  assert.equal(event.error_message, error.message);
  assert.equal(event.error_code, "auth/user-not-found");
  assert.equal(event.error_file, "app.js");
  assert.equal(event.error_line, 10);
  assert.equal(event.error_column, 20);
  assert.equal(event.error_function, "load");
  assert.equal(event.error_page_path, "/inbox");
  assert.equal(event.extra, "value");
  const notFound = new Error("not found");
  notFound.digest = "NEXT_NOT_FOUND";
  assert.equal(buildErrorEvent(notFound), null);
});
