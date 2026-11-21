import { NextResponse } from "next/server";
import { auth } from "../../firebaseAdmin";
import { requireAdmin } from "../../utils/requireAdmin";
import { logError } from "../../utils/analytics";

export async function POST(request) {
  try {
    await requireAdmin(request);

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const userRecord = await auth.getUserByEmail(email);
    return NextResponse.json({ uid: userRecord.uid });
  } catch (error) {
    logError("Error fetching UID: " + error.message, { error });
    if (error?.status && error.message) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error.code === "auth/argument-error" || error.message?.includes("Decoding")) {
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
    }
    if (error.code === "auth/user-not-found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
