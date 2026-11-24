import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const workerCode = readFileSync(
  new URL("../public/workers/dormantConversationWorker.js", import.meta.url),
  "utf8"
);

function createWorker(fetch) {
  const messages = [];
  const self = {
    postMessage: (message) => messages.push(structuredClone(message)),
  };
  runInNewContext(workerCode, { self, fetch }, {
    filename: "dormantConversationWorker.js",
  });
  return { self, messages };
}

test("worker posts the API response after sending an authenticated request", async () => {
  const requests = [];
  const data = {
    message: "DormantConversation Request Success!",
    successEmails: [
      { success: true, reason: "user" },
      { success: true, reason: "admin" },
    ],
    failedEmails: [],
    conversationes: [{ id: "conv1", members: ["user1", "user2"] }],
  };
  const worker = createWorker(async (url, options) => {
    requests.push({ url, options: structuredClone(options) });
    return { ok: true, json: async () => data };
  });

  await worker.self.onmessage({ data: { idToken: "test-token" } });

  assert.deepEqual(requests, [{
    url: "/api/dormantConversation",
    options: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
    },
  }]);
  assert.deepEqual(worker.messages, [{ success: true, data }]);
});

test("worker preserves successful and failed emails in a partial success response", async () => {
  const data = {
    message: "DormantConversation Request Success!",
    successEmails: [{ success: true, reason: "user", reminderUserUids: ["user1"] }],
    failedEmails: [{ message: "Failed to send email.", error: "Mail service unavailable" }],
    conversationes: [{ id: "conv1" }, { id: "conv2" }],
  };
  const worker = createWorker(async () => ({ ok: true, json: async () => data }));

  await worker.self.onmessage({ data: { idToken: "test-token" } });

  assert.deepEqual(worker.messages, [{ success: true, data }]);
});

test("worker rejects a missing token without making a request", async () => {
  let fetchCalls = 0;
  const worker = createWorker(async () => { fetchCalls += 1; });

  await worker.self.onmessage({ data: {} });

  assert.equal(fetchCalls, 0);
  assert.deepEqual(worker.messages, [{ success: false, error: "No auth token" }]);
});

test("worker reports HTTP errors", async () => {
  const worker = createWorker(async () => ({
    ok: false,
    status: 401,
    statusText: "Unauthorized",
  }));

  await worker.self.onmessage({ data: { idToken: "invalid-token" } });

  assert.equal(worker.messages.length, 1);
  assert.equal(worker.messages[0].success, false);
  assert.equal(worker.messages[0].error, "API error: 401 Unauthorized");
  assert.equal(worker.messages[0].errorName, "Error");
  assert.equal(worker.messages[0].stage, "sendDormantConversation/parse");
  assert.match(worker.messages[0].errorStack, /API error: 401 Unauthorized/);
});

test("worker reports network and response parsing errors", async () => {
  for (const [fetch, message] of [
    [async () => { throw new Error("Network request failed"); }, "Network request failed"],
    [async () => ({
      ok: true,
      json: async () => { throw new SyntaxError("Invalid JSON"); },
    }), "Invalid JSON"],
  ]) {
    const worker = createWorker(fetch);
    await worker.self.onmessage({ data: { idToken: "test-token" } });

    assert.equal(worker.messages.length, 1);
    assert.equal(worker.messages[0].success, false);
    assert.equal(worker.messages[0].error, message);
    assert.equal(worker.messages[0].errorName, message === "Invalid JSON" ? "SyntaxError" : "Error");
    assert.equal(worker.messages[0].stage, "sendDormantConversation/parse");
    assert.match(worker.messages[0].errorStack, new RegExp(message));
  }
});
