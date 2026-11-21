import { NextResponse } from "next/server";
import { auth, db } from "../../firebaseAdmin";
import { logError } from "../../utils/analytics";
import { requireAdmin } from "../../utils/requireAdmin";

export async function POST(request) {
  try {
    await requireAdmin(request);

    const { email, password, userData } = await request.json();

    if (!email || !password || !userData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Create the Firebase Authentication user
    const userRecord = await auth.createUser({
      email,
      password,
    });

    const uid = userRecord.uid;

    // Allowlist permitted fields to prevent arbitrary data injection
    const allowedFields = ["first_name", "last_name", "user_type", "country", "village", "bio", "education_level", "is_orphan", "guardian", "dream_job", "hobbies", "favorite_color", "favorite_animal", "pronouns", "birthday", "connected_penpals", "connected_penpals_count"];
    const sanitizedData = Object.fromEntries(
      Object.entries(userData).filter(([key]) => allowedFields.includes(key))
    );

    // Ensure user_type is always "child"
    sanitizedData.user_type = "child";

    // Save Firestore user document; roll back auth user on failure
    try {
      sanitizedData.created_at = new Date();
      await db.collection("users").doc(uid).set(sanitizedData);
    } catch (firestoreError) {
      await auth.deleteUser(uid).catch(() => {}); // best-effort cleanup
      throw firestoreError;
    }

    return NextResponse.json({ uid });
  } catch (error) {
    logError(error, { description: "Failed to create user via admin API" });
    if (error?.status && error.message) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error.code === "auth/argument-error" || error.message?.includes("Decoding")) {
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
