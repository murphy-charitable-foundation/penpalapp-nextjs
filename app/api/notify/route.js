import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const db = getFirestore();

/**
 * Verifies that the sender is part of the given conversation.
 */
async function isInConversation(senderUid, conversationId) {
  const convoRef = db.collection("letterbox").doc(conversationId);
  const convoSnap = await convoRef.get();
  if (!convoSnap.exists) return false;

  const convoData = convoSnap.data();
  if (!convoData?.members) return false;

  return convoData.members.some((m) => m.id === senderUid);
}

/**
 * Retrieves all FCM tokens for members of a conversation except the sender.
 */
async function getConversationTokens(conversationId, senderUid) {
  const convoRef = db.collection("letterbox").doc(conversationId);
  const convoSnap = await convoRef.get();
  if (!convoSnap.exists) return [];

  const convoData = convoSnap.data();
  const members = convoData?.members || [];

  // Filter out the sender
  const recipientRefs = members.filter((m) => m.id !== senderUid);

  const tokens = [];

  for (const memberRef of recipientRefs) {
    try {
      const userRef = db.collection("users").doc(memberRef.id);
      const userSnap = await userRef.get();
      if (!userSnap.exists) continue;
      const user = userSnap.data();

      // Query all FCM tokens belonging to this user's group or uid
      const tokenQuery = db.collection("fcmTokens").where("userGroup", "==", user.userGroup);
      const tokenSnap = await tokenQuery.get();

      tokenSnap.forEach((t) => {
        tokens.push({
          token: t.data().fcmToken,
          name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        });
      });
    } catch (err) {
      console.error("Error fetching tokens for recipient:", memberRef.id, err);
    }
  }

  return tokens;
}

export async function POST(req) {
  try {
    // --- AUTHENTICATE SENDER ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header." }),
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (authError) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Authentication failed." }),
        { status: 403 }
      );
    }

    const senderUid = decodedToken.uid;

    // --- PARSE BODY ---
    const { conversationId, message } = await req.json();

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: "conversationId is required." }),
        { status: 400 }
      );
    }

    // --- VERIFY MEMBERSHIP ---
    const allowed = await isInConversation(senderUid, conversationId);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Sender is not part of this conversation." }),
        { status: 403 }
      );
    }

    // --- FETCH TOKENS SERVER-SIDE ---
    const tokens = await getConversationTokens(conversationId, senderUid);

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: "No FCM tokens found for recipients." }),
        { status: 204 }
      );
    }

    // --- SEND NOTIFICATIONS ---
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
      } catch (sendError) {
        console.error(`Failed to send to ${name}:`, sendError);
        results.push({
          success: false,
          error: `Failed to send notification to ${name}.`,
          token,
          name,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Notification processing complete.",
        results,
      }),
      { status: 207 } // Multi-Status
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process notification request." }),
      { status: 500 }
    );
  }
}
