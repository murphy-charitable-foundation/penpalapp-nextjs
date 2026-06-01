import admin from "firebase-admin";

import { logError } from "./utils/analytics.js";

// Trying to different approaches to get Firebase credentials
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    logError(error, {
      description: "Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:",
    });
  }
}

// Validate the service account
if (!serviceAccount?.privateKey) {
  throw new Error(
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
    logError(error, {
      description: "Firebase admin initialization error:",
    });
  }
}

export const auth = admin.apps.length ? admin.auth() : null;
export const db = admin.apps.length ? admin.firestore() : null;
export const storage = admin.apps.length ? admin.storage() : null;
export const FieldPath = admin.firestore.FieldPath;