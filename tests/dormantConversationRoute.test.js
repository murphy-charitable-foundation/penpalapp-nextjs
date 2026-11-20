import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const fixtures = new Map();
globalThis[Symbol.for("dormantRoute.test.fixtures")] = fixtures;
let nextFixture = 0;
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const old = (days) => new Date(Date.now() - days * 86400000);
const conversation = (id, data = {}) => ({
  id, members: [{ id: "member" }], latest_message_created_at: old(15), ...data,
});

async function harness(t, options = {}) {
  const sent = [];
  const errors = [];
  const reads = [];
  const documents = (options.conversations || []).map(({ id, ...data }) => ({
    id, data: () => ({ ...data }),
    ref: { collection: () => ({ orderBy: () => ({ limit: () => ({ get: async () => {
      reads.push(id);
      return { docs: options.legacyMessage ? [{ data: () => ({ created_at: options.legacyMessage }) }] : [] };
    } }) }) }) },
  }));
  const db = { collection: (name) => name === "conversations" ? {
    get: async () => ({ docs: documents }),
  } : { doc: (id) => ({ get: async () => ({
    id, exists: true,
    data: () => id === "administrator"
      ? { user_type: options.role || "admin" }
      : { first_name: "Private", last_name: "Person" },
  }) }) } };
  const fixture = {
    db: options.noDatabase ? null : db,
    auth: {
      verifyIdToken: async (token) => {
        assert.equal(token, "test-token");
        if (options.invalidToken) throw new Error("Private auth details");
        return { uid: "administrator" };
      },
      getUser: async (uid) => {
        if (options.accountLookupFails) throw new Error("Private account email");
        if (options.deletedAccount === uid) {
          throw Object.assign(new Error("Private deleted account details"), { code: "auth/user-not-found" });
        }
        return { email: options.missingEmail ? undefined : "private@example.com" };
      },
    },
    sendEmail: async (...args) => {
      sent.push(args);
      return options.send ? options.send(...args) : { success: true, conversationId: args[0], reason: args[3] };
    },
    logError: async (error) => { errors.push(error); },
  };
  const id = nextFixture++;
  fixtures.set(id, fixture);
  t.after(() => fixtures.delete(id));
  const prelude = `const f = globalThis[Symbol.for("dormantRoute.test.fixtures")].get(${id});`;
  const dependencies = {
    "next/server": dataModule("export const NextResponse = Response;"),
    "../../firebaseAdmin": dataModule(`${prelude} export const db=f.db, auth=f.auth;`),
    "../../utils/dormantConversationHelpers": dataModule(`${prelude} export const sendEmail=f.sendEmail;`),
    "../../utils/serverAnalytics.mjs": dataModule(`${prelude} export const logError=f.logError;`),
    "../../utils/dormantConversationPolicy.js": new URL("../app/utils/dormantConversationPolicy.js", import.meta.url).href,
  };
  let source = await readFile(new URL("../app/api/dormantConversation/route.js", import.meta.url), "utf8");
  for (const [specifier, replacement] of Object.entries(dependencies)) {
    const target = `from ${JSON.stringify(specifier)}`;
    assert.ok(source.includes(target));
    source = source.replace(target, `from ${JSON.stringify(replacement)}`);
  }
  const { POST } = await import(dataModule(source));
  return { sent, errors, reads, request: async (authorization = "Bearer test-token") => {
    const headers = authorization ? { authorization } : {};
    const response = await POST(new Request("http://localhost/api/dormantConversation", { method: "POST", headers }));
    return { status: response.status, body: await response.json() };
  } };
}

test("reminder API rejects unauthenticated and non-admin requests before sending", async (t) => {
  for (const [options, header, status] of [
    [{}, null, 401], [{ invalidToken: true }, "Bearer test-token", 401],
    [{ role: "parent" }, "Bearer test-token", 403], [{ noDatabase: true }, "Bearer test-token", 500],
  ]) {
    const api = await harness(t, { ...options, conversations: [conversation("one")] });
    assert.equal((await api.request(header)).status, status);
    assert.deepEqual(api.sent, []);
  }
});

test("mixed reminder results return HTTP 500 while preserving successful results", async (t) => {
  const api = await harness(t, {
    conversations: [conversation("success"), conversation("failure")],
    send: async (id, _members, _emails, reason) => id === "success"
      ? { success: true, conversationId: id, reason }
      : { success: false, conversationId: id, reason, error: "SMTP rejection" },
  });
  const { status, body } = await api.request();
  assert.equal(status, 500);
  assert.equal(body.successEmails.length, 1);
  assert.equal(body.failedEmails.length, 1);
  assert.equal(body.successEmails[0].conversationId, "success");
  assert.equal(body.failedEmails[0].conversationId, "failure");
});

test("rejected sends and invalid delivery results cannot disappear from failedEmails", async (t) => {
  for (const send of [
    async () => { throw new Error("SMTP secret details"); },
    async () => new Error("An Error mistakenly fulfilled"),
    async () => undefined,
  ]) {
    const api = await harness(t, { conversations: [conversation("one")], send });
    const result = await api.request();
    assert.equal(result.status, 500);
    assert.equal(result.body.failedEmails.length, 1);
    assert.deepEqual(result.body.successEmails, []);
    assert.equal(api.errors.length, 1);
    assert.doesNotMatch(JSON.stringify(result.body), /secret|mistakenly/);
  }
});

test("complete user/admin batches return HTTP 200 without recipient data", async (t) => {
  const api = await harness(t, { conversations: [conversation("one", { latest_message_created_at: old(29) })] });
  const { status, body } = await api.request();
  assert.equal(status, 200);
  assert.deepEqual(body.successEmails.map(({ reason }) => reason), ["user", "admin"]);
  assert.deepEqual(body.failedEmails, []);
  assert.doesNotMatch(JSON.stringify(body), /private@example|Private|Person/);
});

test("no-work batches include empty results and never send", async (t) => {
  const api = await harness(t, { conversations: [
    conversation("recent", { latest_message_created_at: old(1) }),
    conversation("deleted", { deleted_at: new Date() }),
    conversation("already-sent", { user_reminded_at: old(1) }),
    conversation("empty", { latest_message_created_at: null }),
  ] });
  const { status, body } = await api.request();
  assert.equal(status, 200);
  assert.deepEqual(body.successEmails, []);
  assert.deepEqual(body.failedEmails, []);
  assert.deepEqual(api.sent, []);
  assert.deepEqual(api.reads, ["empty"]);
});

test("legacy message dates participate in eligibility without stale metadata backfills", async (t) => {
  const api = await harness(t, {
    conversations: [conversation("legacy", { latest_message_created_at: null })], legacyMessage: old(15),
  });
  assert.equal((await api.request()).status, 200);
  assert.equal(api.sent.length, 1);
  assert.deepEqual(api.reads, ["legacy"]);
});

test("missing recipients and account lookup failures keep the batch retryable", async (t) => {
  for (const options of [{ missingEmail: true }, { accountLookupFails: true }]) {
    const api = await harness(t, { ...options, conversations: [conversation("one")] });
    const { status, body } = await api.request();
    assert.equal(status, 500);
    assert.equal(body.failedEmails.length, 1);
    assert.deepEqual(api.sent, []);
  }
});

test("a deleted member does not prevent the independent administrator reminder", async (t) => {
  const api = await harness(t, {
    deletedAccount: "deleted-member",
    conversations: [conversation("one", {
      latest_message_created_at: old(29),
      members: [{ id: "member" }, { id: "deleted-member" }],
    })],
  });
  const { status, body } = await api.request();
  assert.equal(status, 500, "The missing user recipient must remain retryable");
  assert.deepEqual(body.successEmails, [{ success: true, conversationId: "one", reason: "admin" }]);
  assert.equal(body.failedEmails.length, 1);
  assert.equal(body.failedEmails[0].reason, "user");
  assert.equal(api.sent.length, 1);
  assert.equal(api.sent[0][3], "admin");
  assert.deepEqual(api.sent[0][2], ["private@example.com"]);
  assert.equal(api.errors.length, 1);
  assert.doesNotMatch(JSON.stringify(body), /Private|private@example|deleted-member/);
});

test("already completed claims skip cleanly but in-progress claims do not start a long cooldown", async (t) => {
  for (const [delivery, status] of [
    [{ skipped: true }, 200],
    [{ success: false, code: "reminder-in-progress", error: "Reminder delivery did not complete." }, 500],
  ]) {
    const api = await harness(t, { conversations: [conversation("one")], send: async () => delivery });
    const result = await api.request();
    assert.equal(result.status, status);
    assert.equal(result.body.failedEmails.length, status === 500 ? 1 : 0);
    assert.deepEqual(result.body.successEmails, []);
  }
});
