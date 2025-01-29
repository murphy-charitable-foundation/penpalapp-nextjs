import * as admin from 'firebase-admin';

//import serviceAccount from '../penpalmagicapp-firebase-adminsdk-czr2x-7f1623a3ac.json';

const serviceAccount = {
  projectId: "penpalmagicapp",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle line breaks in private key
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();