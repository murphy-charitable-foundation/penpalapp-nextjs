// app/api/setupNotifications/route.js
import admin from "firebase-admin";

// ---------- ADMIN INITIALIZATION ----------
const requiredEnvVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL"
];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
const envError = missingVars.length > 0
  ? `Missing Firebase env vars: ${missingVars.join(", ")}`
  : null;

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

const db = !envError ? admin.firestore() : null;

// ---------- ROUTE HANDLER ----------
export async function POST(req) {
  try {
    if (envError) {
      console.error("Environment Configuration Error:", envError);
      return new Response(JSON.stringify({
        error: "Internal Server Error. Firebase environment variables are not configured.",
      }), { status: 500 });
    }
    const { idToken, fcmToken } = await req.json();

    if (!idToken || !fcmToken) {
      return new Response(
        JSON.stringify({ error: "Missing idToken or fcmToken" }),
        { status: 400 }
      );
    }

    // Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const userDocRef = db.collection("users").doc(uid);
    const tokenDocRef = db.collection("fcmTokens").doc(fcmToken);

    // Check if token already exists
    const tokenSnap = await tokenDocRef.get();

    const userGroup = fcmToken;

    // Case 1: Device already registered
    if (tokenSnap.exists) {
      // Ensure user is attached to same device-group
      await userDocRef.set({ userGroup }, { merge: true });

      return Response.json({
        success: true,
      });
    }

    // Case 2: New device registration
    await tokenDocRef.set({
      fcmToken,
      createdAt: new Date(),
    });

    await userDocRef.set({ userGroup }, { merge: true });

    return Response.json({
      success: true,
    });
  } catch (err) {
    console.error("Error in setupNotifications:", err);
    return new Response(JSON.stringify({ error: "Failed to setup notifications." }), {
      status: 500,
    });
  }
}
