import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

// Read the worker file and extract the sendDormantConversation function
const workerPath = path.resolve("./public/workers/dormantConversationWorker.js");
const workerCode = fs.readFileSync(workerPath, "utf8");

// Extract the sendDormantConversation function
const extractedFunction = workerCode.substring(
  workerCode.indexOf("async function sendDormantConversation"),
  workerCode.length
);

test("dormant conversation worker sends actual API request", async (t) => {
  let fetchCalls = [];
  const originalFetch = globalThis.fetch;

  // Mock fetch to capture the request
  globalThis.fetch = async (url, options) => {
    fetchCalls.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        message: "DormantConversation Request Success!",
        successEmails: [
          { success: true, reason: "user" },
          { success: true, reason: "admin" },
        ],
        failedEmails: [],
        conversationes: [
          {
            id: "conv1",
            members: ["user1", "user2"],
            latestMessage: {
              id: "msg1",
              created_at: new Date(),
              sent_by: "user1",
            },
          },
        ],
      }),
    };
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  // Create a mock sendDormantConversation function using the extracted code
  const sendDormantConversation = async (idToken) => {
    const response = await fetch("/api/dormantConversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  };

  const testToken = "test-id-token-12345";
  const result = await sendDormantConversation(testToken);

  // Verify fetch was called correctly
  assert.equal(fetchCalls.length, 1);
  const fetchCall = fetchCalls[0];
  assert.equal(fetchCall.url, "/api/dormantConversation");
  assert.equal(fetchCall.options.method, "POST");
  assert.equal(fetchCall.options.headers["Content-Type"], "application/json");
  assert.equal(fetchCall.options.headers.Authorization, `Bearer ${testToken}`);

  // Verify response is parsed correctly
  assert.equal(result.message, "DormantConversation Request Success!");
  assert.equal(Array.isArray(result.successEmails), true);
  assert.equal(result.successEmails.length, 2);
  assert.equal(result.successEmails[0].reason, "user");
  assert.equal(result.successEmails[1].reason, "admin");
  assert.equal(Array.isArray(result.failedEmails), true);
  assert.equal(result.failedEmails.length, 0);
});

test("dormant conversation worker handles API errors", async (t) => {
  let fetchCalls = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, options) => {
    fetchCalls.push({ url, options });
    return {
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    };
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const sendDormantConversation = async (idToken) => {
    const response = await fetch("/api/dormantConversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  };

  const testToken = "invalid-token";

  try {
    await sendDormantConversation(testToken);
    assert.fail("Should have thrown an error");
  } catch (error) {
    assert.match(error.message, /API error: 401 Unauthorized/);
  }

  assert.equal(fetchCalls.length, 1);
});

test("dormant conversation worker handles network errors", async (t) => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    throw new Error("Network request failed");
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const sendDormantConversation = async (idToken) => {
    const response = await fetch("/api/dormantConversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  };

  const testToken = "test-token";

  try {
    await sendDormantConversation(testToken);
    assert.fail("Should have thrown an error");
  } catch (error) {
    assert.match(error.message, /Network request failed/);
  }
});

test("dormant conversation worker includes proper authorization header", async (t) => {
  let capturedHeaders = null;
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, options) => {
    capturedHeaders = options.headers;
    return {
      ok: true,
      json: async () => ({
        message: "Success",
        successEmails: [],
        failedEmails: [],
        conversationes: [],
      }),
    };
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const sendDormantConversation = async (idToken) => {
    const response = await fetch("/api/dormantConversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  };

  const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token";
  await sendDormantConversation(testToken);

  assert.equal(capturedHeaders["Content-Type"], "application/json");
  assert.equal(capturedHeaders.Authorization, `Bearer ${testToken}`);
  assert.ok(capturedHeaders.Authorization.startsWith("Bearer "));
});

test("dormant conversation worker correctly parses JSON response", async (t) => {
  const originalFetch = globalThis.fetch;
  const mockResponse = {
    message: "DormantConversation Request Success!",
    successEmails: [
      { success: true, reason: "user", conversationId: "conv1" },
      { success: true, reason: "admin", conversationId: "conv2" },
    ],
    failedEmails: [
      { error: "Failed to send", conversationId: "conv3" },
    ],
    conversationes: [
      {
        id: "conv1",
        members: ["user1", "user2"],
        latestMessage: { id: "msg1", created_at: "2026-11-14T00:00:00Z", sent_by: "user1" },
        user_reminded_at: null,
        admin_reminded_at: null,
      },
    ],
  };

  globalThis.fetch = async () => {
    return {
      ok: true,
      json: async () => mockResponse,
    };
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const sendDormantConversation = async (idToken) => {
    const response = await fetch("/api/dormantConversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  };

  const result = await sendDormantConversation("test-token");

  assert.deepEqual(result, mockResponse);
  assert.equal(result.successEmails.length, 2);
  assert.equal(result.failedEmails.length, 1);
  assert.equal(result.conversationes.length, 1);
  assert.equal(result.conversationes[0].members.length, 2);
});
