import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
let nextSetup = 0;

async function reportRoute(t, { sendEmailMessage, verifyIdToken = async () => ({ uid: "reporter-uid" }) }) {
  const key = `report.route.test.${nextSetup++}`;
  globalThis[Symbol.for(key)] = {
    sendEmailMessage,
    auth: { verifyIdToken },
    db: { collection: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => ({ first_name: "Test", last_name: "Reporter" }) }) }) }) },
  };
  t.after(() => delete globalThis[Symbol.for(key)]);
  const dependencies = dataModule(`
    export const { sendEmailMessage, auth, db } = globalThis[Symbol.for(${JSON.stringify(key)})];
    export const NextResponse = { json: (body, options) => Response.json(body, options) };
  `);
  const source = (await readFile(new URL("../app/api/report/route.js", import.meta.url), "utf8"))
    .replace('from "next/server"', `from ${JSON.stringify(dependencies)}`)
    .replace('from "../../utils/email"', `from ${JSON.stringify(dependencies)}`)
    .replace('from "../../firebaseAdmin"', `from ${JSON.stringify(dependencies)}`);
  return import(dataModule(source));
}

function request() {
  return new Request("https://example.test/api/report", {
    method: "POST",
    headers: { authorization: "Bearer test-token", "content-type": "application/json" },
    body: JSON.stringify({
      receiver_email: "receiver@example.test",
      currentUrl: "https://example.test/conversation/private-id",
      messageSummary: "Private <message>",
    }),
  });
}

test("successful content reports send email and record a server audit, not an error event", async (t) => {
  const emails = [];
  const { POST } = await reportRoute(t, { sendEmailMessage: async (mail) => emails.push(mail) });
  const audit = t.mock.method(console, "info", () => {});
  const errors = t.mock.method(console, "error", () => {});
  const network = t.mock.method(globalThis, "fetch", () => assert.fail("Successful reports must not send analytics"));
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { message: "Message reported successfully!" });
  assert.equal(emails.length, 1);
  assert.match(emails[0].html, /Private &lt;message&gt;/);
  assert.deepEqual(audit.mock.calls.map((call) => call.arguments), [
    ["content_report_submitted", { reporterUid: "reporter-uid" }],
  ]);
  assert.equal(errors.mock.callCount(), 0);
  assert.equal(network.mock.callCount(), 0);
});

test("failed report emails remain errors and produce no success audit", async (t) => {
  const failure = new Error("SMTP rejected the message");
  const { POST } = await reportRoute(t, { sendEmailMessage: async () => { throw failure; } });
  const audit = t.mock.method(console, "info", () => {});
  const errors = t.mock.method(console, "error", () => {});
  const response = await POST(request());
  assert.equal(response.status, 500);
  assert.equal((await response.json()).message, "Failed to send report email.");
  assert.equal(audit.mock.callCount(), 0);
  assert.deepEqual(errors.mock.calls[0].arguments, ["Failed to send report email.", failure]);
});

test("unauthenticated reports never send email or record successful submission", async (t) => {
  const { POST } = await reportRoute(t, {
    sendEmailMessage: () => assert.fail("Unauthorized email submission"),
    verifyIdToken: async () => { throw new Error("Expired token"); },
  });
  const audit = t.mock.method(console, "info", () => {});
  t.mock.method(console, "error", () => {});
  assert.equal((await POST(request())).status, 401);
  assert.equal(audit.mock.callCount(), 0);
});
