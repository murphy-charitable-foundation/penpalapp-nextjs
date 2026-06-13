/**
 * POST /api/report
 *
 * Sends a report about inappropriate message content.
 *
 * Request body:
 * {
 *   receiver_email: string,
 *   currentUrl: string,
 *   excerpt: string
 * }
 *
 * Requires:
 * Authorization: Bearer <Firebase ID token>
 */

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth, db } from "../../firebaseAdmin";

export const runtime = "nodejs";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

    const { receiver_email, currentUrl, excerpt } = body || {};

    if (!receiver_email || !currentUrl || !excerpt) {
      return jsonError("Missing required report fields.", 400);
    }

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
Reported User UID: ${receiver_email}
Conversation URL: ${currentUrl}

Reported Excerpt:
"${excerpt}"
    `.trim();

    const safeReporterUid = escapeHtml(reporterUid);
    const safeReporterName = escapeHtml(reporterName || "Unknown");
    const safeReceiverUid = escapeHtml(receiver_email);
    const safeCurrentUrl = escapeHtml(currentUrl);
    const safeExcerpt = escapeHtml(excerpt);

    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <h1 style="color: #333; font-size: 24px;">Message Reported</h1>

            <p><strong>Reporter UID:</strong> ${safeReporterUid}</p>
            <p><strong>Reporter Name:</strong> ${safeReporterName}</p>
            <p><strong>Reported User UID:</strong> ${safeReceiverUid}</p>
            <p><strong>Conversation URL:</strong> ${safeCurrentUrl}</p>

            <p><strong>Reported Message Excerpt:</strong></p>
            <p style="font-style: italic; color: #666; white-space: pre-wrap;">"${safeExcerpt}"</p>

            <hr />

            <p style="font-size: 12px; color: #999;">
              This email was sent from the report system.
            </p>
          </div>
        </body>
      </html>
    `;

    const requiredEnvVars = [
      "PENPAL_EMAIL",
      "PENPAL_EMAIL_PASSWORD",
      "CPANEL_SMTP_HOST",
      "CPANEL_SMTP_PORT",
    ];

    const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

    if (missingEnvVars.length > 0) {
      return jsonError(
        `Missing email environment variables: ${missingEnvVars.join(", ")}`,
        500
      );
    }

    const smtpPort = Number(process.env.CPANEL_SMTP_PORT);

    if (Number.isNaN(smtpPort)) {
      return jsonError("CPANEL_SMTP_PORT must be a number.", 500);
    }

    const transporter = nodemailer.createTransport({
      host: process.env.CPANEL_SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.PENPAL_EMAIL,
        pass: process.env.PENPAL_EMAIL_PASSWORD,
      },
    });

    try {
      await transporter.sendMail({
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