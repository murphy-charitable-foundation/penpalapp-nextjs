import { auth, db } from "../../app/firebaseAdmin";
import { logError } from "../../app/utils/analytics";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    // Check if caller is an admin by looking up their user_type in Firestore
    const callerDoc = await db.collection("users").doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data().user_type !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { email, password, userData } = req.body;

    if (!email || !password || !userData) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create the Firebase Authentication user
    const userRecord = await auth.createUser({
      email,
      password,
    });

    const uid = userRecord.uid;

    // Save Firestore user document; roll back auth user on failure
    try {
      await db.collection("users").doc(uid).set(userData);
    } catch (firestoreError) {
      await auth.deleteUser(uid).catch(() => {}); // best-effort cleanup
      throw firestoreError;
    }

    return res.status(200).json({ uid });
  } catch (error) {
    if (error.code === "auth/argument-error" || error.message?.includes("Decoding")) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }
    logError(error, { description: "Failed to create user via admin API" });
    return res.status(500).json({ error: "Server error" });
  }
}
