// app/api/setupNotifications/route.js
import admin from "firebase-admin";

// ---------- ADMIN INITIALIZATION ----------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const db = admin.firestore();

// ---------- ROUTE HANDLER ----------
export async function POST(req) {
  try {
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
      userGroup,
      createdAt: new Date(),
    });

    await userDocRef.set({ userGroup }, { merge: true });

    return Response.json({
      success: true,
    });
  } catch (err) {
    console.error("Error in setupNotifications:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
