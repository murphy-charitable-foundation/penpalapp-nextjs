# Dormant conversation reminders

An authenticated administrator triggers `POST /api/dormantConversation` through
the browser worker. User reminders become due after 14 days and administrator
reminders after 28 days, measured from the later of the latest message and the
last successful reminder of that type. Deleted conversations are excluded.

The endpoint returns `successEmails`, `failedEmails`, and `skippedEmails`.
Any failure returns HTTP 500, including a concurrent send that is still in
progress. A completed batch, including one with no reminders due, returns 200.
The browser stores its last completed live batch under `dormantConversationLiveSuccess.v1`
and waits 28 days before another scan. Browsers that previously ran the mock worker
can make their first live scan after the existing one-hour attempt cooldown. A failed
batch also uses the one-hour cooldown. Successful reminders in a mixed batch still
contribute category-only analytics events.

## Delivery coordination

`dormantReminderDeliveries` is an Admin SDK journal. Its document key is the
SHA-256 hash of the conversation ID plus the reminder type (`user` or `admin`).
Each claim transaction rechecks the conversation's current eligibility before
recording `sending`. SMTP runs outside the transaction so Firestore transaction
retries cannot resend the message. Member reminders use BCC to hide participants'
email addresses from each other. The administrator receives a separate, direct email.

| State | Meaning | Automatic retry |
| --- | --- | --- |
| `sending` | A process claimed delivery; completion has not been recorded | After the 5-minute lease, the next run uses the remaining attempt |
| `retryable` | SMTP explicitly rejected delivery or failed before sending | On the next run, only recipients without recorded acceptance |
| `uncertain` | SMTP may have accepted delivery but acknowledgment is incomplete | After 14 days, on the next run |
| `sent` | All intended recipients were accepted by SMTP | After the normal reminder interval |

The journal stores accepted recipient hashes, timestamps, and coordination
metadata; it does not store email bodies or raw recipient addresses. Successful
completion updates both the journal and the conversation's `*_reminded_at` in
one transaction. A partially rejected email can retry its remaining recipients
without resending to those already accepted, for the same latest message.

SMTP acceptance does not guarantee inbox delivery. There is also no atomic
transaction spanning SMTP and Firestore, so an ambiguous send can be duplicated.
The helper retries an ambiguous result once immediately, and checkpoints accepted
recipients before that retry. If the second attempt is still ambiguous, it records
`uncertain` and schedules another cycle 14 days later. Confirmed accepted recipients
are skipped in later cycles. The journal tracks each uncertain recipient’s
deadline by address hash. When a batch contains both a definite rejection and
an uncertain outcome, it stays `retryable` for the rejected recipient. Retrying
that recipient preserves the other recipient’s original deadline. The 14-day
hold makes a recipient eligible on the next scan at or after that deadline.

A `sending` claim has a 5-minute lease. The next endpoint run after the lease
continues with the remaining attempt; if the second attempt was already started
when the process stopped, the claim becomes `uncertain` and receives the 14-day
retry delay. This is recovered on the next endpoint run, not by a background timer.
The SMTP transport timeouts are 30 seconds. Explicitly known pre-send failures and
SMTP rejections remain `retryable` on the next run.

## Access and validation

The [Firestore rules](../firestore.rules) deny client reads and writes to every
`dormantReminderDeliveries/{deliveryId}` document, including requests from
signed-in app admins. The reminder API uses the Admin SDK with server IAM
permissions. Journal entries are top-level documents. The recursive rules for
the admin inbox match documents in collections named `messages` and do not
grant access to journal entries.

The default Firestore databases in dev and production use the same rules file.
Deploy future rules changes to dev first, then production.

```sh
firebase deploy --only firestore:rules --project penpalmagicapp-dev
firebase deploy --only firestore:rules --project penpalmagicapp
```

When changing wildcard rules, test `get`, `list`, `create`, `update`, and
`delete` on a journal entry as a guest, a member, and an app admin. All 15
cases should be denied. Also verify that an app admin can still list messages
for moderation. Firestore grants access if any matching rule allows it.

Run `npm run test:media` to execute the production worker, result handler,
delivery helper, API route, storage wrapper, and content-report tests. This command
includes both `.test.js` and `.test.mjs` files and is used by the Node 22 CI job.
Tests replace external boundaries with controlled fakes; they send no real
emails or analytics events. Delivery tests cover concurrent claims, transaction
retries, partial recipient acceptance, and failure after SMTP acceptance.

Reminder delivery errors are recorded in server logs. The reminder API does not
depend on server-side GA delivery.
