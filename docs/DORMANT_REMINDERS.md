# Dormant conversation reminders

An authenticated administrator triggers `POST /api/dormantConversation` through
the browser worker. User reminders become due after 14 days and administrator
reminders after 28 days, measured from the later of the latest message and the
last successful reminder of that type. Deleted conversations are excluded.

The endpoint returns `successEmails`, `failedEmails`, and `skippedEmails`.
Any failure returns HTTP 500, including a concurrent send that is still in
progress. A completed batch, including one with no reminders due, returns 200.
Only a completed batch sets the browser's 28-day success cooldown. Failed batches
retain the existing one-hour attempt cooldown. Successful reminders in a mixed
batch still contribute category-only analytics events.

## Delivery coordination

`dormantReminderDeliveries` is an Admin SDK journal. Its document key is the
SHA-256 hash of the conversation ID plus the reminder type (`user` or `admin`).
Each claim transaction rechecks the conversation's current eligibility before
recording `sending`. SMTP runs outside the transaction so Firestore transaction
retries cannot resend the message.

| State | Meaning | Automatic retry |
| --- | --- | --- |
| `sending` | A process claimed delivery; completion has not been recorded | No |
| `retryable` | SMTP explicitly rejected delivery or failed before sending | Yes, only recipients without recorded acceptance |
| `uncertain` | SMTP may have accepted delivery but acknowledgment is incomplete | No |
| `sent` | All intended recipients were accepted by SMTP | After the normal reminder interval |

The journal stores accepted recipient hashes, timestamps, and coordination
metadata; it does not store email bodies or raw recipient addresses. Successful
completion updates both the journal and the conversation's `*_reminded_at` in
one transaction. A partially rejected email can retry its remaining recipients
without resending to those already accepted, for the same latest message.

SMTP acceptance does not guarantee inbox delivery. There is also no atomic
transaction spanning SMTP and Firestore: if a process stops after SMTP accepts
an email, the journal can remain `sending`. Claims therefore never expire
automatically. This favors preventing duplicate reminders over silently retrying
an ambiguous delivery.

## Reconciling an uncertain delivery

An operator must check `sending` or `uncertain` entries against the SMTP
provider's delivery logs. First ensure the original request/process has stopped.
Use the conversation ID, reminder type, and attempt time to identify the send.

- If all recipients were accepted, atomically mark the journal `sent` and set
  the corresponding conversation reminder timestamp to the confirmed send time.
- If delivery was definitely rejected, set the journal to `retryable`. Preserve
  any confirmed `acceptedRecipients` hashes so the next run skips those people.
  Hash addresses using SHA-256 after trimming, lowercasing, and converting Unicode
  domains to ASCII, matching the helper.
- If acceptance cannot be established, leave the entry blocked for investigation.

Use a transaction that checks the current `claimId` before reconciling it. Do not
blindly delete a claim or retry a timed-out SMTP request; either can duplicate a
message already accepted by the provider.

## Access and validation

Client access to `dormantReminderDeliveries` must be denied in the deployed
Firestore rules. Admin SDK operations use server credentials and bypass those
rules. The checked-in `firestore.rules` is empty, so this repository alone cannot
verify the deployed policy. Existing broad collection wildcards must also be
checked; an additional denying match does not override another allowing match.

Run `npm run test:media` to execute the production worker, result handler,
delivery helper, API route, storage wrapper, and analytics tests. This command
includes both `.test.js` and `.test.mjs` files and is used by the Node 22 CI job.
Tests replace external boundaries with controlled fakes; they send no real
emails or analytics events. Delivery tests cover concurrent claims, transaction
retries, partial recipient acceptance, and failure after SMTP acceptance.

See [analytics documentation](../app/README.MD#logerrorerror-errorinfo)
for the GA event schema and optional server analytics environment variables.
