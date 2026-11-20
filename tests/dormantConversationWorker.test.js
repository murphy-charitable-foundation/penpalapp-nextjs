import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { handleDormantConversationResult } from "../app/utils/dormantConversationResult.js";

const workerSource = readFileSync(
  new URL("../public/workers/dormantConversationWorker.js", import.meta.url),
  "utf8"
);

function createWorker(fetch) {
  const messages = [];
  const self = { postMessage: (message) => messages.push(structuredClone(message)) };
  const unexpectedLog = () => assert.fail("Worker logged request/response details");
  // Execute the shipped worker, including its actual onmessage entry point.
  runInNewContext(workerSource, {
    self,
    fetch,
    console: { log: unexpectedLog, info: unexpectedLog, warn: unexpectedLog, error: unexpectedLog },
  }, { filename: "dormantConversationWorker.js" });
  return {
    async send(data = { idToken: "test-token" }) {
      await self.onmessage({ data });
      assert.equal(messages.length, 1, "Each request must produce one result");
      return messages[0];
    },
  };
}

function apiResponse(data, status = 200) {
  let reads = 0;
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      assert.equal(++reads, 1, "Response must be parsed exactly once");
      return data;
    },
    get reads() { return reads; },
  };
}

const completeBatch = {
  successEmails: [
    { success: true, reason: "user" },
    { success: true, reason: "admin" },
  ],
  failedEmails: [],
};

const partialBatch = {
  successEmails: [{ success: true, reason: "user", email: "private@example.com" }],
  failedEmails: [{ error: "private message", conversationId: "private-conversation" }],
};

function applyResult(result, initialTimestamp) {
  const storage = new Map();
  if (initialTimestamp) storage.set("dormantConversationTimestamp", initialTimestamp);
  const events = [];
  const errors = [];
  const complete = handleDormantConversationResult(result, {
    storage: { setItem: (key, value) => storage.set(key, value) },
    logDormantMessageSent: (...args) => events.push(args),
    logError: (...args) => errors.push(args),
    now: () => new Date("2026-11-18T12:00:00.000Z"),
  });
  return { complete, storage, events, errors };
}

test("production worker rejects missing tokens without making requests", async () => {
  for (const idToken of [undefined, null, "", "   ", 42]) {
    const worker = createWorker(() => assert.fail("Missing token reached API"));
    const result = await worker.send({ idToken });
    assert.equal(result.success, false);
    assert.equal(result.errorCode, "no-auth-token");
    assert.equal(result.stage, "auth");
  }
});

test("production worker POSTs its bearer token and parses the result once", async () => {
  let calls = 0;
  const response = apiResponse(completeBatch);
  const worker = createWorker(async (url, options) => {
    calls++;
    assert.equal(url, "/api/dormantConversation");
    assert.equal(options.method, "POST");
    assert.deepEqual({ ...options.headers }, {
      "Content-Type": "application/json",
      Authorization: "Bearer test-token",
    });
    return response;
  });
  const result = await worker.send();
  assert.equal(calls, 1);
  assert.equal(response.reads, 1);
  assert.deepEqual(result, { success: true, data: completeBatch });

  const applied = applyResult(result);
  assert.equal(applied.complete, true);
  assert.equal(applied.storage.get("dormantConversationTimestamp"), "2026-11-18T12:00:00.000Z");
  assert.deepEqual(applied.events, [["user"], ["admin"]]);
  assert.deepEqual(applied.errors, []);
});

test("no reminders needed is a successful completed batch", async () => {
  const worker = createWorker(async () => apiResponse({ successEmails: [], failedEmails: [] }));
  const applied = applyResult(await worker.send());
  assert.equal(applied.complete, true);
  assert.equal(applied.storage.size, 1);
  assert.deepEqual(applied.events, []);
  assert.deepEqual(applied.errors, []);
});

for (const status of [401, 403, 500]) {
  test(`HTTP ${status} never completes the batch or logs response contents`, async () => {
    const response = apiResponse({ error: "private@example.com", message: "private message" }, status);
    const worker = createWorker(async () => response);
    const result = await worker.send();
    assert.equal(response.reads, 1);
    assert.equal(result.success, false);
    assert.equal(result.errorCode, "http-error");
    assert.equal(result.httpStatus, status);
    assert.match(result.error, new RegExp(`HTTP ${status}`));
    const applied = applyResult(result);
    assert.equal(applied.complete, false);
    assert.equal(applied.storage.size, 0);
    assert.equal(applied.errors.length, 1);
    const [error, context] = applied.errors[0];
    assert.equal(error.name, result.errorName);
    assert.equal(error.code, result.errorCode);
    assert.equal(error.stack, result.errorStack);
    assert.doesNotMatch(`${error.message} ${error.stack} ${JSON.stringify(context)}`, /private/);
  });
}

for (const status of [200, 500]) {
  test(`partial HTTP ${status} batches preserve successful-send analytics and allow retry`, async () => {
    const response = apiResponse(partialBatch, status);
    const worker = createWorker(async () => response);
    const result = await worker.send();
    assert.equal(response.reads, 1);
    assert.equal(result.success, false);
    assert.equal(result.errorCode, status === 200 ? "partial-failure" : "http-error");
    assert.deepEqual(result.data, partialBatch);

    const priorTimestamp = "2026-10-01T12:00:00.000Z";
    const applied = applyResult(result, priorTimestamp);
    assert.equal(applied.complete, false);
    assert.equal(applied.storage.get("dormantConversationTimestamp"), priorTimestamp);
    assert.deepEqual(applied.events, [["user"]]);
    const [error, context] = applied.errors[0];
    assert.doesNotMatch(`${error.message} ${error.stack} ${JSON.stringify(context)}`, /private/);
  });
}

test("client also refuses a mixed batch marked successful by an older worker", () => {
  const applied = applyResult({ success: true, data: partialBatch });
  assert.equal(applied.complete, false);
  assert.equal(applied.storage.size, 0);
  assert.deepEqual(applied.events, [["user"]]);
  assert.equal(applied.errors[0][0].code, "partial-failure");
});

test("network failures expose a stable code without forwarding exception contents", async () => {
  const worker = createWorker(async () => {
    throw new TypeError("private@example.com network details");
  });
  const result = await worker.send();
  assert.equal(result.success, false);
  assert.equal(result.errorCode, "network-error");
  assert.equal(result.stage, "request");
  assert.doesNotMatch(result.errorStack, /private/);
  assert.equal(applyResult(result).storage.size, 0);
});

for (const status of [200, 502]) {
  test(`malformed HTTP ${status} JSON does not expose parser contents`, async () => {
    let reads = 0;
    const worker = createWorker(async () => ({
      ok: status === 200,
      status,
      async json() {
        reads++;
        throw new SyntaxError('Unexpected token in "private message from private@example.com"');
      },
    }));
    const result = await worker.send();
    assert.equal(reads, 1);
    assert.equal(result.success, false);
    assert.equal(result.errorCode, status === 200 ? "invalid-response" : "http-error");
    assert.doesNotMatch(result.errorStack, /private/);
    assert.equal(applyResult(result).storage.size, 0);
  });
}

test("invalid success response schemas do not start the success cooldown", async () => {
  for (const data of [null, "ok", {}, { successEmails: [], failedEmails: null }]) {
    const worker = createWorker(async () => apiResponse(data));
    const result = await worker.send();
    assert.equal(result.success, false);
    assert.equal(result.errorCode, "invalid-response");
    assert.equal(applyResult(result).storage.size, 0);
  }
});

test("explicit API failure cannot be mistaken for an empty successful batch", async () => {
  const worker = createWorker(async () => apiResponse({ success: false, successEmails: [], failedEmails: [] }));
  const result = await worker.send();
  assert.equal(result.success, false);
  assert.equal(result.errorCode, "partial-failure");
  assert.equal(applyResult(result).storage.size, 0);
});
