// app/api/setupNotifications/route.js
import { auth, db } from "../../firebaseAdmin";

// ---------- ADMIN INITIALIZATION ----------
const envError =
  !auth || !db
    ? "Missing or invalid Firebase Admin env var: FIREBASE_SERVICE_ACCOUNT_JSON"
    : null;

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
    const decoded = await auth.verifyIdToken(idToken);
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
