 /**
 * POST /api/report
 *
 * Sends a report about inappropriate message content.
 *
 * Request body:
 * {
 *   receiver_email: string,
 *   currentUrl: string,
 *   messageSummary: string
 * }
 *
 * Requires:
 * Authorization: Bearer <Firebase ID token>
 */

import { NextResponse } from "next/server";
import { sendEmailMessage } from "../../utils/email";
import { auth, db } from "../../firebaseAdmin";
import { logError } from "../../utils/analytics";

export const runtime = "nodejs";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSafeHref(value = "") {
  const rawValue = String(value || "");

  try {
    const parsedUrl = new URL(rawValue);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return "";
    }

    return escapeHtml(parsedUrl.toString());
  } catch {
    return "";
  }
}

function jsonError(message, status, error = null) {
  console.error(message, error || "");

  return NextResponse.json(
    {
      message,
      error:
        process.env.NODE_ENV === "development" && error
          ? error.message || String(error)
          : undefined,
    },
    { status }
  );
}

export async function POST(request) {
  try {
    if (!auth || !db) {
      return jsonError("Server auth/db is not configured.", 500);
    }

    const authHeader = request.headers.get("authorization");

    console.log("Authorization header exists:", Boolean(authHeader));
    console.log(
      "Authorization header starts with Bearer:",
      authHeader?.startsWith("Bearer ")
    );

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError("Missing or invalid authorization header.", 401);
    }

    const idToken = authHeader.substring(7);

    let reporterUid;

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      reporterUid = decodedToken.uid;
      console.log("Verified reporter UID:", reporterUid);
    } catch (authError) {
      return jsonError("Invalid or expired token.", 401, authError);
    }

    let body;

    try {
      body = await request.json();
    } catch (jsonParseError) {
      return jsonError("Invalid JSON payload.", 400, jsonParseError);
    }

    const { receiver_email, currentUrl, messageSummary } = body || {};

    if (
      !receiver_email ||
      !currentUrl ||
      typeof messageSummary !== "string" ||
      !messageSummary
    ) {
      return jsonError("Missing required report fields.", 400);
    }

    const excerpt =
      messageSummary.length > 100
        ? `${messageSummary.substring(0, 100)}...`
        : messageSummary;

    let userData = {};

    try {
      const userSnap = await db.collection("users").doc(reporterUid).get();
      userData = userSnap.exists ? userSnap.data() : {};
    } catch (firestoreError) {
      console.error("Could not fetch reporter user profile:", firestoreError);
      userData = {};
    }

    const reporterName = `${userData.first_name || ""} ${
      userData.last_name || ""
    }`.trim();

    const textMessage = `
Hello,

A message has been reported.

Reporter UID: ${reporterUid}
Reporter Name: ${reporterName || "Unknown"}
Reported User / Receiver: ${receiver_email}
Conversation URL: ${currentUrl}

Reported Excerpt:
"${excerpt}"
    `.trim();

    const safeReporterUid = escapeHtml(reporterUid);
    const safeReporterName = escapeHtml(reporterName || "Unknown");
    const safeReceiverEmail = escapeHtml(receiver_email);
    const safeCurrentUrl = escapeHtml(currentUrl);
    const safeCurrentHref = getSafeHref(currentUrl);
    const safeExcerpt = escapeHtml(excerpt);

    const conversationUrlHtml = safeCurrentHref
      ? `
          <a href="${safeCurrentHref}" style="color: #0066cc; word-break: break-all;">
            ${safeCurrentUrl}
          </a>
        `
      : `
          <span style="word-break: break-all;">
            ${safeCurrentUrl}
          </span>
        `;

    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #333333; font-size: 24px; margin: 0 0 16px;">
              Message Reported
            </h1>

            <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
              A message has been reported for moderation.
            </p>

            <div style="background-color: #f5f5f5; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
              <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 10px;">
                <strong>Reporter UID:</strong> ${safeReporterUid}
              </p>

              <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 10px;">
                <strong>Reporter Name:</strong> ${safeReporterName}
              </p>

              <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 10px;">
                <strong>Reported User / Receiver:</strong> ${safeReceiverEmail}
              </p>

              <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0;">
                <strong>Conversation URL:</strong>
                ${conversationUrlHtml}
              </p>
            </div>

            <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 8px;">
              <strong>Reported Message Excerpt:</strong>
            </p>

            <div style="font-style: italic; color: #666666; background-color: #fafafa; padding: 14px; border-left: 4px solid #cccccc; border-radius: 4px; white-space: pre-wrap; line-height: 1.5;">
              "${safeExcerpt}"
            </div>

            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 24px 0;" />

            <p style="font-size: 12px; color: #999999; text-align: center; margin: 0;">
              This email was sent from the report system.
            </p>
          </div>
        </body>
      </html>
    `;

    // SMTP config validation is handled inside `sendEmailMessage`

    try {
      await sendEmailMessage({
        to: process.env.PENPAL_EMAIL,
        from: process.env.PENPAL_EMAIL,
        subject: "Message Reported",
        text: textMessage,
        html: emailHtml,
      });
    } catch (emailError) {
      return jsonError("Failed to send report email.", 500, emailError);
    }

    logError(new Error("Message reported by user"), {
      description: "User submitted content report",
      reporter_uid: reporterUid,
      reporter_first_name: userData.first_name || "",
      reporter_last_name: userData.last_name || "",
      conversation_url: String(currentUrl),
      excerpt: String(excerpt),
    });

    return NextResponse.json(
      { message: "Message reported successfully!" },
      { status: 200 }
    );
  } catch (error) {
    return jsonError("Failed to submit report.", 500, error);
  }
}
