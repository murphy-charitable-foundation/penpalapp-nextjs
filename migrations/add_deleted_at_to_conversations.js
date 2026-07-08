/**
 * Sets `deleted_at: null` to top-level `conversations` documents that are
 * missing the field.
 *
 * DRY_RUN=true  -> only logs (default)
 * DRY_RUN=false -> writes updates
 *
 * Usage:
 *   export FIREBASE_SERVICE_ACCOUNT_JSON_DEV='{"type":"service_account",...}'
 *
 *   DRY_RUN=true  node migrations/add_deleted_at_to_conversations.js
 *   DRY_RUN=false node migrations/add_deleted_at_to_conversations.js
 *
 * Optional:
 *   PAGE_SIZE=250 (default)
 */

import { getOrInitApp, FieldPath } from "../app/firebaseAdmin.js";

const DRY_RUN = process.env.DRY_RUN !== "false";
const PAGE_SIZE = Number(process.env.PAGE_SIZE || 250);
const COLLECTION_NAME = "conversations";

const devApp = getOrInitApp("penpalmagicapp-dev", "FIREBASE_SERVICE_ACCOUNT_JSON_DEV");

if (!devApp) {
  console.error("Dev Firebase app not initialized. Check FIREBASE_SERVICE_ACCOUNT_JSON_DEV.");
  process.exit(1);
}

const devDb = devApp.firestore();

if (!devDb) {
  console.error("Firestore database not initialized. Check your Firebase environment variables.");
  process.exit(1);
}

const stats = {
  pagesFetched: 0,
  docsVisited: 0,
  docsMissingDeletedAt: 0,
  docsQueued: 0,
  docsWritten: 0,
  docsFailed: 0,
};

async function addDeletedAtToConversations() {
  let writer = null;

  if (!DRY_RUN) {
    writer = devDb.bulkWriter();

    writer.onWriteResult(() => {
      stats.docsWritten++;
    });

    writer.onWriteError((error) => {
      stats.docsFailed++;
      console.error(`WRITE FAILED: ${error.documentRef?.path || "(unknown)"}:`, error.message);

      const code = error.code;
      const attempts = error.failedAttempts ?? 0;
      const isTransient = code === 4 || code === 8 || code === 10 || code === 14;

      return isTransient && attempts < 10;
    });
  }

  let lastDoc = null;
  const conversationsRef = devDb.collection(COLLECTION_NAME);

  while (true) {
    let conversationsQuery = conversationsRef
      .orderBy(FieldPath.documentId())
      .limit(PAGE_SIZE);

    if (lastDoc) {
      conversationsQuery = conversationsQuery.startAfter(lastDoc);
    }

    const snapshot = await conversationsQuery.get();
    stats.pagesFetched++;

    if (snapshot.empty) break;

    for (const docSnap of snapshot.docs) {
      stats.docsVisited++;

      const data = docSnap.data();
      if (Object.prototype.hasOwnProperty.call(data, "deleted_at")) {
        continue;
      }

      stats.docsMissingDeletedAt++;

      if (DRY_RUN) {
        console.log(`DRY RUN -> UPDATE ${docSnap.ref.path}: set deleted_at=null`);
      } else {
        stats.docsQueued++;
        writer.update(docSnap.ref, { deleted_at: null });
      }
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    if (!DRY_RUN) {
      await writer.flush();
    }
  }

  if (!DRY_RUN) {
    await writer.close();
  }
}

(async () => {
  console.log(DRY_RUN ? "=== DRY RUN (no writes) ===" : "=== COMMIT MODE (writes enabled) ===");
  console.log(`Collection: ${COLLECTION_NAME}`);
  console.log(`Page size: ${PAGE_SIZE}\n`);

  await addDeletedAtToConversations();

  console.log("\n=== SUMMARY ===");
  console.log(`Pages fetched:              ${stats.pagesFetched}`);
  console.log(`Docs visited:               ${stats.docsVisited}`);
  console.log(`Docs missing deleted_at:    ${stats.docsMissingDeletedAt}`);
  console.log(`Docs queued:                ${stats.docsQueued} ${DRY_RUN ? "(dry run)" : ""}`);
  console.log(`Docs written (success):     ${stats.docsWritten} ${DRY_RUN ? "(dry run)" : ""}`);
  console.log(`Docs failed:                ${stats.docsFailed}`);
  console.log("Done.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
