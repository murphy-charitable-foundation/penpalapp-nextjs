//how to ensure that its dry run?

/**
 * Reusable recursive Firestore copy with:
 * - top-level rename via args: <srcTop> <dstTop>
 * - nested subcollection renames via JSON map arg: '{"letters":"messages"}'
 *
 * DRY_RUN=true  → only logs (default)
 * DRY_RUN=false → actually writes
 *
 * Usage:
 *   node dry_run_migrate_collections.js <srcTop> <dstTop> [renameMapJson]
 */
import { db, FieldPath } from "../app/firebaseAdmin.js"

console.log(process.env.DRY_RUN)

const DRY_RUN = process.env.DRY_RUN !== "false";
//means get max 250 docs per query at a time
const PAGE_SIZE = Number(process.env.PAGE_SIZE || 250);

//array destructuring to get command line args
const [,, srcTop, dstTop, renameMapJson] = process.argv;

if (!srcTop || !dstTop) {
  console.error("Usage: node copyRecursive.js <srcTopCollection> <dstTopCollection> [renameMapJson]");
  console.error(`Example: node copyRecursive.js letterbox inbox '{"letters":"messages"}'`);
  process.exit(1);
}

let SUBCOL_RENAMES = {};

//convert string that was recieved in the args to json object
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
  docsWritten: 0,
  subcollectionsDescended: 0,
  subcollectionsRenamed: 0,
};

//this returns what the new subcollection id should be named
function mapSubcollectionId(srcId) {
  const mapped = SUBCOL_RENAMES[srcId];
  if (mapped && mapped !== srcId) stats.subcollectionsRenamed++;
  return mapped || srcId;
}

// this is the main recursive function
async function copyCollectionRecursive(srcColRef, dstColRef) {
  let lastDoc = null;

  while (true) {
    let q = srcColRef
      .orderBy(FieldPath.documentId())
      .limit(PAGE_SIZE);

    if (lastDoc) q = q.startAfter(lastDoc);

    const snap = await q.get();
    stats.pagesFetched++;

    if (snap.empty) break;

    for (const docSnap of snap.docs) {
      stats.docsVisited++;

      //define source doc ref as the referenece for current iteration of docsSnap
      const srcDocRef = docSnap.ref;
      //create a document in the destination collection with the same id as the source document
   
      const dstDocRef = dstColRef.doc(docSnap.id);

      if (DRY_RUN) {
        console.log(`DRY RUN → COPY DOC: ${srcDocRef.path} -> ${dstDocRef.path}`);
      } else {
        await dstDocRef.set(docSnap.data(), { merge: false });
        stats.docsWritten++;
        console.log(`COPIED DOC: ${srcDocRef.path} -> ${dstDocRef.path}`);
      }

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

        await copyCollectionRecursive(subcol, dstSubcolRef);
      }
    }

    lastDoc = snap.docs[snap.docs.length - 1];
  }
}

(async () => {
  console.log(DRY_RUN ? "=== DRY RUN (no writes) ===" : "=== COMMIT MODE (writes enabled) ===");
  console.log(`Top-level: ${srcTop} -> ${dstTop}`);
  console.log(`Rename map: ${JSON.stringify(SUBCOL_RENAMES)}`);
  console.log(`Page size: ${PAGE_SIZE}\n`);

  //all docs are written into a collection called dstTop bc a collection is created 
  //when a document is created inside it
  
  await copyCollectionRecursive(db.collection(srcTop), db.collection(dstTop));

  console.log("\n=== SUMMARY ===");
  console.log(`Pages fetched:              ${stats.pagesFetched}`);
  console.log(`Docs visited:               ${stats.docsVisited}`);
  console.log(`Docs written:               ${stats.docsWritten} ${DRY_RUN ? "(dry run)" : ""}`);
  console.log(`Subcollections descended:   ${stats.subcollectionsDescended}`);
  console.log(`Subcollections renamed:     ${stats.subcollectionsRenamed}`);
  console.log("Done.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

