import { auth, db } from "../firebaseAdmin";

export async function requireAdmin(req) {
  // Verify admin authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("Missing or invalid authorization header");
    err.status = 401;
    throw err;
  }

  const idToken = authHeader.substring(7);
  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch (e) {
    // rethrow firebase auth errors so callers can handle them
    throw e;
  }

  const callerUid = decodedToken.uid;

  // Check if caller is an admin by looking up their user_type in Firestore
  const callerDoc = await db.collection("users").doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().user_type !== "admin") {
    const err = new Error("Admin access required");
    err.status = 403;
    throw err;
  }

  return callerUid;
}
