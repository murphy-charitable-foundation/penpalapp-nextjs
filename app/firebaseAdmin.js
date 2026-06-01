import admin from "firebase-admin";

import { logError } from "./utils/analytics.js";

export function getOrInitApp(name='[DEFAULT]', envVar='FIREBASE_SERVICE_ACCOUNT_JSON') {
  const existingApp = admin.apps.find((app) => app.name === name);
  if (existingApp) return existingApp;
  if (!envVar) return null;

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

// Existing imports still work
export const auth = app.auth();
export const db = app.firestore();
export const storage = app.storage();

export const FieldPath = admin.firestore.FieldPath;
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;