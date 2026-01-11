import { auth, db } from "../../app/firebaseAdmin";
import { logError } from "../../app/utils/analytics";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, userData } = req.body;

  if (!email || !password || !userData) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Create the Firebase Authentication user
    const userRecord = await auth.createUser({
      email,
      password,
    });

    const uid = userRecord.uid;

    // Save Firestore user document
    await db.collection("users").doc(uid).set(userData);

    return res.status(200).json({ uid });
  } catch (error) {
    logError(error, { description: "Failed to create user via admin API" });
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
