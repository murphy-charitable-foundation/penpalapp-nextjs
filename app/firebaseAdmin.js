import * as admin from "firebase-admin";

// Trying different approaches to get Firebase credentials
let serviceAccount;

// First, try to use individual environment variables
if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  serviceAccount = {
    projectId: "penpalmagicapp",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Replace escaped newline characters with actual newlines
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}
// Fallback to service account JSON if available
else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:", error);
  }
}
// Last resort for local development
else {
  try {
    if (process.env.NODE_ENV === "development") {
      serviceAccount = require("../penpalmagicapp-firebase-adminsdk.json");
    }
  } catch (error) {
    console.error("Failed to load Firebase credentials:", error);
    serviceAccount = { projectId: "penpalmagicapp" }; // This will fail gracefully later
  }
}

// Validate the service account
if (!serviceAccount?.privateKey) {
  console.error("Firebase private key is missing. Check your environment variables.");
}

// Initialize Firebase only if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
