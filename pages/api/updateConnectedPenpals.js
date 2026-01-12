import { db } from '../../app/firebaseAdmin'; // adjust path if needed
import * as admin from 'firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { internationalBuddyUID, userId } = req.body;

  if (!internationalBuddyUID || !userId) {
    return res.status(400).json({ error: 'Missing internationalBuddyUID or userId' });
  }

  try {
    const userRef = db.collection('users').doc(internationalBuddyUID);
    const penpalPath = `/users/${userId}`;

    await userRef.update({
      connected_penpals: admin.firestore.FieldValue.arrayUnion(penpalPath),
    });

    res.status(200).json({ message: `Added ${penpalPath} to ${internationalBuddyUID}'s connected_penpals` });
  } catch (error) {
    console.error('Error updating connected_penpals:', error);
    res.status(500).json({ error: 'Failed to update connected_penpals' });
  }
}