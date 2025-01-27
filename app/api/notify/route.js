import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
}

const db = admin.firestore();

export async function POST(req) {
  const { email, title, body, data } = await req.json();

  if (!email || !title || !body) {
    return new Response(
      JSON.stringify({ error: "Missing required fields." }),
      { status: 400 }
    );
  }

  try {
    const userQuerySnapshot = await db.collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();
  
    if (userQuerySnapshot.empty) {
      return new Response(
        JSON.stringify({ error: "Email not found." }),
        { status: 404 }
      );
    }
  
    const userDoc = userQuerySnapshot.docs[0];
    const userData = userDoc.data();
    const userGroup = userData.userGroup;

    const fcmTokensCollectionRef = db.collection("fcmTokens");
    const fcmTokensSnapshot = await fcmTokensCollectionRef
      .where("userGroup", "==", userGroup)
      .limit(1)
      .get();

    if (fcmTokensSnapshot.empty) {
      return new Response(
        JSON.stringify({ error: "FCM token not found for the specified user group." }),
        { status: 404 }
      );
    }

    const fcmDoc = fcmTokensSnapshot.docs[0];
    const fcmData = fcmDoc.data();
    const fcmToken = fcmData.fcmToken;

    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body,
      },
      data: data || {},
    };

    const response = await admin.messaging().send(message);
    console.log(response);

    return new Response(
      JSON.stringify({ message: "Notification sent successfully.", response }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending notification: ", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification." }),
      { status: 500 }
    );
  }
}
