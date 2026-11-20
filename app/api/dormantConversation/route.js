import { NextResponse } from "next/server";
import { db, auth } from "../../firebaseAdmin";
import { sendEmail } from "../../utils/dormantConversationHelpers";
import { isReminderDue } from "../../utils/dormantConversationPolicy.js";
import { logError } from "../../utils/serverAnalytics.mjs";

export const runtime = "nodejs";

// Bound concurrent account lookups and SMTP requests for large conversation lists.
async function mapConversations(documents, processConversation) {
  const results = new Array(documents.length);
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(4, documents.length) }, async () => {
    while (index < documents.length) {
      const next = index++;
      results[next] = await processConversation(documents[next]);
    }
  }));
  return results.flat();
}

function report(error, conversationId) {
  void logError(error, { description: "Dormant conversation request failed", conversationId })
    .catch(() => {});
}

export async function POST(request) {
  if (!auth || !db) {
    return NextResponse.json({ error: "Server auth/db is not configured." }, { status: 500 });
  }
  const authHeader = request.headers.get("Authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  try {
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.user_type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshot = await db.collection("conversations").get();
    const results = await mapConversations(snapshot.docs, async (conversation) => {
      try {
        const data = conversation.data();
        if (data.deleted_at != null) return [];
        if (data.latest_message_created_at == null) {
          const latest = await conversation.ref.collection("messages")
            .orderBy("created_at", "desc").limit(1).get();
          data.latest_message_created_at = latest.docs[0]?.data().created_at;
        }
        const reasons = ["user", "admin"].filter((reason) => isReminderDue(data, reason));
        if (!reasons.length) return [];
        const memberIds = [...new Set((data.members || [])
          .map((member) => typeof member === "string" ? member : member.id).filter(Boolean))];
        const [profiles, accountResults] = await Promise.all([
          Promise.all(memberIds.map((uid) => db.collection("users").doc(uid).get())),
          Promise.allSettled(memberIds.map((uid) => auth.getUser(uid))),
        ]);
        const members = profiles.filter((profile) => profile.exists).map((profile) => ({
          id: profile.id, firstName: profile.data().first_name, lastName: profile.data().last_name,
        }));
        const emails = accountResults.filter((result) => result.status === "fulfilled")
          .map((result) => result.value.email).filter(Boolean);
        const accountLookupFailure = accountResults.find((result) => result.status === "rejected");
        return await Promise.all(reasons.map(async (reason) => {
          try {
            // A missing member account prevents a complete user reminder, but
            // the administrator can still be notified about the conversation.
            if (reason === "user" && accountLookupFailure) throw accountLookupFailure.reason;
            if (reason === "user" && (!memberIds.length || emails.length !== memberIds.length)) {
              throw new Error("Missing reminder recipient email");
            }
            const result = await sendEmail(conversation.id, members, emails, reason);
            if (result?.success === true || result?.skipped === true || result?.error) return result;
            throw new Error("Invalid reminder delivery result");
          } catch (error) {
            report(error, conversation.id);
            return { conversationId: conversation.id, reason, error: "Failed to send reminder." };
          }
        }));
      } catch (error) {
        report(error, conversation.id);
        return [{ conversationId: conversation.id, error: "Failed to prepare reminders." }];
      }
    });
    const successEmails = results.filter((result) => result.success === true);
    const skippedEmails = results.filter((result) => result.skipped === true);
    const failedEmails = results.filter((result) => result.success !== true && result.skipped !== true);
    const complete = failedEmails.length === 0;
    return NextResponse.json({
      message: complete ? "DormantConversation Request Success!" : "Some reminder emails failed.",
      successEmails, failedEmails, skippedEmails,
    }, { status: complete ? 200 : 500 });
  } catch (error) {
    report(error);
    return NextResponse.json({ error: "Failed to process reminders." }, { status: 500 });
  }
}
