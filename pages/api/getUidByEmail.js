import { auth, db } from "../../app/firebaseAdmin";

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

    
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Invalid email" });
    }
    
    const userRecord = await auth.getUserByEmail(email);
    res.status(200).json({ uid: userRecord.uid });
  } catch (error) {
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
