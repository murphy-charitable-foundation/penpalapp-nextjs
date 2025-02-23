import * as admin from "firebase-admin";
import * as Sentry from "@sentry/node"; 

// Check if Firebase credentials exist
var hasValidCredentials;
if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  hasValidCredentials = true;
} else {
  hasValidCredentials = false;
}


if (hasValidCredentials == true) {
  const serviceAccount = {
    projectId: "penpalmagicapp",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Ensure proper PEM formatting
  };

  // Initialize Firebase Admin SDK if not already initialized
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
  }
} else {
  const errorMessage = "Firebase Admin SDK is not initialized due to missing credentials.";
  Sentry.captureException(new Error(errorMessage));
}


// Export Firebase services only if Firebase is initialized
export const auth = admin.apps.length ? admin.auth() : null;
export const db = admin.apps.length ? admin.firestore() : null;
export const storage = admin.apps.length ? admin.storage() : null;