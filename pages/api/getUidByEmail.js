import { auth, db } from "../../app/firebaseAdmin";
import { requireAdmin } from "../../app/utils/requireAdmin";

export default async function handler(req, res) {
  
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    
    // Verify admin authorization (delegated to util)
    const callerUid = await requireAdmin(req);
    
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Invalid email" });
    }
    
    const userRecord = await auth.getUserByEmail(email);
    res.status(200).json({ uid: userRecord.uid });
  } catch (error) {
    if (error?.status && error.message) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error.code === "auth/argument-error" || error.message?.includes("Decoding")) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }
    if (error.code === "auth/user-not-found") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("Error fetching UID:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
