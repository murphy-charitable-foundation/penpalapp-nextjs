import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { readFile } from "node:fs/promises";
import nodemailer from "nodemailer";
import { isReminderDue, timestampMillis } from "../app/utils/dormantConversationPolicy.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const conversationId = "private-conversation";
const conversationPath = `conversations/${conversationId}`;
const deliveryPath = `dormantReminderDeliveries/${createHash("sha256").update(conversationId).digest("hex")}-user`;
const recipients = ["first@example.test", "second@example.test"];
const acceptAll = (mail) => ({ accepted: [...(mail.to || []), ...(mail.bcc || [])], rejected: [] });
const members = [{ firstName: "Private", lastName: "Person" }];
const dormant = () => ({ latest_message_created_at: new Date(Date.now() - 35 * DAY_MS) });
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
let nextSetup = 0;
const configuredTests = new WeakSet();

// A transactional store, not a copy of the delivery algorithm: callbacks read
// consistent snapshots, commits are atomic, and a retry discards staged writes.
function firestore(initial, { retryTransactions = [], failTransactions = [] } = {}) {
  const documents = new Map(Object.entries(initial));
  const reads = [];
  let transactionCount = 0;
  let callbackCount = 0;
  let previous = Promise.resolve();

  const snapshot = (path) => ({
    exists: documents.has(path),
    data: () => structuredClone(documents.get(path)),
  });
  const collection = (path) => ({
    doc: (id) => ({ path: `${path}/${id}`, collection: (name) => collection(`${path}/${id}/${name}`) }),
    orderBy: (field, direction) => ({
      limit: (limit) => ({ kind: "query", path, field, direction, limit }),
    }),
  });

  return {
    documents,
    reads,
    get callbackCount() { return callbackCount; },
    collection,
    runTransaction(callback) {
      const number = ++transactionCount;
      const run = previous.then(async () => {
        const attempts = retryTransactions.includes(number) ? 2 : 1;
        for (let attempt = 0; attempt < attempts; attempt++) {
          const writes = [];
          callbackCount++;
          const result = await callback({
            async get(reference) {
              assert.equal(writes.length, 0, "Firestore requires reads before writes");
              reads.push(reference);
              if (reference.kind === "query") {
                assert.equal(reference.field, "created_at");
                assert.equal(reference.direction, "desc");
                const docs = [...documents.entries()]
                  .filter(([path]) => path.startsWith(`${reference.path}/`))
                  .sort(([, a], [, b]) => timestampMillis(b.created_at) - timestampMillis(a.created_at))
                  .slice(0, reference.limit)
                  .map(([path]) => snapshot(path));
                return { docs };
              }
              return snapshot(reference.path);
            },
            set: (reference, value) => writes.push({ path: reference.path, value, replace: true }),
            update: (reference, value) => {
              assert.equal(documents.has(reference.path), true, "Cannot update a missing document");
              writes.push({ path: reference.path, value, replace: false });
            },
          });
          if (attempt < attempts - 1) continue;
          if (failTransactions.includes(number)) throw new Error("Injected transaction failure");
          for (const { path, value, replace } of writes) {
            documents.set(path, structuredClone(replace ? value : { ...documents.get(path), ...value }));
          }
          return result;
        }
      });
      previous = run.catch(() => {});
      return run;
    },
  };
}

async function setup(t, options = {}) {
  const db = options.db === null ? null : firestore({
    [conversationPath]: dormant(),
    ...options.documents,
  }, options.transactions);
  const emails = [];
  const errors = [];
  t.mock.method(console, "error", (...args) => errors.push(args));
  const key = `dormant.delivery.test.${nextSetup++}`;
  globalThis[Symbol.for(key)] = {
    db,
    sendEmailMessage: async (mail) => {
      emails.push(mail);
      return options.send ? options.send(mail, emails.length) : acceptAll(mail);
    },
  };
  t.after(() => delete globalThis[Symbol.for(key)]);
  if (!configuredTests.has(t)) {
    configuredTests.add(t);
    const originalSender = process.env.PENPAL_EMAIL;
    process.env.PENPAL_EMAIL = "administrator@example.test";
    t.after(() => {
      if (originalSender === undefined) delete process.env.PENPAL_EMAIL;
      else process.env.PENPAL_EMAIL = originalSender;
    });
  }
  const dependencies = dataModule(`
    export const { db, sendEmailMessage } = globalThis[Symbol.for(${JSON.stringify(key)})];
    export default function emailTemplate({ message }) { return '<p>' + message + '</p>'; }
  `);
  const source = (await readFile(new URL("../app/utils/dormantConversationHelpers.js", import.meta.url), "utf8"))
    .replace('from "../firebaseAdmin"', `from ${JSON.stringify(dependencies)}`)
    .replace('from "./email"', `from ${JSON.stringify(dependencies)}`)
    .replace('from "../api/dormantConversation/emailTemplate"', `from ${JSON.stringify(dependencies)}`)
    .replace('from "./dormantConversationPolicy.js"',
      `from ${JSON.stringify(new URL("../app/utils/dormantConversationPolicy.js", import.meta.url).href)}`);
  const { sendEmail } = await import(dataModule(source));
  return {
    db, emails, errors,
    send: (reason = "user", to = recipients) => sendEmail(conversationId, members, to, reason),
    journals: () => [...db.documents.entries()]
      .filter(([path]) => path.startsWith("dormantReminderDeliveries/"))
      .map(([, value]) => value),
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test("concurrent reminders claim one SMTP send, even when Firestore retries callbacks", async (t) => {
  const started = deferred();
  const complete = deferred();
  const fixture = await setup(t, {
    transactions: { retryTransactions: [1] },
    send: async (mail) => {
      started.resolve();
      await complete.promise;
      return acceptAll(mail);
    },
  });
  const first = fixture.send();
  await started.promise;
  const second = await fixture.send();
  assert.equal(second.code, "reminder-in-progress");
  assert.equal(fixture.emails.length, 1);
  complete.resolve();
  assert.equal((await first).success, true);
  assert.equal(fixture.db.callbackCount, 4, "The initial claim callback must have been replayed");
  assert.equal(fixture.journals()[0].state, "sent");
});

test("successful reminders update their cooldown and subsequent requests skip SMTP", async (t) => {
  const fixture = await setup(t, { transactions: { retryTransactions: [2] } });
  assert.deepEqual(await fixture.send(), { success: true, conversationId, reason: "user" });
  assert.deepEqual(await fixture.send(), { skipped: true, conversationId, reason: "user" });
  assert.equal(fixture.emails.length, 1);
  assert.equal(fixture.db.documents.get(conversationPath).user_reminded_at instanceof Date, true);
  assert.equal(fixture.db.documents.get(conversationPath).admin_reminded_at, undefined);
  assert.doesNotMatch(JSON.stringify(fixture.journals()), /@|Private Person|<p>/);
  assert.equal(fixture.journals()[0].acceptedRecipients.length, 2);
});

test("the next due reminder cycle sends all recipients again with a fresh claim", async (t) => {
  const fixture = await setup(t);
  assert.equal((await fixture.send()).success, true);
  const firstClaim = fixture.journals()[0].claimId;
  const conversation = fixture.db.documents.get(conversationPath);
  // Advance eligibility without changing the latest message: a completed
  // cycle's accepted recipients must not suppress a later scheduled reminder.
  conversation.user_reminded_at = new Date(Date.now() - 15 * DAY_MS);
  assert.equal((await fixture.send()).success, true);
  assert.equal(fixture.emails.length, 2);
  assert.deepEqual(fixture.emails.map(({ bcc }) => bcc), [recipients, recipients]);
  assert.notEqual(fixture.journals()[0].claimId, firstClaim);
  assert.equal(fixture.journals()[0].state, "sent");
  assert.equal(fixture.journals()[0].acceptedRecipients.length, 2);
  assert.equal((await fixture.send()).skipped, true);
  assert.equal(fixture.emails.length, 2);
});

test("explicit SMTP 550 rejection releases the claim for a safe retry", async (t) => {
  const fixture = await setup(t, {
    send: async (mail, attempt) => {
      if (attempt === 1) throw Object.assign(new Error("private SMTP response"), { responseCode: 550 });
      return acceptAll(mail);
    },
  });
  const failed = await fixture.send();
  assert.equal(failed.code, "email-rejected");
  assert.equal(fixture.journals()[0].state, "retryable");
  assert.equal(fixture.db.documents.get(conversationPath).user_reminded_at, undefined);
  assert.equal((await fixture.send()).success, true);
  assert.equal(fixture.emails.length, 2);
  assert.doesNotMatch(JSON.stringify(failed), /private SMTP response|@|<p>/);
});

for (const failure of [
  { label: "missing email configuration", code: "EMAIL_CONFIG" },
  { label: "connection timeout before SMTP", code: "ETIMEDOUT", command: "CONN" },
]) {
  test(`${failure.label} leaves delivery retryable`, async (t) => {
    const fixture = await setup(t, {
      send: async (mail, attempt) => {
        if (attempt === 1) throw Object.assign(new Error("Pre-send failure"), failure);
        return acceptAll(mail);
      },
    });
    assert.equal((await fixture.send()).code, "email-rejected");
    assert.equal(fixture.journals()[0].state, "retryable");
    assert.deepEqual(fixture.journals()[0].acceptedRecipients, []);
    assert.equal(fixture.db.documents.get(conversationPath).user_reminded_at, undefined);
    assert.equal((await fixture.send()).success, true);
    assert.deepEqual(fixture.emails.map(({ bcc }) => bcc), [recipients, recipients]);
  });
}

test("member addresses are SMTP envelope recipients and absent from delivered headers", async (t) => {
  let envelope;
  let headers;
  const transport = nodemailer.createTransport({
    send(mail, done) {
      envelope = mail.message.getEnvelope();
      mail.message.build((error, bytes) => {
        if (error) return done(error);
        headers = bytes.toString().split("\r\n\r\n")[0];
        done(null, { accepted: envelope.to, rejected: [] });
      });
    },
  });
  const fixture = await setup(t, { send: (mail) => transport.sendMail(mail) });
  assert.equal((await fixture.send()).success, true);
  assert.deepEqual(envelope.to, recipients);
  for (const recipient of recipients) assert.ok(!headers.includes(recipient));
  assert.doesNotMatch(headers, /^Bcc:/im);
});

test("a partial SMTP success retries only recipients that were rejected", async (t) => {
  const fixture = await setup(t, {
    send: async (mail, attempt) => attempt === 1
      ? { accepted: [recipients[0].toUpperCase()], rejected: [recipients[1]] }
      : acceptAll(mail),
  });
  assert.equal((await fixture.send()).code, "recipient-rejected");
  assert.equal(fixture.journals()[0].acceptedRecipients.length, 1);
  assert.equal(fixture.db.documents.get(conversationPath).user_reminded_at, undefined);
  assert.equal((await fixture.send()).success, true);
  assert.deepEqual(fixture.emails.map(({ bcc }) => bcc), [recipients, [recipients[1]]]);
  assert.equal(fixture.journals()[0].acceptedRecipients.length, 2);
});

test("Unicode and ASCII domain forms share recipient acknowledgments and retry history", async (t) => {
  const unicodeRecipients = [" FIRST@BÜCHER.example ", "first@xn--bcher-kva.example", recipients[1]];
  const asciiAddress = "first@xn--bcher-kva.example";
  const fixture = await setup(t, {
    send: async (mail, attempt) => attempt === 1
      ? { accepted: [{ address: asciiAddress.toUpperCase() }], rejected: [recipients[1]] }
      : acceptAll(mail),
  });
  assert.equal((await fixture.send("user", unicodeRecipients)).code, "recipient-rejected");
  assert.equal(fixture.journals()[0].state, "retryable");
  assert.equal(fixture.journals()[0].acceptedRecipients.length, 1);
  assert.equal((await fixture.send("user", unicodeRecipients)).success, true);
  assert.deepEqual(fixture.emails.map(({ bcc }) => bcc), [
    [asciiAddress, recipients[1]], [recipients[1]],
  ]);
  assert.equal(fixture.journals()[0].acceptedRecipients.length, 2);
  assert.equal(fixture.journals()[0].state, "sent");
});

test("invalid domains remain visible to SMTP rejection instead of being dropped or repaired", async (t) => {
  for (const invalidAddress of ["first@bad domain.example", "first@bücher.example/invalid", "first@\uFFFD.example"]) {
    const fixture = await setup(t, {
      send: async (mail) => {
        assert.deepEqual(mail.bcc, [invalidAddress]);
        throw Object.assign(new Error("Invalid SMTP recipient"), { code: "EENVELOPE", responseCode: 550 });
      },
    });
    assert.equal((await fixture.send("user", [invalidAddress])).code, "email-rejected");
    assert.equal(fixture.journals()[0].state, "retryable");
    assert.equal(fixture.db.documents.get(conversationPath).user_reminded_at, undefined);
    assert.equal(fixture.emails.length, 1);
  }
});

test("a post-SMTP database failure retains the claim and prevents a duplicate send", async (t) => {
  const fixture = await setup(t, { transactions: { failTransactions: [2] } });
  assert.equal((await fixture.send()).code, "delivery-record-failed");
  assert.equal(fixture.journals()[0].state, "sending");
  assert.equal(fixture.db.documents.get(conversationPath).user_reminded_at, undefined);
  assert.equal((await fixture.send()).code, "reminder-in-progress");
  assert.equal(fixture.emails.length, 1);
});

test("an ambiguous DATA timeout retries once, then defers another retry for 14 days", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const fixture = await setup(t, {
    send: async () => {
      throw Object.assign(new Error("Lost acknowledgment after DATA"), {
        code: "ETIMEDOUT", command: "DATA",
      });
    },
  });
  assert.equal((await fixture.send()).code, "delivery-uncertain");
  assert.equal(fixture.journals()[0].state, "uncertain");
  assert.equal(fixture.emails.length, 2);
  const deadline = Date.now() + 14 * DAY_MS;
  assert.deepEqual(Object.values(fixture.journals()[0].holdUntil), [deadline, deadline]);
  assert.equal((await fixture.send()).skipped, true);
  assert.equal(fixture.emails.length, 2);

  t.mock.timers.setTime(deadline - 1);
  assert.equal((await fixture.send()).skipped, true);
  t.mock.timers.setTime(deadline);
  assert.equal((await fixture.send()).code, "delivery-uncertain");
  assert.equal(fixture.emails.length, 4);
});

test("definite rejections retry on the next run while ambiguous recipients keep their own deadline", async (t) => {
  const now = Date.now();
  t.mock.timers.enable({ apis: ["Date"], now });
  const fixture = await setup(t, {
    send: async (mail, attempt) => {
      if (attempt === 1) return { rejected: [recipients[0]], accepted: [] };
      if (attempt === 2) return {};
      return acceptAll(mail);
    },
  });
  await fixture.send();
  assert.equal(fixture.journals()[0].state, "retryable");
  t.mock.timers.setTime(now + DAY_MS);
  await fixture.send();
  assert.equal(fixture.journals()[0].state, "uncertain");
  t.mock.timers.setTime(now + 14 * DAY_MS - 1);
  assert.equal((await fixture.send()).skipped, true);
  t.mock.timers.setTime(now + 14 * DAY_MS);
  assert.equal((await fixture.send()).success, true);
  assert.deepEqual(fixture.emails.map(({ bcc }) => bcc),
    [recipients, [recipients[1]], [recipients[0]], [recipients[1]]]);
});

test("an ambiguous first attempt retries only unconfirmed recipients immediately", async (t) => {
  const fixture = await setup(t, {
    send: async (mail, attempt) => attempt === 1
      ? { accepted: [recipients[0]], rejected: [] }
      : acceptAll(mail),
  });
  assert.equal((await fixture.send()).success, true);
  assert.deepEqual(fixture.emails.map(({ bcc }) => bcc), [recipients, [recipients[1]]]);
  assert.equal(fixture.journals()[0].state, "sent");
  assert.equal(fixture.journals()[0].acceptedRecipients.length, 2);
});

test("SMTP results without recipient acknowledgment are uncertain, not successful", async (t) => {
  const fixture = await setup(t, { send: async () => ({ accepted: [recipients[0]], rejected: [] }) });
  assert.equal((await fixture.send()).code, "delivery-uncertain");
  assert.equal(fixture.db.documents.get(conversationPath).user_reminded_at, undefined);
  assert.equal(fixture.journals()[0].state, "uncertain");
  assert.equal(fixture.journals()[0].acceptedRecipients.length, 1);
  assert.equal((await fixture.send()).skipped, true);
  assert.deepEqual(fixture.emails.map(({ bcc }) => bcc), [recipients, [recipients[1]]]);
});

test("an abandoned first attempt is retried after its five-minute lease", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const fixture = await setup(t, {
    documents: {
      [deliveryPath]: {
        conversationId,
        reason: "user",
        claimId: "abandoned-claim",
        state: "sending",
        messageAt: timestampMillis(dormant().latest_message_created_at),
        startedAt: new Date(Date.now() - 6 * 60 * 1000),
        attemptCount: 1,
        acceptedRecipients: [],
      },
    },
  });
  assert.equal((await fixture.send()).success, true);
  assert.equal(fixture.emails.length, 1);
  assert.equal(fixture.journals()[0].attemptCount, 2);
  assert.equal(fixture.journals()[0].state, "sent");
});

test("an abandoned second attempt becomes uncertain and waits 14 days", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const fixture = await setup(t, {
    documents: {
      [deliveryPath]: {
        conversationId,
        reason: "user",
        claimId: "abandoned-claim",
        state: "sending",
        messageAt: timestampMillis(dormant().latest_message_created_at),
        startedAt: new Date(Date.now() - 6 * 60 * 1000),
        attemptCount: 2,
        acceptedRecipients: [],
      },
    },
  });
  assert.equal((await fixture.send()).code, "delivery-uncertain");
  assert.equal(fixture.journals()[0].state, "uncertain");
  const deadline = Date.now() + 14 * DAY_MS;
  assert.deepEqual(Object.values(fixture.journals()[0].holdUntil), [deadline, deadline]);
  assert.equal((await fixture.send()).skipped, true);
  assert.equal(fixture.emails.length, 0);
});

test("recovering the second attempt only holds recipients on its SMTP envelope", async (t) => {
  const now = Date.now();
  t.mock.timers.enable({ apis: ["Date"], now });
  const interrupted = createHash("sha256").update(recipients[1]).digest("hex");
  const fixture = await setup(t, {
    documents: {
      [deliveryPath]: {
        state: "sending", messageAt: timestampMillis(dormant().latest_message_created_at),
        startedAt: new Date(now - 5 * 60 * 1000), attemptCount: 2,
        inFlightRecipients: [interrupted], acceptedRecipients: [],
      },
    },
  });
  await fixture.send();
  assert.deepEqual(fixture.emails.map(({ bcc }) => bcc), [[recipients[0]]]);
  assert.deepEqual(fixture.journals()[0].holdUntil, { [interrupted]: now + 14 * DAY_MS });
});

test("older uncertain journals use 14 days from completion", async (t) => {
  const now = Date.now();
  t.mock.timers.enable({ apis: ["Date"], now });
  const fixture = await setup(t, {
    documents: {
      [deliveryPath]: {
        state: "uncertain", messageAt: timestampMillis(dormant().latest_message_created_at),
        completedAt: new Date(now), nextAttemptAt: new Date(now + 30 * DAY_MS),
      },
    },
  });
  t.mock.timers.setTime(now + 14 * DAY_MS - 1);
  assert.equal((await fixture.send()).skipped, true);
  t.mock.timers.setTime(now + 14 * DAY_MS);
  assert.equal((await fixture.send()).success, true);
});

test("user and administrator reminders have independent claims and cooldowns", async (t) => {
  const fixture = await setup(t);
  const results = await Promise.all([fixture.send("user"), fixture.send("admin")]);
  assert.equal(results.every(({ success }) => success), true);
  assert.deepEqual(new Set(fixture.journals().map(({ reason }) => reason)), new Set(["user", "admin"]));
  assert.equal(fixture.emails.length, 2);
  assert.deepEqual(fixture.emails.find(({ text }) => text.startsWith("Conversation ")).to,
    ["administrator@example.test"]);
  assert.doesNotMatch(JSON.stringify(results), /@|Private Person|<p>|unread messages/);
  assert.equal(fixture.db.documents.get(conversationPath).admin_reminded_at instanceof Date, true);
});

test("the transaction rechecks recent activity, deleted conversations, and invalid dates", async (t) => {
  for (const conversation of [
    { latest_message_created_at: new Date() },
    { ...dormant(), deleted_at: new Date() },
    { latest_message_created_at: "invalid-date" },
    { ...dormant(), user_reminded_at: new Date() },
  ]) {
    const fixture = await setup(t, { documents: { [conversationPath]: conversation } });
    assert.equal((await fixture.send()).skipped, true);
    assert.equal(fixture.emails.length, 0);
    assert.equal(fixture.journals().length, 0);
  }
});

test("a missing conversation is skipped without sending or creating a claim", async (t) => {
  const fixture = await setup(t);
  fixture.db.documents.delete(conversationPath);
  assert.equal((await fixture.send()).skipped, true);
  assert.equal(fixture.emails.length, 0);
  assert.equal(fixture.journals().length, 0);
});

test("legacy message metadata is read inside the claim transaction", async (t) => {
  const fixture = await setup(t, { documents: {
    [conversationPath]: {},
    [`${conversationPath}/messages/older`]: { created_at: new Date(Date.now() - 50 * DAY_MS) },
    [`${conversationPath}/messages/latest`]: { created_at: new Date(Date.now() - 35 * DAY_MS) },
  } });
  assert.equal((await fixture.send()).success, true);
  assert.equal(fixture.db.reads.some(({ kind, path }) => kind === "query" && path.endsWith("/messages")), true);
  assert.equal(fixture.journals()[0].messageAt,
    fixture.db.documents.get(`${conversationPath}/messages/latest`).created_at.getTime());
});

test("legacy conversations with a recent latest message or no messages are skipped", async (t) => {
  for (const messages of [{}, {
    [`${conversationPath}/messages/older`]: { created_at: new Date(Date.now() - 50 * DAY_MS) },
    [`${conversationPath}/messages/latest`]: { created_at: new Date() },
  }]) {
    const fixture = await setup(t, { documents: { [conversationPath]: {}, ...messages } });
    assert.equal((await fixture.send()).skipped, true);
    assert.equal(fixture.emails.length, 0);
  }
});

test("unavailable database, missing recipients, and claim failures are explicit failures", async (t) => {
  const unavailable = await setup(t, { db: null });
  assert.equal((await unavailable.send()).code, "reminder-unavailable");
  assert.equal(unavailable.emails.length, 0);

  const empty = await setup(t);
  assert.equal((await empty.send("user", ["", " "])).code, "missing-recipient");
  assert.equal((await empty.send("unknown")).code, "reminder-unavailable");
  assert.equal(empty.emails.length, 0);
  assert.equal(empty.journals().length, 0);

  const failed = await setup(t, { transactions: { failTransactions: [1] } });
  assert.equal((await failed.send()).code, "claim-failed");
  assert.equal(failed.emails.length, 0);
  assert.equal(failed.journals().length, 0);
});

test("reminder policy uses exact inactivity thresholds and the latest successful reminder", () => {
  const now = new Date("2026-11-18T12:00:00.000Z");
  const ago = (days, offset = 0) => new Date(now.getTime() - days * DAY_MS + offset);
  assert.equal(isReminderDue({ latest_message_created_at: ago(14) }, "user", now), true);
  assert.equal(isReminderDue({ latest_message_created_at: ago(14, 1) }, "user", now), false);
  assert.equal(isReminderDue({ latest_message_created_at: ago(28) }, "admin", now), true);
  assert.equal(isReminderDue({ latest_message_created_at: ago(28, 1) }, "admin", now), false);
  assert.equal(isReminderDue({ latest_message_created_at: ago(60), user_reminded_at: ago(13) }, "user", now), false);
  assert.equal(isReminderDue({ latest_message_created_at: ago(13), user_reminded_at: ago(60) }, "user", now), false);
  assert.equal(isReminderDue({ latest_message_created_at: ago(-1) }, "user", now), false);
  assert.equal(isReminderDue({ latest_message_created_at: ago(60) }, "unknown", now), false);
  assert.equal(isReminderDue(null, "user", now), false);
});

test("timestamp policy accepts Firestore timestamps and rejects missing or invalid dates", () => {
  const milliseconds = new Date("2026-10-01T12:00:00.000Z").getTime();
  for (const value of [
    milliseconds,
    new Date(milliseconds),
    new Date(milliseconds).toISOString(),
    { toMillis: () => milliseconds },
    { toDate: () => new Date(milliseconds) },
  ]) assert.equal(timestampMillis(value), milliseconds);
  for (const value of [null, undefined, "invalid", new Date(NaN), {}]) {
    assert.equal(Number.isNaN(timestampMillis(value)), true);
  }
});
