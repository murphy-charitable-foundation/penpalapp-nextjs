import { auth, db } from "../firebaseAdmin";

export async function requireAdmin(req) {
  // Verify admin authorization
  const authHeader = req.headers?.authorization ||
  (typeof req.headers?.get === "function" ? req.headers.get("authorization") : undefined);

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
    const e = new Error("Invalid or expired token");
    e.status = 401;
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
