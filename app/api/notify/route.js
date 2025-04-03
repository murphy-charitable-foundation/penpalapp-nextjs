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

export async function POST(req) {
  try {
    // Clients are expected to send a JSON payload containing an array of tokens.
    // Example:
    // {
    //   "tokens": [
    //     { "token": "fcm_token_1", "name": "Alice", "message": "Hello Alice!" },
    //     { "token": "fcm_token_2", "name": "Bob", "message": "Hello Bob!" }
    //   ],
    // }
    const { tokens } = await req.json();

    if (!tokens || !Array.isArray(tokens)) {
      return new Response(
        JSON.stringify({ error: "A valid tokens array is required." }),
        { status: 400 }
      );
    }

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: "No FCM tokens provided." }),
        { status: 204 }
      );
    }

    // Build notification messages for each provided token.
    const messages = tokens.map(({ token, name, message }) => ({
      token,
      notification: {
        title: `Notification for ${name || "User"}`,
        body: message
      }
    }));

    // Send the notifications in parallel.
    const responses = await Promise.all(
      messages.map(message => admin.messaging().send(message))
    );

    console.log("Notifications sent:", responses);

    return new Response(
      JSON.stringify({
        message: "Notifications sent successfully.",
        responses
      }),
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