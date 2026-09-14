import { getOrInitApp } from "../../firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "../../utils/requireAdmin";

// --- REQUIRED ENV VARS ---
const adminApp = getOrInitApp();

const envError = !adminApp
  ? "Missing or invalid Firebase Admin env var: FIREBASE_SERVICE_ACCOUNT_JSON"
  : null;

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
 * Verify that the original sender belongs to the conversation.
 */
async function isInConversation(senderUid, conversationId) {
  const conversationRef = db.collection("conversations").doc(conversationId);

  const conversationSnap = await conversationRef.get();

  if (!conversationSnap.exists) {
    return false;
  }

  const members = conversationSnap.data()?.members || [];

  return members.some((member) => member.id === senderUid);
}

/**
 * Fetch FCM tokens for conversation members other than the original sender.
 */
async function getConversationTokens(conversationId, senderUid) {
  const conversationRef = db.collection("conversations").doc(conversationId);

  const conversationSnap = await conversationRef.get();

  if (!conversationSnap.exists) {
    return [];
  }

  const members = conversationSnap.data()?.members || [];

  const recipients = members.filter((member) => member.id !== senderUid);

  const tokens = [];

  for (const member of recipients) {
    const userRef = db.collection("users").doc(member.id);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      continue;
    }

    const user = userSnap.data();

    if (!user.fcmToken) {
      continue;
    }

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

      return new Response(
        JSON.stringify({
          error:
            "Internal Server Error. Firebase environment variables are not configured.",
        }),
        { status: 500 },
      );
    }

    // --- AUTH ---
    await requireAdmin(req);

    // --- BODY ---
    const { conversationId, messageId } = await req.json();

    if (!conversationId || !messageId) {
      return new Response(
        JSON.stringify({
          error: "conversationId and messageId are required.",
        }),
        { status: 400 },
      );
    }
    // --- FETCH MESSAGE ---
    const messageRef = db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .doc(messageId);

    const messageSnap = await messageRef.get();

    if (!messageSnap.exists) {
      return new Response(
        JSON.stringify({
          error: "Message not found.",
        }),
        { status: 404 },
      );
    }

    const messageData = messageSnap.data();

    // Notification should only be sent after moderation approval.
    if (messageData.status !== "approved") {
      return new Response(
        JSON.stringify({
          error: "Notification can only be sent for an approved message.",
        }),
        { status: 409 },
      );
    }

    // Identify the original sender from the approved message,
    // rather than from the currently logged-in admin.
    const senderUid = messageData.sent_by?.id;

    if (!senderUid) {
      return new Response(
        JSON.stringify({
          error: "Original message sender could not be identified.",
        }),
        { status: 400 },
      );
    }

    // --- VERIFY ORIGINAL SENDER ---
    const senderIsMember = await isInConversation(senderUid, conversationId);

    if (!senderIsMember) {
      return new Response(
        JSON.stringify({
          error: "Original sender is not part of this conversation.",
        }),
        { status: 403 },
      );
    }

    // --- FETCH RECIPIENT TOKENS ---
    const tokens = await getConversationTokens(conversationId, senderUid);

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No FCM tokens found for recipients.",
          results: [],
        }),
        { status: 200 },
      );
    }

    // --- SEND NOTIFICATIONS ---
    const notificationTitle = "New Conversation Message";
    const clickAction = `/conversation/${conversationId}`;
    const requestOrigin = new URL(req.url).origin;
    const absoluteLink = `${requestOrigin}${clickAction}`;

    const sendPromises = tokens.map(({ token, name, userRef }) => {
      const notificationBody = name
        ? `You have a new message, ${name}.`
        : "You have a new message.";

      return messaging
        .send({
          token,
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
        })
        .then((response) => ({ success: true, name, response }))
        .catch(async (sendError) => {
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

          console.error(`Failed to send notification to ${name}:`, sendError);

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
    const status = failureCount === 0 ? 200 : successCount === 0 ? 502 : 207;

    return new Response(
      JSON.stringify({
        message: "Notification processing complete.",
        successCount,
        failureCount,
        results,
      }),
      { status },
    );
  } catch (error) {
    console.error("Error processing notification request:", error);

    const status =
      error.status || (error.code?.startsWith("auth/") ? 401 : 500);

    return new Response(
      JSON.stringify({
        error:
          status === 500
            ? "Failed to process notification request."
            : error.message,
      }),
      { status },
    );
  }
}
