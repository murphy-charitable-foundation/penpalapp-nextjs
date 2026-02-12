import { auth, db } from "../../app/firebaseAdmin";
import { logError } from "../../app/utils/analytics";
import { requireAdmin } from "../../app/utils/requireAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify admin authorization (delegated to util)
    await requireAdmin(req);

    const { email, password, userData } = req.body;

    if (!email || !password || !userData) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (typeof email !== "string") {
      return res.status(400).json({ error: "Invalid email" });
    }

    // Create the Firebase Authentication user
    const userRecord = await auth.createUser({
      email,
      password,
    });

    const uid = userRecord.uid;

    // Allowlist permitted fields to prevent arbitrary data injection
    const allowedFields = ["first_name", "last_name", "user_type", "email", "phone", "address", "country", "village", "bio", "education_level", "is_orphan", "guardian", "dream_job", "hobby", "hobbies", "favorite_color", "gender", "photo_uri", "birthday", "connected_penpals", "connected_penpals_count"];
    const sanitizedData = Object.fromEntries(
      Object.entries(userData).filter(([key]) => allowedFields.includes(key))
    );
    
    // Ensure user_type is always "child"
    sanitizedData.user_type = "child";
    
    // Save Firestore user document; roll back auth user on failure
    try {
      await db.collection("users").doc(uid).set(sanitizedData);
    } catch (firestoreError) {
      await auth.deleteUser(uid).catch(() => {}); // best-effort cleanup
      throw firestoreError;
    }

    return res.status(200).json({ uid });
  } catch (error) {
    if (error?.status && error.message) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error.code === "auth/argument-error" || error.message?.includes("Decoding")) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }
    logError(error, { description: "Failed to create user via admin API" });
    return res.status(500).json({ error: "Server error" });
  }
}
