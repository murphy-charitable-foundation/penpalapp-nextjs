import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
}

const db = admin.firestore();

export async function POST(req) {
  try {
    const { letterboxRef, currentUserId } = await req.json();

    if (!letterboxRef || !currentUserId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400 }
      );
    }

    const userDoc = await db.collection('users').doc(currentUserId).get();
    if (!userDoc.exists) {
      return new Response(
        JSON.stringify({ error: "User not found." }),
        { status: 404 }
      );
    }

    const letterboxDoc = await db.doc(letterboxRef).get();
    if (!letterboxDoc.exists) {
      return new Response(
        JSON.stringify({ error: "Letterbox not found." }),
        { status: 404 }
      );
    }
    
    const letterboxData = letterboxDoc.data();
    const members = letterboxData?.members || [];
    if (members.length === 0) {
      return new Response(
        JSON.stringify({ error: "No members found in the letterbox." }),
        { status: 404 }
      );
    }

    const fcmTokensCollectionRef = db.collection("fcmTokens");

    const tokenFetchPromises = members
      .filter(member => member.id !== currentUserId) // Skip sender
      .map(async member => {
        const fcmTokensSnapshot = await fcmTokensCollectionRef
          .where("userGroup", "==", member.userGroup)
          .get();
        
        return fcmTokensSnapshot.docs.map(doc => ({
          token: doc.data().fcmToken,
          name: member.name || "User"
        }));
      });
    
    const fetchedTokens = await Promise.all(tokenFetchPromises);
    const messages = fetchedTokens.flat().map(({ token, name }) => ({
      token,
      notification: {
        title: `Notification for ${name}`,
        body: "You have a new message in the letterbox."
      }
    }));

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ message: "No FCM tokens found for the recipients." }),
        { status: 204 }
      );
    }

    const responses = await Promise.all(messages.map(message => admin.messaging().send(message)));

    console.log("Notifications sent:", responses);

    return new Response(
      JSON.stringify({ message: "Notifications sent successfully.", responses }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending notifications:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notifications." }),
      { status: 500 }
    );
  }
}
