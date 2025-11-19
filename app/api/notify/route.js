import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// --- REQUIRED ENV VARS ---
const requiredEnvVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL"
];

const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
const envError = missingVars.length > 0
  ? `Missing Firebase env vars: ${missingVars.join(", ")}`
  : null;

// Initialize only if no env errors
if (!envError && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const db = !envError ? getFirestore() : null;

/**
 * Verify user belongs in conversation
 */
async function isInConversation(senderUid, conversationId) {
  const convoRef = db.collection("letterbox").doc(conversationId);
  const convoSnap = await convoRef.get();
  if (!convoSnap.exists) return false;

  return (convoSnap.data().members || []).some((m) => m.id === senderUid);
}

/**
 * Fetch all tokens for all users in the same "device group"
 */
async function getConversationTokens(conversationId, senderUid) {
  const convoRef = db.collection("letterbox").doc(conversationId);
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
    if (!user.userGroup) continue;

    // userGroup === device FCM token now
    const tokenSnap = await db.collection("fcmTokens").doc(user.userGroup).get();

    if (tokenSnap.exists) {
      const tokenData = tokenSnap.data();
      tokens.push({
        token: tokenData.fcmToken,
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      });
    }
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
      decodedToken = await getAuth().verifyIdToken(idToken);
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
      return new Response(JSON.stringify({ message: "No FCM tokens found for recipients." }), { status: 500 });
    }

    // --- SEND ---
    const results = [];
    for (const { token, name } of tokens) {
      try {
        const response = await admin.messaging().send({
          token,
          notification: {
            title: "New Letterbox Message",
            body: message || "You have a new message.",
          },
        });
        results.push({ success: true, token, name, response });
      } catch (err) {
        console.error(`Failed to send to ${name}:`, err);
        results.push({
          success: false,
          token,
          name,
          error: "Failed to send notification.",
        });
      }
    }

    return new Response(JSON.stringify({
      message: "Notification processing complete.",
      results,
    }), { status: 207 });

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process notification request." }),
      { status: 500 }
    );
  }
}
