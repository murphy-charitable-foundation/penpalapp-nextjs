/**
 * POST /api/report
 * 
 * Sends a report about inappropriate message content
 * 
 * Request body:
 * {
 *   receiver_email: string,  // user_uid who is being reported
 *   currentUrl: string,      // URL of the conversation (e.g., "/letters/123")
 *   excerpt: string          // text excerpt of the reported message
 * }
 * 
 * Response (success):
 * { message: "Message reported successfully!" }
 * 
 * Response (error):
 * { message: "Failed to send email." }
 *
 * Sends email to: admin (penpal@murphycharity.org)
 */

import { NextResponse } from 'next/server';
import sendgrid from '@sendgrid/mail';
import { auth, db } from "../../firebaseAdmin";
import { logError } from "../../utils/analytics";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request) {
  try {
    if (!auth || !db) {
      return NextResponse.json(
        { message: "Server auth is not configured." },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Missing or invalid authorization header." },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(idToken);
    const reporterUid = decodedToken.uid;

    sendgrid.setApiKey(process.env.SENDGRID_KEY); // Set api key
    const body = await request.json();
    // Grab message information (never trust reporter identity from request body)
    const { receiver_email, currentUrl, excerpt } = body;
    if (!receiver_email || !currentUrl || !excerpt) {
      return NextResponse.json(
        { message: "Missing required report fields." },
        { status: 400 }
      );
    }

    const userSnap = await db.collection("users").doc(reporterUid).get();
    const userData = userSnap.exists ? userSnap.data() : {};

    const safeReceiverUid = escapeHtml(receiver_email);
    const safeCurrentUrl = escapeHtml(currentUrl);
    const safeExcerpt = escapeHtml(excerpt);
    const safeReporterFirstName = escapeHtml(userData.first_name || "");
    const safeReporterLastName = escapeHtml(userData.last_name || "");

    const message = `Hello, the user with the uid: ${safeReceiverUid}, reported this message: ${safeCurrentUrl} sent by a user with the name: ${safeReporterFirstName} ${safeReporterLastName}. Here is a brief excerpt from the reported message, "${safeExcerpt}"`;
    const emailHtml = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            }
            h1 {
              color: #333;
              font-size: 24px;
            }
            p {
              color: #555;
              font-size: 16px;
              line-height: 1.5;
            }
            .message-content {
              font-style: italic;
              color: #666;
              margin-top: 20px;
            }
            footer {
              margin-top: 30px;
              font-size: 12px;
              color: #999;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <h1>Message Reported</h1>
            <p><strong>Reported Message:</strong></p>
            <p class="message-content">${message || 'No message provided.'}</p>
            <footer>
              <p>This email was sent from your report system. If you have any questions, please contact us.</p>
            </footer>
          </div>
        </body>
      </html>
    `;

    // Email configuration
    const msg = {
      to: 'penpal@murphycharity.org', 
      from: 'penpal@murphycharity.org', // Your verified sender email
      subject: "Message Reported",
      text: message || 'No message provided.',
      html:  emailHtml,
    };

    // Send the email
    await sendgrid.send(msg);
    return NextResponse.json({ message: 'Email sent successfully!' }, { status: 200 });
    

  } catch (error) {
    logError(error, {
      description: "Failed to send email.",
    });

    return NextResponse.json({ message: "Failed to send email." }, { status: 500 });
  }
}
