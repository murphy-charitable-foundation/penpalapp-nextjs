import { createHash, randomUUID } from "node:crypto";
import { domainToASCII } from "node:url";
import { db } from "../firebaseAdmin";
import { sendEmailMessage } from "./email";
import { isReminderDue, timestampMillis } from "./dormantConversationPolicy.js";
import generateDormantConversationEmailTemplate from "../api/dormantConversation/emailTemplate";

const digest = (value) => createHash("sha256").update(value).digest("hex");
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

// A connection loss after DATA may mean SMTP accepted the email. Do not blindly
// retry an ambiguous send. Explicit rejections and pre-send failures are safe.
function definitelyNotDelivered(error) {
  return (error?.responseCode >= 400 && error.responseCode < 600) ||
    ["EMAIL_CONFIG", "EAUTH", "EENVELOPE", "EMESSAGE", "EDNS"].includes(error?.code) ||
    (error?.command === "CONN" && ["ESOCKET", "ECONNECTION", "ETIMEDOUT"].includes(error?.code));
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
      // Never expire a send automatically: the original SMTP request could have
      // succeeded even if its process died before recording the acknowledgment.
      if (["sending", "uncertain"].includes(previous?.state)) return { busy: true };
      const messageAt = timestampMillis(data.latest_message_created_at);
      const accepted = previous?.state === "retryable" && previous.messageAt === messageAt
        ? previous.acceptedRecipients || [] : [];
      transaction.set(deliveryRef, {
        conversationId, reason, claimId, state: "sending", messageAt,
        startedAt: new Date(), acceptedRecipients: accepted,
      });
      return { accepted };
    });
  } catch (error) {
    report(error, conversationId, reason);
    return failure(conversationId, reason, "claim-failed");
  }
  if (claim.skipped) return { skipped: true, conversationId, reason };
  if (claim.busy) return failure(conversationId, reason, "reminder-in-progress");

  const accepted = new Set(claim.accepted);
  const pending = recipients.filter((recipient) => !accepted.has(recipientKey(recipient)));
  let state = "sent";
  let errorCode = null;
  if (pending.length) {
    try {
      const result = await sendEmailMessage(makeMessage(conversationId, members, toEmails, reason, pending));
      const confirmed = new Set((result?.accepted || []).map(address));
      const rejected = new Set((result?.rejected || []).map(address));
      for (const recipient of pending) {
        if (confirmed.has(recipient)) accepted.add(recipientKey(recipient));
      }
      const remaining = pending.filter((recipient) => !confirmed.has(recipient));
      if (remaining.length) {
        state = remaining.every((recipient) => rejected.has(recipient)) ? "retryable" : "uncertain";
        errorCode = state === "retryable" ? "recipient-rejected" : "delivery-uncertain";
        report(new Error(errorCode), conversationId, reason);
      }
    } catch (error) {
      state = definitelyNotDelivered(error) ? "retryable" : "uncertain";
      errorCode = state === "retryable" ? "email-rejected" : "delivery-uncertain";
      report(error, conversationId, reason);
    }
  }

  try {
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(deliveryRef);
      const conversation = await transaction.get(conversationRef);
      if (current.data()?.claimId !== claimId) throw new Error("Reminder claim ownership changed");
      const completedAt = new Date();
      transaction.update(deliveryRef, { state, acceptedRecipients: [...accepted], completedAt });
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
