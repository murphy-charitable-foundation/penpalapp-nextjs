import { createHash, randomUUID } from "node:crypto";
import { domainToASCII } from "node:url";
import { db } from "../firebaseAdmin";
import { sendEmailMessage } from "./email";
import { isReminderDue, timestampMillis } from "./dormantConversationPolicy.js";
import generateDormantConversationEmailTemplate from "../api/dormantConversation/emailTemplate";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const SEND_LEASE_MS = 5 * 60 * 1000;
const UNCERTAIN_RETRY_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 2;

function address(value) {
  const normalized = String(value?.address ?? value ?? "").trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 0) return normalized;
  const domain = normalized.slice(at + 1);
  // Nodemailer uses ASCII domains in SMTP acknowledgments. Normalize the
  // recipient and its journal key the same way, without repairing malformed
  // addresses or letting URL delimiters silently truncate a domain.
  if (!/[^\u0020-\u007e]/u.test(domain) || /[\s/\\#?%@:[\]]/u.test(domain)) return normalized;
  const asciiDomain = domainToASCII(domain);
  return asciiDomain ? `${normalized.slice(0, at)}@${asciiDomain}` : normalized;
}
const recipientKey = (value) => digest(address(value));
const formatList = (values) => values.length < 2 ? values.join("") :
  `${values.slice(0, -1).join(", ")} and ${values.at(-1)}`;

function failure(conversationId, reason, code) {
  return { success: false, conversationId, reason, code, error: "Reminder delivery did not complete." };
}

function definitelyNotDelivered(error) {
  return (error?.responseCode >= 400 && error.responseCode < 600) ||
    ["EMAIL_CONFIG", "EAUTH", "EENVELOPE", "EMESSAGE", "EDNS"].includes(error?.code) ||
    (error?.command === "CONN" && ["ESOCKET", "ECONNECTION", "ETIMEDOUT"].includes(error?.code));
}

async function sendAttempt(mail, pending, conversationId, reason) {
  try {
    const result = await sendEmailMessage(mail);
    const confirmed = new Set((result?.accepted || []).map(address));
    const rejected = new Set((result?.rejected || []).map(address));
    return {
      accepted: pending.filter((recipient) => confirmed.has(recipient)),
      rejected: pending.filter((recipient) => !confirmed.has(recipient) && rejected.has(recipient)),
      uncertain: pending.filter((recipient) => !confirmed.has(recipient) && !rejected.has(recipient)),
    };
  } catch (error) {
    report(error, conversationId, reason);
    return definitelyNotDelivered(error)
      ? { accepted: [], rejected: pending, uncertain: [], errorCode: "email-rejected" }
      : { accepted: [], rejected: [], uncertain: pending };
  }
}

// Older uncertain journals have one deadline and no per-recipient breakdown.
function activeHolds(previous, pending, now) {
  const holds = {};
  const completed = timestampMillis(previous?.completedAt ?? previous?.startedAt);
  const legacyDeadline = Number.isFinite(completed)
    ? completed + UNCERTAIN_RETRY_MS : timestampMillis(previous?.nextAttemptAt);
  for (const recipient of pending) {
    const key = recipientKey(recipient);
    const deadline = previous?.holdUntil?.[key] ??
      (previous?.state === "uncertain" && !previous.holdUntil ? legacyDeadline : 0);
    if (deadline > now) holds[key] = deadline;
  }
  return holds;
}

function deliveryState(remaining, holds) {
  if (!remaining.length) return "sent";
  return remaining.some((recipient) => !holds[recipientKey(recipient)]) ? "retryable" : "uncertain";
}

function report(error, conversationId, reason) {
  console.error("Dormant reminder delivery failed", { error, conversationId, reason });
}

function makeMessage(conversationId, members, toEmails, reason, recipients) {
  const names = members.map(({ firstName = "", lastName = "" }) =>
    [firstName, lastName].filter(Boolean).join(" "));
  const message = reason === "admin"
    ? `Conversation ${conversationId}, involving ${formatList(names)} (${formatList(toEmails)}), has been inactive. Please consider contacting them.`
    : "You have unread messages from two weeks ago. Please check them at your earliest convenience.";
  return {
    ...(reason === "admin" ? { to: recipients } : { bcc: recipients }),
    from: process.env.PENPAL_EMAIL,
    subject: "Conversation reminder",
    text: message,
    html: generateDormantConversationEmailTemplate({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      recipientName: reason === "admin" ? "Richard" : formatList(names),
      message,
      conversationId,
    }),
  };
}

export async function sendEmail(conversationId, members, toEmails, reason) {
  if (!db || !["user", "admin"].includes(reason)) {
    return failure(conversationId, reason, "reminder-unavailable");
  }
  const recipients = [...new Set((reason === "admin" ? [process.env.PENPAL_EMAIL] : toEmails)
    .map(address).filter(Boolean))];
  if (!recipients.length) return failure(conversationId, reason, "missing-recipient");

  const conversationRef = db.collection("conversations").doc(conversationId);
  // This journal is server-owned. It contains recipient hashes, never email bodies.
  const deliveryRef = db.collection("dormantReminderDeliveries").doc(`${digest(conversationId)}-${reason}`);
  const claimId = randomUUID();
  let claim;
  let messageAt;
  try {
    claim = await db.runTransaction(async (transaction) => {
      const conversation = await transaction.get(conversationRef);
      if (!conversation.exists) return { skipped: true };
      const data = conversation.data();
      // Legacy conversations may not yet have denormalized message metadata.
      if (data.latest_message_created_at == null) {
        const latest = await transaction.get(conversationRef.collection("messages")
          .orderBy("created_at", "desc").limit(1));
        data.latest_message_created_at = latest.docs[0]?.data().created_at;
      }
      if (!isReminderDue(data, reason)) return { skipped: true };
      const previous = (await transaction.get(deliveryRef)).data();
      messageAt = timestampMillis(data.latest_message_created_at);
      const sameMessage = previous?.messageAt === messageAt;
      const accepted = ["retryable", "uncertain", "sending"].includes(previous?.state) && sameMessage
        ? previous.acceptedRecipients || [] : [];
      const pending = recipients.filter((recipient) => !accepted.includes(recipientKey(recipient)));
      const now = Date.now();

      const holds = activeHolds(sameMessage ? previous : null, pending, now);
      let targets = pending.filter((recipient) => !holds[recipientKey(recipient)]);
      let attempt = 1;
      let recovering = false;
      if (previous?.state === "sending") {
        const startedAt = timestampMillis(previous.startedAt);
        if (Number.isFinite(startedAt) && now - startedAt < SEND_LEASE_MS) return { busy: true };

        if (sameMessage) {
          // Only the recipients on the interrupted SMTP envelope are ambiguous.
          const interrupted = targets.filter((recipient) =>
            !previous.inFlightRecipients || previous.inFlightRecipients.includes(recipientKey(recipient)));
          const attempts = previous.attemptCount || 1;
          if (attempts >= MAX_ATTEMPTS) {
            for (const recipient of interrupted) holds[recipientKey(recipient)] = now + UNCERTAIN_RETRY_MS;
            targets = targets.filter((recipient) => !holds[recipientKey(recipient)]);
            if (interrupted.length && !targets.length) {
              transaction.set(deliveryRef, {
                conversationId, reason, claimId, state: "uncertain", messageAt,
                startedAt: previous.startedAt, attemptCount: attempts,
                acceptedRecipients: accepted, holdUntil: holds, completedAt: new Date(now),
              });
              return { uncertainFailure: true };
            }
          } else if (interrupted.length) {
            targets = interrupted;
            attempt = attempts + 1;
            recovering = true;
          }
        }
      }
      if (!targets.length && pending.length) return { skipped: true };

      const startedAt = new Date(now);
      transaction.set(deliveryRef, {
        conversationId, reason, claimId, state: "sending", messageAt, startedAt,
        attemptCount: attempt, acceptedRecipients: accepted, holdUntil: holds,
        inFlightRecipients: targets.map(recipientKey),
      });
      return { accepted, attempt, startedAt, targets, holds, recovering };
    });
  } catch (error) {
    report(error, conversationId, reason);
    return failure(conversationId, reason, "claim-failed");
  }
  if (claim.skipped) return { skipped: true, conversationId, reason };
  if (claim.busy) return failure(conversationId, reason, "reminder-in-progress");
  if (claim.uncertainFailure) return failure(conversationId, reason, "delivery-uncertain");

  const accepted = new Set(claim.accepted);
  const pending = claim.targets;
  const uncertain = new Set(claim.recovering ? pending : []);
  let attempt = claim.attempt;
  let attemptStartedAt = claim.startedAt;
  let errorCode = null;
  const holds = claim.holds;
  if (pending.length) {
    const firstResult = await sendAttempt(
      makeMessage(conversationId, members, toEmails, reason, pending),
      pending,
      conversationId,
      reason,
    );
    for (const recipient of firstResult.accepted) accepted.add(recipientKey(recipient));
    for (const recipient of firstResult.uncertain) uncertain.add(recipient);

    if (firstResult.uncertain.length && attempt < MAX_ATTEMPTS) {
      try {
        attemptStartedAt = new Date();
        await db.runTransaction(async (transaction) => {
          const current = await transaction.get(deliveryRef);
          if (current.data()?.claimId !== claimId) throw new Error("Reminder claim ownership changed");
          transaction.update(deliveryRef, {
            attemptCount: attempt + 1,
            startedAt: attemptStartedAt,
            acceptedRecipients: [...accepted],
            inFlightRecipients: firstResult.uncertain.map(recipientKey),
          });
        });
        attempt++;
      } catch (error) {
        report(error, conversationId, reason);
        return failure(conversationId, reason, "delivery-record-failed");
      }

      const retry = firstResult.uncertain;
      const secondResult = await sendAttempt(
        makeMessage(conversationId, members, toEmails, reason, retry),
        retry,
        conversationId,
        reason,
      );
      for (const recipient of secondResult.accepted) accepted.add(recipientKey(recipient));
      for (const recipient of secondResult.uncertain) uncertain.add(recipient);
    }

    errorCode = firstResult.errorCode;
  }

  const remaining = recipients.filter((recipient) => !accepted.has(recipientKey(recipient)));
  const completedAt = new Date();
  for (const recipient of remaining) {
    if (uncertain.has(recipient)) holds[recipientKey(recipient)] = completedAt.getTime() + UNCERTAIN_RETRY_MS;
  }
  const state = deliveryState(remaining, holds);
  if (state !== "sent") {
    errorCode = state === "uncertain" ? "delivery-uncertain" : errorCode || "recipient-rejected";
    report(new Error(errorCode), conversationId, reason);
  }

  try {
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(deliveryRef);
      const conversation = await transaction.get(conversationRef);
      if (current.data()?.claimId !== claimId) throw new Error("Reminder claim ownership changed");
      transaction.set(deliveryRef, {
        conversationId, reason, claimId, state, messageAt,
        startedAt: attemptStartedAt, attemptCount: attempt,
        acceptedRecipients: [...accepted], completedAt,
        holdUntil: holds,
      });
      if (state === "sent" && conversation.exists) {
        transaction.update(conversationRef, { [`${reason}_reminded_at`]: completedAt });
      }
    });
  } catch (error) {
    // Keep the existing sending claim: retrying SMTP here could duplicate a send.
    report(error, conversationId, reason);
    return failure(conversationId, reason, "delivery-record-failed");
  }
  return state === "sent"
    ? { success: true, conversationId, reason }
    : failure(conversationId, reason, errorCode);
}
