/**
 * POST /api/report
 * 
 * Sends a report event about inappropriate message content
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
 * { message: "Failed to submit report." }
 */

import { NextResponse } from 'next/server';
import { auth, db } from "../../firebaseAdmin";
import { logError } from "../../utils/analytics";

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

    // Report is tracked through analytics (SENDGRID_KEY path is deprecated).
    logError(new Error("Message reported by user"), {
      description: "User submitted content report",
      reporter_uid: reporterUid,
      reporter_first_name: userData.first_name || "",
      reporter_last_name: userData.last_name || "",
      receiver_uid: String(receiver_email),
      conversation_url: String(currentUrl),
      excerpt: String(excerpt),
    });

    return NextResponse.json({ message: 'Message reported successfully!' }, { status: 200 });

  } catch (error) {
    logError(error, {
      description: "Failed to submit report.",
    });

    return NextResponse.json({ message: "Failed to submit report." }, { status: 500 });
  }
}
