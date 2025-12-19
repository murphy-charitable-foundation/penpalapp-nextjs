import { db } from "../firebaseAdmin";
import nodemailer from "nodemailer";
import { logError } from "./analytics";
import generateDeadletterEmailTemplate from "../api/deadchat/emailTemplate";

const SENDER_EMAIL = "penpal@murphycharity.org";

const transporter = nodemailer.createTransport({
    host: process.env.CPANEL_SMTP_HOST,
    port: parseInt(process.env.CPANEL_SMTP_PORT),
    secure: process.env.CPANEL_SMTP_PORT == 465, // SSL for 465
    auth: {
        user: SENDER_EMAIL, //sender email
        pass: process.env.PENPAL_EMAIL_PASSWORD, //sender password (cPanel email password)
    },
});


const formatListWithAnd = (arr) => {
  if (!arr || arr.length === 0) return "";
  if (arr.length === 1) return `${arr[0]}`;
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  const allButLast = arr.slice(0, -1).join(", ");
  const last = arr[arr.length - 1];
  return `${allButLast}, & ${last}`;
};

export const sendEmail = async (letterboxId, members, toEmails, reason) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  let message;
  const membersNames = members.map(({ firstName = "", lastName = "" }) =>
    [firstName, lastName].filter((s) => s !== "").join(" ")
  );
  if (reason == "admin") {
    message = `It seems that a chat in a letterbox with the id: ${letterboxId}, involving the user/s: [${formatListWithAnd(
      membersNames
    )}] has stalled because the user/s with the email/s: [${formatListWithAnd(
      toEmails
    )}] has stopped responding. Consider contacting them to see if the chat can be reignited.`;
  } else {
    message =
      "You have unread messages from two weeks ago. Please check them at your earliest convenience.";
  }

  let msg;
  if (reason == "admin") {
    msg = {
      to: "penpal@murphycharity.org",
      from: SENDER_EMAIL, // Your verified sender email
      subject: "Message Reported",
      text: message || "No message provided.",
      html: generateDeadletterEmailTemplate({
        baseUrl,
        to: "Richard",
        message,
        letterboxId,
      }),
    };
  } else {
    msg = {
      to: toEmails,
      from: SENDER_EMAIL, // Your verified sender email
      subject: "Message Reported",
      text: message || "No message provided.",
      html: generateDeadletterEmailTemplate({
        baseUrl,
        to: formatListWithAnd(membersNames),
        message,
        letterboxId,
      }),
    };
  }
  try {
    // Send the email
    await transporter.sendMail(msg);

    if (db) {
      const fieldToUpdate =
        reason === "admin" ? "admin_reminded_at" : "user_reminded_at";
      await db
        .collection("letterbox")
        .doc(letterboxId)
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
