/**
 * Recursive Firestore copy using BulkWriter with:
 * - top-level rename via args: <srcTop> <dstTop>
 * - nested subcollection renames via JSON map arg: '{"letters":"messages"}'
 *
 * DRY_RUN=true  → only logs (default)
 * DRY_RUN=false → actually writes
 *
 * Usage:
 *   DRY_RUN=true  node dry_run_migrate_collections.js <srcTop> <dstTop> [renameMapJson]
 *   DRY_RUN=false node dry_run_migrate_collections.js <srcTop> <dstTop> [renameMapJson]
 *
 * Optional:
 *   PAGE_SIZE=250 (default)
 */

import { db, FieldPath } from "../app/firebaseAdmin.js";

console.log("DRY_RUN env:", process.env.DRY_RUN);

const DRY_RUN = process.env.DRY_RUN !== "false";
const PAGE_SIZE = Number(process.env.PAGE_SIZE || 250);

const [,, srcTop, dstTop, renameMapJson] = process.argv;

if (!srcTop || !dstTop) {
  console.error("Usage: node dry_run_migrate_collections.js <srcTopCollection> <dstTopCollection> [renameMapJson]");
  console.error(`Example: node dry_run_migrate_collections.js letterbox inbox '{"letters":"messages"}'`);
  process.exit(1);
}

let SUBCOL_RENAMES = {};

if (renameMapJson) {
  try {
    const parsed = JSON.parse(renameMapJson);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      SUBCOL_RENAMES = parsed;
    } else {
      throw new Error("renameMapJson must be a JSON object like {'letters':'messages'}");
    }
  } catch (e) {
    console.error("Failed to parse renameMapJson. Provide valid JSON.");
    console.error(`Got: ${renameMapJson}`);
    console.error(`Example: '{"letters":"messages"}'`);
    console.error(e.message);
    process.exit(1);
  }
}

const stats = {
  pagesFetched: 0,
  docsVisited: 0,
  docsWritten: 0, // counts successful writes (commit mode only)
  docsQueued: 0,  // counts queued writes (commit mode only)
  docsFailed: 0,
  subcollectionsDescended: 0,
  subcollectionsRenamed: 0,
};

function mapSubcollectionId(srcId) {
  const mapped = SUBCOL_RENAMES[srcId];
  if (mapped && mapped !== srcId) stats.subcollectionsRenamed++;
  return mapped || srcId;
}

/**
 * Copy a collection recursively.
 * Note: writes are queued to BulkWriter; we await writer.flush() per page
 * to limit memory and to get earlier error signals.
 */
async function copyCollectionRecursive(srcColRef, dstColRef, writer) {
  let lastDoc = null;

  while (true) {
    let q = srcColRef.orderBy(FieldPath.documentId()).limit(PAGE_SIZE);
    if (lastDoc) q = q.startAfter(lastDoc);

    const snap = await q.get();
    stats.pagesFetched++;

    if (snap.empty) break;

    for (const docSnap of snap.docs) {
      stats.docsVisited++;

      const srcDocRef = docSnap.ref;
      const dstDocRef = dstColRef.doc(docSnap.id);

      if (DRY_RUN) {
        console.log(`DRY RUN → COPY DOC: ${srcDocRef.path} -> ${dstDocRef.path}`);
      } else {
        // Queue the write (do NOT await per document)
        stats.docsQueued++;
        writer.set(dstDocRef, docSnap.data(), { merge: false });
      }

      // Recurse into subcollections
      const subcols = await srcDocRef.listCollections();
      for (const subcol of subcols) {
        stats.subcollectionsDescended++;

        const mappedId = mapSubcollectionId(subcol.id);
        const dstSubcolRef = dstDocRef.collection(mappedId);

        console.log(
          (DRY_RUN ? "DRY RUN → " : "") +
          `DESCEND: ${subcol.path} -> ${dstSubcolRef.path}` +
          (mappedId !== subcol.id ? `  (renamed ${subcol.id} -> ${mappedId})` : "")
        );

        await copyCollectionRecursive(subcol, dstSubcolRef, writer);
      }
    }

    lastDoc = snap.docs[snap.docs.length - 1];

    // In commit mode, flush per page to:
    // - bound memory
    // - surface failures earlier (rather than only at the very end)
    if (!DRY_RUN) {
      await writer.flush();
    }
  }
}

(async () => {
  console.log(DRY_RUN ? "=== DRY RUN (no writes) ===" : "=== COMMIT MODE (writes enabled) ===");
  console.log(`Top-level: ${srcTop} -> ${dstTop}`);
  console.log(`Rename map: ${JSON.stringify(SUBCOL_RENAMES)}`);
  console.log(`Page size: ${PAGE_SIZE}\n`);

  let writer = null;

  if (!DRY_RUN) {
    writer = db.bulkWriter();

    // Track per-write success/failure
    writer.onWriteResult((documentRef, result) => {
      stats.docsWritten++;
      // Uncomment if you want a log for each successful write:
      // console.log(`WROTE: ${documentRef.path} @ ${result.writeTime.toDate().toISOString()}`);
    });

    writer.onWriteError((error) => {
      stats.docsFailed++;
      console.error(`WRITE FAILED: ${error.documentRef?.path || "(unknown)"}:`, error.message);

      // Retry transient errors automatically (BulkWriter will also do some retrying,
      // but this gives you control). You can adjust this logic.
      // Common transient codes: 4=DEADLINE_EXCEEDED, 8=RESOURCE_EXHAUSTED, 10=ABORTED, 14=UNAVAILABLE
      const code = error.code;
      const attempts = error.failedAttempts ?? 0;
      const isTransient = code === 4 || code === 8 || code === 10 || code === 14;

      if (isTransient && attempts < 10) {
        return true; // retry
      }

      return false; // give up
    });
  }

  await copyCollectionRecursive(db.collection(srcTop), db.collection(dstTop), writer);

  if (!DRY_RUN) {
    // Ensure all queued writes finish
    await writer.close();
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Pages fetched:              ${stats.pagesFetched}`);
  console.log(`Docs visited:               ${stats.docsVisited}`);
  console.log(`Docs queued:                ${stats.docsQueued} ${DRY_RUN ? "(dry run)" : ""}`);
  console.log(`Docs written (success):     ${stats.docsWritten} ${DRY_RUN ? "(dry run)" : ""}`);
  console.log(`Docs failed:                ${stats.docsFailed} ${DRY_RUN ? "(dry run)" : ""}`);
  console.log(`Subcollections descended:   ${stats.subcollectionsDescended}`);
  console.log(`Subcollections renamed:     ${stats.subcollectionsRenamed}`);
  console.log("Done.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});