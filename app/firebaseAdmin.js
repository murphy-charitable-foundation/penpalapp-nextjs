import admin from "firebase-admin";

import { logError } from "./utils/analytics.js";

export function getOrInitApp(name='[DEFAULT]', envVar='FIREBASE_SERVICE_ACCOUNT_JSON') {
  const existingApp = admin.apps.find((app) => app.name === name);
  if (existingApp) return existingApp;
  if (!envVar || !process.env[envVar]) return null;

  try {
    const serviceAccount = JSON.parse(process.env[envVar]);
    return admin.initializeApp({credential: admin.credential.cert(serviceAccount)}, name);
  } catch (error) {
    logError(error, {
      description: "Error parsing environment variable:",
    });
  }
}

const app = getOrInitApp();

console.info("[firebase-admin-debug]", {
  nodeEnv: process.env.NODE_ENV,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "unknown",
  env: {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "set" : "missing",
    FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? "set" : "missing",
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? "set" : "missing",
  },
});

// Existing imports still work
export const auth = app?.auth();
export const db = app?.firestore();
export const storage = app?.storage();

export const FieldPath = admin.firestore.FieldPath;
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
