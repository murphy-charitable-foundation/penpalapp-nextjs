// app/api/setupNotifications/route.js
import admin from "firebase-admin";

// ---------- ADMIN INITIALIZATION ----------
const requiredEnvVars = [
  "FIREBASE_CONFIG",
  "FIREBASE_SERVICE_ACCOUNT_JSON"
];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
const envError = missingVars.length > 0
  ? `Missing Firebase env vars: ${missingVars.join(", ")}`
  : null;

let serviceAccount = null;
if (!envError) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (e) {
    console.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON JSON:", e.message);
  }
  if (!serviceAccount) {
    console.error("error retrieving service account in setup");
  }
}

if (!envError && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert( JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) )
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

    const userSnap = await userDocRef.get();
    if (userSnap.exists) {
      // Ensure user is attached to same device-group
      await userDocRef.set({ fcmToken }, { merge: true });
      return Response.json({
        success: true,
      });
    } else {
      return new Response(JSON.stringify({
        error: "User needs to create profile after their first login before setting up the notifications.",
      }), { status: 400 });
    }
  } catch (err) {
    console.error("Error in setupNotifications:", err);
    return new Response(JSON.stringify({ error: "Failed to setup notifications." }), {
      status: 500,
    });
  }
}
