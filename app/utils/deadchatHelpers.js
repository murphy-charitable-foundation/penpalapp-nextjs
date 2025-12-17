import sendgrid from "@sendgrid/mail";
import { db } from "../firebaseAdmin";

import { logError } from "./analytics";
import generateDeadletterEmailTemplate from "../api/deadchat/emailTemplate";

const SENDER_EMAIL = "penpal@murphycharity.org";

const formatListWithAnd = (arr) => {
  if (!arr || arr.length === 0) return "[]";
  if (arr.length === 1) return `[${arr[0]}]`;
  if (arr.length === 2) return `[${arr[0]} and ${arr[1]}]`;
  const allButLast = arr.slice(0, -1).join(", ");
  const last = arr[arr.length - 1];
  return `[${allButLast}, & ${last}]`;
};

export const sendEmail = async (letterBoxId, members, toEmails, reason) => {
  let message;
  const membersNames = members.map(({ firstName = "", lastName = "" }) =>
    [firstName, lastName].filter((s) => s !== "").join(" ")
  );
  if (reason == "admin") {
    message = `Hello Richard, it seems that a chat in a letterbox with the id: ${letterBoxId}, involving the user/s: ${formatListWithAnd(
      membersNames
    )} has stalled because the user/s with the email/s: ${formatListWithAnd(
      toEmails
    )} has stopped responding. Consider contacting them to see if the chat can be reignited.`;
  } else {
    message = `Hello, it seems that your chat in a letterbox with the id: ${letterBoxId}, involving the user/s: ${formatListWithAnd(
      membersNames
    )} has stalled. Consider contacting them to see if the chat can be reignited.`;
  }

  let msg;
  if (reason == "admin") {
    msg = {
      to: "penpal@murphycharity.org",
      from: SENDER_EMAIL, // Your verified sender email
      subject: "Message Reported",
      text: message || "No message provided.",
      html: generateDeadletterEmailTemplate(message),
    };
  } else {
    msg = {
      to: toEmails,
      from: SENDER_EMAIL, // Your verified sender email
      subject: "Message Reported",
      text: message || "No message provided.",
      html: generateDeadletterEmailTemplate(message),
    };
  }
  try {
    sendgrid.setApiKey(process.env.SENDGRID_KEY);
    // Send the email
    await sendgrid.send(msg);

    if (db) {
      const fieldToUpdate =
        reason === "admin" ? "admin_reminded_at" : "user_reminded_at";
      await db
        .collection("letterbox")
        .doc(letterBoxId)
        .set(
          {
            [fieldToUpdate]: new Date(),
          },
          { merge: true }
        );
    }

    return {
      success: true,
      msg: { to: msg.to, from: msg.from, subject: msg.subject, text: msg.text },
    };
  } catch (error) {
    logError(error, {
      description: "Failed to send email.",
    });
    throw {
      message: "Failed to send email.",
      error: error.message,
      details: error.response?.body?.errors?.map((error) => error.message),
      msg: { to: msg.to, from: msg.from, subject: msg.subject, text: msg.text },
    };
  }
};
