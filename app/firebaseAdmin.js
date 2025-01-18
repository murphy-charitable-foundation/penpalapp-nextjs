import * as admin from 'firebase-admin';

import serviceAccount from '../penpalmagicapp-firebase-adminsdk-czr2x-7f1623a3ac.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

//projectId: process.env.FIREBASE_PROJECT_ID,
        //clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        //privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();