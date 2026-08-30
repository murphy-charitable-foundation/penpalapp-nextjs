import { getOrInitApp } from "../../firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// --- REQUIRED ENV VARS ---
const adminApp = getOrInitApp();
const envError = !adminApp
  ? "Missing or invalid Firebase Admin env var: FIREBASE_SERVICE_ACCOUNT_JSON"
  : null;

const auth = adminApp?.auth();
const db = adminApp?.firestore();
const messaging = adminApp?.messaging();

const TERMINAL_TOKEN_ERROR_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

async function removeStaleToken(userRef, token) {
  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);

    if (userSnap.data()?.fcmToken === token) {
      transaction.update(userRef, { fcmToken: FieldValue.delete() });
    }
  });
}

/**
 * Verify user belongs in conversation
 */
async function isInConversation(senderUid, conversationId) {
  const convoRef = db.collection("conversations").doc(conversationId);
  const convoSnap = await convoRef.get();
  if (!convoSnap.exists) return false;

  return (convoSnap.data().members || []).some((m) => m.id === senderUid);
}

/**
 * Fetch all tokens for all users in the same "device group"
 */
async function getConversationTokens(conversationId, senderUid) {
  const convoRef = db.collection("conversations").doc(conversationId);
  const convoSnap = await convoRef.get();
  if (!convoSnap.exists) return [];

  const members = convoSnap.data()?.members || [];
  const recipients = members.filter((m) => m.id !== senderUid);

  const tokens = [];

  for (const member of recipients) {
    const userRef = db.collection("users").doc(member.id);
    const userSnap = await userRef.get();
    if (!userSnap.exists) continue;

    const user = userSnap.data();
    if (!user.fcmToken) continue;

    tokens.push({
      token: user.fcmToken,
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      userRef,
    });
  }

  return tokens;
}

export async function POST(req) {
  try {
    if (envError) {
      console.error("Environment Configuration Error:", envError);
      return new Response(JSON.stringify({
        error: "Internal Server Error. Firebase environment variables are not configured.",
      }), { status: 500 });
    }

    // --- AUTH ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Authorization header." }), { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;

    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch {
      return new Response(JSON.stringify({ error: "Authentication failed." }), { status: 403 });
    }

    const senderUid = decodedToken.uid;

    // --- BODY ---
    const { conversationId, message } = await req.json();
    if (!conversationId) {
      return new Response(JSON.stringify({ error: "conversationId is required." }), { status: 400 });
    }

    // --- VERIFY ---
    const allowed = await isInConversation(senderUid, conversationId);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Sender is not part of this conversation." }), { status: 403 });
    }

    // --- FETCH TOKENS ---
    const tokens = await getConversationTokens(conversationId, senderUid);

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ message: "No FCM tokens found for recipients." }), { status: 200 });
    }

    // --- SEND ---
    const notificationTitle = "New Conversation Message";
    const clickAction = `/conversation/${conversationId}`;
    const requestOrigin = new URL(req.url).origin;
    const absoluteLink = `${requestOrigin}${clickAction}`;

    const sendPromises = tokens.map(({ token, name, userRef }) => {
      const notificationBody = message || `New message for ${name}`;

      console.log("[Notifications] Sending FCM message:", {
        recipient: name,
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: {
          click_action: clickAction,
          conversationId,
          recipientName: name,
        },
        webpush: {
          fcmOptions: {
            link: absoluteLink,
          },
        },
      });

      return messaging.send({
        token,
        data: {
          title: notificationTitle,
          body: notificationBody,
          click_action: clickAction,
          conversationId,
          recipientName: name,
        },
        webpush: {
          fcmOptions: {
            link: absoluteLink,
          },
        },
      })
        .then(response => ({ success: true, name, response }))
        .catch(async sendError => {
          if (TERMINAL_TOKEN_ERROR_CODES.has(sendError?.code)) {
            try {
              await removeStaleToken(userRef, token);
              console.info(`Removed stale notification token for ${name}.`);
            } catch (cleanupError) {
              console.error(
                `Failed to remove stale notification token for ${name}:`,
                cleanupError,
              );
            }

            return {
              success: false,
              staleTokenRemoved: true,
              error: `Notification token for ${name} is no longer registered.`,
              name,
            };
          }

          console.error(`Failed to send to ${name}:`, sendError);
          return {
            success: false,
            error: `Failed to send notification to ${name}.`,
            name,
          };
        });
    });
    const results = await Promise.all(sendPromises);
    const successCount = results.filter((result) => result.success).length;
    const failureCount = results.length - successCount;

    const status =
      failureCount === 0 ? 200 : successCount === 0 ? 502 : 207;

    return new Response(JSON.stringify({
      message: "Notification processing complete.",
      successCount,
      failureCount,
      results,
    }), { status });

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process notification request." }),
      { status: 500 }
    );
  }
}
