import { auth } from "../../app/firebaseAdmin";

export default async function handler(req, res) {
  
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Invalid email" });
  }


  try {
    const userRecord = await auth.getUserByEmail(email);
    res.status(200).json({ uid: userRecord.uid });
  } catch (error) {
    console.error("Error fetching UID:", error);
    res.status(404).json({ error: "User not found" });
  }
}
