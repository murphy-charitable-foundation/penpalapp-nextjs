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

// ---------- HELPERS ----------

/**
 * Assign a new user group atomically using a counter document.
 */
const assignNewUserGroup = async (fcmToken, userDocRef) => {
  const counterDocRef = db.collection("counters").doc("userGroup");
  const tokenDocRef = db.collection("fcmTokens").doc(fcmToken);

  const newUserGroup = await db.runTransaction(async (transaction) => {
    const counterSnap = await transaction.get(counterDocRef);
    let nextGroup = 1;

    if (counterSnap.exists) {
      const current = counterSnap.data()?.current || 0;
      nextGroup = current + 1;
      transaction.update(counterDocRef, { current: nextGroup });
    } else {
      transaction.set(counterDocRef, { current: nextGroup });
    }

    // Save FCM token and userGroup
    transaction.set(tokenDocRef, {
      fcmToken,
      userGroup: nextGroup,
      createdAt: new Date(),
    });

    // Update user document
    transaction.set(userDocRef, { userGroup: nextGroup }, { merge: true });

    return nextGroup;
  });

  return newUserGroup;
};

// ---------- ROUTE HANDLER ----------
export async function POST(req) {
  try {
    const { idToken, fcmToken, forceNewGroup = false } = await req.json();

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
    const userDocSnap = await userDocRef.get();

    const tokenDocRef = db.collection("fcmTokens").doc(fcmToken);
    const tokenSnap = await tokenDocRef.get();

    let userGroup;

    // ---------------------------
    // Case 1: Force new group
    // ---------------------------
    if (forceNewGroup) {
      userGroup = await assignNewUserGroup(fcmToken, userDocRef);
      return Response.json({ success: true, userGroup, newGroup: true });
    }

    // ---------------------------
    // Case 2: Device already exists
    // ---------------------------
    if (tokenSnap.exists) {
      userGroup = tokenSnap.data().userGroup;

      // Update user to match device group if different
      if (!userDocSnap.exists || userDocSnap.data()?.userGroup !== userGroup) {
        await userDocRef.set({ userGroup }, { merge: true });
      }

      return Response.json({ success: true, userGroup, newGroup: false });
    }

    // ---------------------------
    // Case 3: Device is new
    // ---------------------------
    userGroup = await assignNewUserGroup(fcmToken, userDocRef);
    return Response.json({ success: true, userGroup, newGroup: true });

  } catch (err) {
    console.error("Error in setupNotifications:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
