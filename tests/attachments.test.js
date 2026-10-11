import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const fixtures = new Map();
const fixtureKey = Symbol.for("attachments.test.fixtures");
globalThis[fixtureKey] = fixtures;
let nextFixture = 0;
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;

async function harness(t, diagnostics = false) {
  const previous = process.env.NEXT_PUBLIC_VIDEO_UPLOAD_DIAGNOSTICS;
  if (diagnostics) process.env.NEXT_PUBLIC_VIDEO_UPLOAD_DIAGNOSTICS = "true";
  else delete process.env.NEXT_PUBLIC_VIDEO_UPLOAD_DIAGNOSTICS;
  t.after(() => {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_VIDEO_UPLOAD_DIAGNOSTICS;
    else process.env.NEXT_PUBLIC_VIDEO_UPLOAD_DIAGNOSTICS = previous;
  });

  const original = new File([new Uint8Array(100)], "portrait.mov", { type: "video/quicktime" });
  const compressed = new Blob([new Uint8Array(20)], { type: "video/mp4" });
  const observed = { snapshots: [], uploads: [], updates: [], completed: [], sequence: [] };
  const id = nextFixture++;
  const state = {
    ref: (_storage, fullPath) => ({ fullPath }),
    uploadBytes: async (ref, blob, metadata) => {
      observed.snapshots.push({ ref, blob, metadata });
      observed.sequence.push(metadata.customMetadata.stage);
    },
    uploadBytesResumable: (ref, file, metadata) => {
      observed.uploads.push({ ref, file, metadata });
      observed.sequence.push("canonical");
      return {
        on: (event, progress, error, complete) => {
          assert.equal(event, "state_changed");
          observed.progress = progress;
          observed.complete = complete;
        },
      };
    },
    compressMedia: async (file, progress, options, stage) => {
      assert.equal(file, original);
      assert.deepEqual(options, {});
      observed.sequence.push("compress");
      progress(0);
      progress(0.5);
      progress(1);
      stage?.({ stage: "compression-output", blob: compressed, outcome: "recorded" });
      return compressed;
    },
  };
  fixtures.set(id, state);
  t.after(() => fixtures.delete(id));
  const fixture = `const fixture = globalThis[Symbol.for("attachments.test.fixtures")].get(${id});`;
  const dependencies = {
    "@firebase/storage": dataModule(`${fixture}
      export const ref = fixture.ref;
      export const uploadBytes = fixture.uploadBytes;
      export const uploadBytesResumable = fixture.uploadBytesResumable;
      const unexpected = () => { throw new Error("Unexpected Firebase operation"); };
      export { unexpected as deleteObject, unexpected as getDownloadURL, unexpected as getMetadata };
    `),
    "../firebaseConfig": dataModule("export const storage = {};"),
    "./compressMedia": dataModule(`${fixture} export const compressMedia = fixture.compressMedia;`),
  };
  let source = await readFile(new URL("../app/utils/attachments.js", import.meta.url), "utf8");
  for (const [specifier, replacement] of Object.entries(dependencies)) {
    const target = `from ${JSON.stringify(specifier)}`;
    assert(source.includes(target), `Expected dependency ${specifier}`);
    source = source.replace(target, `from ${JSON.stringify(replacement)}`);
  }
  // Run the actual upload integration, substituting only external dependencies.
  const { uploadAttachmentFile } = await import(dataModule(source));
  await uploadAttachmentFile({
    attachment: { clientKey: "attachment-test", file: original, fileName: original.name },
    conversationId: "conversation-test",
    messageId: "message-test",
    onUpdate: (key, update) => {
      assert.equal(key, "attachment-test");
      observed.updates.push(update);
    },
    onComplete: (name) => observed.completed.push(name),
  });
  return { original, compressed, observed };
}

test("video uploads send only the canonical MP4 by default and complete normally", async (t) => {
  const { compressed, observed } = await harness(t);
  assert.equal(observed.uploads.length, 1);
  assert.deepEqual(observed.snapshots, []);
  assert.deepEqual(observed.sequence, ["compress", "canonical"]);
  const [{ ref, file, metadata }] = observed.uploads;
  assert.equal(ref.fullPath, "conversations/conversation-test/messages/message-test/portrait.mp4");
  assert.equal(file.name, "portrait.mp4");
  assert.equal(file.type, "video/mp4");
  assert.deepEqual(await file.arrayBuffer(), await compressed.arrayBuffer());
  assert.deepEqual(metadata, { contentType: "video/mp4" });
  assert(observed.updates.some((update) => update.status === "compressing" && update.progress === 40));
  observed.progress({ bytesTransferred: 10, totalBytes: 20 });
  assert.deepEqual(observed.updates.at(-1), { progress: 70, status: "uploading" });
  await observed.complete();
  assert.deepEqual(observed.completed, ["portrait.mp4"]);
  assert.equal(observed.updates.at(-1).status, "done");
  assert.equal(observed.updates.at(-1).progress, 100);
  assert.deepEqual(observed.snapshots, []);
});

test("explicit video diagnostics retain raw, compressed, and uploaded snapshots", async (t) => {
  const { original, compressed, observed } = await harness(t, true);
  assert.equal(observed.uploads.length, 1);
  assert.deepEqual(observed.sequence, ["raw", "compress", "compressed", "canonical"]);
  await observed.complete();
  assert.deepEqual(observed.sequence, ["raw", "compress", "compressed", "canonical", "uploaded"]);
  assert.deepEqual(observed.snapshots.map(({ ref }) => ref.fullPath.split("/").at(-1)),
    ["portrait_raw.mov", "portrait_compressed.mp4", "portrait_uploaded.mp4"]);
  assert.equal(observed.snapshots[0].blob, original);
  assert.equal(observed.snapshots[1].blob, compressed);
  assert.equal(observed.snapshots[2].blob, observed.uploads[0].file);
  assert.deepEqual(observed.snapshots.map(({ metadata }) => metadata.customMetadata), [
    { videoUploadDiagnostic: "true", stage: "raw", outcome: "before-compression" },
    { videoUploadDiagnostic: "true", stage: "compressed", outcome: "recorded" },
    { videoUploadDiagnostic: "true", stage: "uploaded", outcome: "canonical-upload-completed" },
  ]);
  assert.deepEqual(observed.completed, ["portrait.mp4"]);
});
