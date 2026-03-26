// import dotenv from "dotenv";
// console.log("CWD:", process.cwd())
// const result = dotenv.config({path: ".env.local"})
// console.log("dotenv loaded", "result.error?", result.error ? result.error : "ok")

import { db } from "../app/firebaseAdmin.js"


// const admin = require("../app/firebaseAdmin.js");

async function main() {
  // Confirm which project you’re connected to
  console.log("Project:", db.projectId);

  // Pick ANY existing document path in your database:
  // Example: "users/user123" or "orgs/org1/users/user123"
  // const docPath = "letterbox/0S7ynkiTRCH3PHnxJmL4"; // <-- change this
  const docPath = "letterbox/8PIPjrZJwzxkFCmZFaoh/letters/AIFcmJRGW9v4nfxAVYtU" // <-- change this
  //needs to be a full path in order for it to find that path
  const docRef = db.doc(docPath);

  const snap = await docRef.get();
  if (!snap.exists) {
    console.log("Doc does not exist:", docRef.path);
    process.exit(0);
  }

  const subcols = await docRef.listCollections();
  console.log(`Found ${subcols.length} subcollections under ${docRef.path}:`);
  for (const c of subcols) {
    console.log(" -", c.id, `(path: ${c.path})`);
  }
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});