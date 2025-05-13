import * as admin from "firebase-admin";
import * as Sentry from "@sentry/node"; 

// Trying to different approaches to get Firebase credentials
let serviceAccount;

// First trying to use individual environment variables
if (process.env.private_key && process.env.client_email) {
  serviceAccount = {
    projectId: "penpalmagicapp",
    clientEmail: process.env.client_email,
    // Make sure to properly handle newlines in the private key
    privateKey: process.env.private_key.replace(/\\n/g, "\n"),
  };
}
// Fallback to service account JSON if available
else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    Sentry.captureException("Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:", error);
  }
}
// Last resort for local development
else {
  try {
    // Attempt to load from a local file for development only
    if (process.env.NODE_ENV === "development") {
      serviceAccount = require("../penpalmagicapp-firebase-adminsdk.json");
    }
  } catch (error) {
    Sentry.captureException("Failed to load Firebase credentials:", error);
    serviceAccount = { projectId: "penpalmagicapp" }; // Will fail gracefully later
  }
}

// Validate the service account
if (!serviceAccount?.privateKey) {
  console.error(
    "Firebase private key is missing. Check your environment variables."
  );
}

// Initialize Firebase only if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    Sentry.captureException("Firebase admin initialization error:", error);
  }
}

export const auth = admin.apps.length ? admin.auth() : null;
export const db = admin.apps.length ? admin.firestore() : null;
export const storage = admin.apps.length ? admin.storage() : null;

