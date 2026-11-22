import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const fixtures = new Map();
const fixtureKey = Symbol.for("attachments.test.fixtures");
globalThis[fixtureKey] = fixtures;
let nextFixture = 0;
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;

async function loadAttachments(t, state) {
  const id = nextFixture++;
  fixtures.set(id, state);
  t.after(() => fixtures.delete(id));
  const fixture = `const fixture = globalThis[Symbol.for("attachments.test.fixtures")].get(${id});`;
  const dependencies = {
    "@firebase/storage": dataModule(`${fixture}
      export const ref = fixture.ref;
      export const deleteObject = fixture.deleteObject;
      export const uploadBytesResumable = fixture.uploadBytesResumable;
      const unexpected = () => { throw new Error("Unexpected Firebase operation"); };
      export { unexpected as getDownloadURL, unexpected as getMetadata };
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
  return import(dataModule(source));
}

async function harness(
  t,
  { preserveOriginal = false, signal, file, onComplete } = {},
) {
  const original =
    file ??
    new File([new Uint8Array(100)], "portrait.mov", {
      type: "video/quicktime",
    });
  const compressed = new Blob([new Uint8Array(20)], { type: "video/mp4" });
  const observed = {
    uploads: [],
    updates: [],
    completed: [],
    deletions: [],
    sequence: [],
  };
  const state = {
    ref: (_storage, fullPath) => ({ fullPath }),
    deleteObject: async (ref) => {
      observed.deletions.push(ref.fullPath);
    },
    uploadBytesResumable: (ref, file, metadata) => {
      observed.uploads.push({ ref, file, metadata });
      observed.sequence.push("upload");
      return {
        cancel: () => {
          observed.canceled = true;
          return true;
        },
        on: (event, progress, error, complete) => {
          assert.equal(event, "state_changed");
          observed.progress = progress;
          observed.error = error;
          observed.complete = complete;
        },
      };
    },
    compressMedia: async (file, progress) => {
      assert.equal(file, original);
      observed.sequence.push("compress");
      progress(0);
      progress(0.5);
      progress(1);
      return preserveOriginal ? original : compressed;
    },
  };
  // Run the actual upload integration, substituting only external dependencies.
  const { uploadAttachmentFile } = await loadAttachments(t, state);
  const uploadPromise = uploadAttachmentFile({
    signal,
    attachment: { clientKey: "attachment-test", file: original, fileName: original.name },
    conversationId: "conversation-test",
    messageId: "message-test",
    onUpdate: (key, update) => {
      assert.equal(key, "attachment-test");
      observed.updates.push(update);
    },
    onComplete: (name) => {
      observed.completed.push(name);
      return onComplete?.(name);
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  return { original, compressed, observed, uploadPromise };
}

test("dropped attachments use the picker type and PDF safety checks", async (t) => {
  const { validatePickedAttachment, MAX_PDF_SIZE_BYTES } = await loadAttachments(t, {});
  const file = (contents, name, type) => new File([contents], name, { type });

  assert.deepEqual(await validatePickedAttachment(file("image", "photo.jpg", "image/jpeg")), { mediaKind: "image" });
  assert.deepEqual(await validatePickedAttachment(file("video", "clip.mov", "video/quicktime")), { mediaKind: "video" });
  assert.deepEqual(await validatePickedAttachment(file("audio", "voice.webm", "audio/webm")), { mediaKind: "audio" });
  assert.deepEqual(await validatePickedAttachment(file("audio", "voice.m4a", "audio/x-m4a")), { mediaKind: "audio" });
  assert.deepEqual(await validatePickedAttachment(file("%PDF-1.7", "letter.pdf", "application/pdf")), { mediaKind: "pdf" });
  assert.deepEqual(
    await validatePickedAttachment({
      type: "application/pdf",
      size: MAX_PDF_SIZE_BYTES,
      slice: () => new Blob(["%PDF-"]),
    }),
    { mediaKind: "pdf" },
  );
  assert.match((await validatePickedAttachment(file("not a PDF", "letter.pdf", "application/pdf"))).error, /valid PDF/);
  assert.match((await validatePickedAttachment({ type: "application/pdf", size: MAX_PDF_SIZE_BYTES + 1 })).error, /25 MB/);
  assert.match((await validatePickedAttachment(file("%PDF-1.7", "letter.pdf", ""))).error, /Only image, video, audio, and PDF/);
  assert.match((await validatePickedAttachment(file("text", "voice.m4a", "text/plain"))).error, /Only image, video, audio, and PDF/);
});

test("dropped M4A files with missing or generic MIME types are normalized for upload", async (t) => {
  const { validatePickedAttachment } = await loadAttachments(t, {});
  for (const type of ["", "application/octet-stream"]) {
    const original = new File(["audio"], "Voice.M4A", { type, lastModified: 123 });
    const result = await validatePickedAttachment(original);
    assert.equal(result.mediaKind, "audio");
    assert.equal(result.file.name, original.name);
    assert.equal(result.file.type, "audio/mp4");
    assert.equal(result.file.lastModified, original.lastModified);
    assert.equal(await result.file.text(), await original.text());
  }
});

test("file drops reject directories and unreadable entries without losing valid files", async (t) => {
  const { getDroppedAttachmentFiles, isFileDrag } = await loadAttachments(t, {});
  const file = new File(["photo"], "photo.png", { type: "image/png" });
  const transfer = {
    types: ["Files"],
    items: [
      { kind: "file", webkitGetAsEntry: () => ({ isDirectory: true }), getAsFile: () => file },
      { kind: "file", getAsFile: () => null },
      { kind: "file", getAsFile: () => file },
      { kind: "string" },
    ],
  };
  assert.equal(isFileDrag(transfer), true);
  assert.equal(isFileDrag({ types: ["text/plain"] }), false);
  assert.deepEqual(getDroppedAttachmentFiles(transfer), { files: [file], rejected: true });
  assert.deepEqual(getDroppedAttachmentFiles({ files: [file] }), { files: [file], rejected: false });
});

test("mixed file drops queue valid attachments and report each rejection", async (t) => {
  const {
    createAttachmentFromFile,
    getDroppedAttachmentFiles,
    queueValidatedAttachments,
    validatePickedAttachment,
  } = await loadAttachments(t, {});
  const image = new File(["image"], "photo.png", { type: "image/png" });
  const unsupported = new File(["text"], "notes.txt", { type: "text/plain" });
  const audio = new File(["audio"], "voice.m4a");
  const invalidPdf = new File(["not a PDF"], "invalid.pdf", { type: "application/pdf" });
  const transfer = {
    types: ["Files"],
    items: [
      ...[image, unsupported, audio, invalidPdf].map((file) => ({
        kind: "file",
        getAsFile: () => file,
      })),
      { kind: "file", webkitGetAsEntry: () => ({ isDirectory: true }) },
      { kind: "file", getAsFile: () => null },
    ],
  };
  const { files, rejected } = getDroppedAttachmentFiles(transfer);
  const results = await Promise.all(files.map(validatePickedAttachment));
  const queue = [];
  const errors = queueValidatedAttachments(files, results, rejected, ({ file, mediaKind }) => {
    queue.push(createAttachmentFromFile(file, mediaKind));
  });

  assert.deepEqual(queue.map(({ fileName, mediaKind, status }) => ({ fileName, mediaKind, status })), [
    { fileName: "photo.png", mediaKind: "image", status: "pending" },
    { fileName: "voice.m4a", mediaKind: "audio", status: "pending" },
  ]);
  assert.equal(queue[1].file.type, "audio/mp4");
  assert.deepEqual(errors, [
    "Folders and unreadable files cannot be attached.",
    "notes.txt: Only image, video, audio, and PDF files can be attached.",
    "invalid.pdf: Please select a valid PDF file.",
  ]);
});

test("compressed video uploads send one MP4 and complete normally", async (t) => {
  const { compressed, observed, uploadPromise } = await harness(t);
  assert.equal(observed.uploads.length, 1);
  assert.deepEqual(observed.sequence, ["compress", "upload"]);
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
  await uploadPromise;
  assert.deepEqual(observed.completed, ["portrait.mp4"]);
  assert.equal(observed.updates.at(-1).status, "done");
  assert.equal(observed.updates.at(-1).progress, 100);
  assert.equal(observed.uploads.length, 1);
});

test("skipped video compression uploads the original MOV and completes normally", async (t) => {
  const { original, observed, uploadPromise } = await harness(t, { preserveOriginal: true });
  assert.equal(observed.uploads.length, 1);
  assert.deepEqual(observed.sequence, ["compress", "upload"]);
  const [{ ref, file, metadata }] = observed.uploads;
  assert.equal(ref.fullPath, "conversations/conversation-test/messages/message-test/portrait.mov");
  assert.deepEqual(await file.arrayBuffer(), await original.arrayBuffer());
  assert.equal(file.name, "portrait.mov");
  assert.equal(file.type, "video/quicktime");
  assert.deepEqual(metadata, { contentType: "video/quicktime" });
  observed.progress({ bytesTransferred: 50, totalBytes: 100 });
  assert.deepEqual(observed.updates.at(-1), { progress: 70, status: "uploading" });
  await observed.complete();
  await uploadPromise;
  assert.deepEqual(observed.completed, ["portrait.mov"]);
  assert.equal(observed.updates.at(-1).status, "done");
  assert.equal(observed.updates.at(-1).progress, 100);
  assert.equal(observed.uploads.length, 1);
});

test("dropped M4A with no MIME type uploads as audio", async (t) => {
  const { validatePickedAttachment } = await loadAttachments(t, {});
  const original = new File(["audio"], "voice.m4a");
  const { file } = await validatePickedAttachment(original);
  const { observed, uploadPromise } = await harness(t, { file, preserveOriginal: true });

  assert.equal(observed.uploads.length, 1);
  assert.equal(observed.uploads[0].file.name, "voice.m4a");
  assert.deepEqual(observed.uploads[0].metadata, { contentType: "audio/mp4" });
  await observed.complete();
  await uploadPromise;
  assert.deepEqual(observed.completed, ["voice.m4a"]);
  assert.equal(observed.updates.at(-1).mediaKind, "audio");
  assert.equal(observed.updates.at(-1).status, "done");
});

test("PDF uploads bypass compression and preserve PDF metadata", async (t) => {
  const pdf = new File(
    [new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])],
    "letter.pdf",
    { type: "application/pdf" },
  );
  const { observed, uploadPromise } = await harness(t, { file: pdf });

  assert.equal(observed.uploads.length, 1);
  assert.deepEqual(observed.sequence, ["upload"]);
  const [{ ref, file, metadata }] = observed.uploads;
  assert.equal(
    ref.fullPath,
    "conversations/conversation-test/messages/message-test/letter.pdf",
  );
  assert.equal(file, pdf);
  assert.deepEqual(metadata, { contentType: "application/pdf" });

  observed.progress({ bytesTransferred: 4, totalBytes: 8 });
  assert.deepEqual(observed.updates.at(-1), {
    progress: 70,
    status: "uploading",
  });
  await observed.complete();
  await uploadPromise;

  assert.deepEqual(observed.completed, ["letter.pdf"]);
  assert.equal(observed.updates.at(-1).status, "done");
  assert.equal(observed.updates.at(-1).mediaKind, "pdf");
});

test("canceling an upload calls Firebase cancel", async (t) => {
  const controller = new AbortController();

  const { observed, uploadPromise } = await harness(t, {
    signal: controller.signal,
  });

  controller.abort();

  assert.equal(observed.canceled, true);

  // Simulate Firebase reporting that the upload was canceled.
  observed.error({ code: "storage/canceled" });

  await uploadPromise;

  assert.deepEqual(observed.completed, []);
});

test("canceling while completion is pending deletes the uploaded attachment", async (t) => {
  const controller = new AbortController();
  let finishCompletion;
  const completion = new Promise((resolve) => {
    finishCompletion = resolve;
  });
  const { observed, uploadPromise } = await harness(t, {
    signal: controller.signal,
    onComplete: () => completion,
  });

  const completionPromise = observed.complete();
  await new Promise((resolve) => setImmediate(resolve));
  controller.abort();
  assert.equal(observed.canceled, true);

  finishCompletion();
  await completionPromise;
  await uploadPromise;

  assert.deepEqual(observed.deletions, [
    "conversations/conversation-test/messages/message-test/portrait.mp4",
  ]);
});
