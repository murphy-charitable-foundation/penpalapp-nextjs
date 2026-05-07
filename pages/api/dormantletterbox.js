import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../app/firebaseConfig';
import { getAuth } from 'firebase-admin/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const idToken = authHeader.split(' ')[1];
  try {
    // Verify the token
    await getAuth().verifyIdToken(idToken);
    // Here you would implement the dormant letterbox logic
    // For now, just return success
    res.status(200).json({ success: true, message: 'Dormant letterbox check completed' });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}