import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createAttachmentSelection } from "../app/utils/attachmentSelection.js";

const fixtures = new Map();
const fixtureKey = Symbol.for("attachments.test.fixtures");
globalThis[fixtureKey] = fixtures;
let nextFixture = 0;
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;

async function loadAttachments(t, state = {}) {
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
  // Run the actual upload integration, substituting only external dependencies.
  return import(dataModule(source));
}

async function harness(
  t,
  { preserveOriginal = false, preserveOriginalAudio = false, signal, file, onComplete, reserveFileName } = {},
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
  const { createAttachmentFromFile, uploadAttachmentFile } = await loadAttachments(t, state);
  const uploadPromise = uploadAttachmentFile({
    signal,
    attachment: { ...createAttachmentFromFile(original, undefined, preserveOriginalAudio), clientKey: "attachment-test" },
    conversationId: "conversation-test",
    messageId: "message-test",
    reserveFileName,
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

test("mixed selections keep valid files in order and report each rejection by name", async (t) => {
  const { validateAttachmentFiles } = await loadAttachments(t);
  const photo = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
  const video = new File(["video"], "clip.mov", { type: "video/quicktime" });
  const song = new File(["song"], "audio.mp3", { type: "audio/mpeg" });
  const pdf = new File(["%PDF-1.7"], "letter.pdf", { type: "application/pdf" });
  const unreadable = new File(["%PDF-"], "offline.pdf", { type: "application/pdf" });
  t.mock.method(unreadable, "slice", () => { throw new Error("File unavailable"); });

  const result = await validateAttachmentFiles([
    photo, unreadable, video, new File(["%PDF-"], "unknown.pdf"), song,
    new File([], "empty.mp3", { type: "audio/mpeg" }), pdf,
  ]);
  assert.deepEqual(result.accepted, [
    { file: photo, mediaKind: "image" }, { file: video, mediaKind: "video" },
    { file: song, mediaKind: "audio", preserveOriginalAudio: true }, { file: pdf, mediaKind: "pdf" },
  ]);
  assert.equal(result.errors.length, 3);
  assert.match(result.errors[0], /^offline\.pdf: .*valid PDF/);
  assert.match(result.errors[1], /^unknown\.pdf: .*Only image, video, audio, and PDF/);
  assert.match(result.errors[2], /^empty\.mp3: .*empty/);
});

test("a large selection validates only the first ten and reports overflow once", async (t) => {
  const { validateAttachmentFiles } = await loadAttachments(t);
  const pdf = new File(["%PDF-"], "letter.pdf", { type: "application/pdf" });
  const reads = t.mock.method(pdf, "slice");
  const tenFiles = Array(10).fill(pdf);
  assert.deepEqual((await validateAttachmentFiles(tenFiles)).errors, []);
  assert.equal(reads.mock.callCount(), 10);

  let enumerated = 0;
  function* largeSelection() {
    for (let i = 0; i < 100000; i++) {
      enumerated++;
      yield pdf;
    }
  }
  const { accepted, errors } = await validateAttachmentFiles(largeSelection());
  assert.equal(accepted.length, 10);
  assert.equal(enumerated, 11);
  assert.equal(reads.mock.callCount(), 20);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /first 10 files.*remaining files separately/);
});

test("the composer queues and saves only supported files from a mixed selection", async (t) => {
  const paths = [];
  const { validateAttachmentFiles, createAttachmentFromFile, uploadAttachmentFile,
    getCompletedAttachmentFileNamesForSave } = await loadAttachments(t, {
    ref: (_storage, path) => path,
    uploadBytesResumable: (path) => ({
      on: (_event, _progress, _error, complete) => {
        paths.push(path);
        complete();
      },
    }),
  });
  const selection = createAttachmentSelection(validateAttachmentFiles);
  const queue = [];
  const uploads = [];
  let rejected;

  await selection.select([
    new File(["%PDF-1.7"], "letter.pdf", { type: "application/pdf" }),
    new File(["hello"], "message.txt", { type: "text/plain" }),
    new File(["sound"], "voice.m4a", { type: "audio/mp4" }),
    new File(["broken"], "bad.pdf", { type: "application/pdf" }),
  ], {
    onErrors: (errors) => { rejected = errors; },
    onAdd: ({ file, mediaKind, preserveOriginalAudio }) => {
      const attachment = createAttachmentFromFile(file, mediaKind, preserveOriginalAudio);
      queue.push(attachment);
      uploads.push(uploadAttachmentFile({
        attachment, conversationId: "chat", messageId: "draft",
        onUpdate: (_key, update) => Object.assign(attachment, update),
      }));
    },
  });
  await Promise.all(uploads);

  assert.deepEqual(rejected.map((error) => error.split(":")[0]), ["message.txt", "bad.pdf"]);
  assert.deepEqual(getCompletedAttachmentFileNamesForSave(queue), ["letter.pdf", "voice.m4a"]);
  assert.deepEqual(paths.sort(), ["letter.pdf", "voice.m4a"].map((name) =>
    `conversations/chat/messages/draft/${name}`));
});

test("PDF and selected audio enforce the 25 MiB boundary and PDF signature", async (t) => {
  const { validateAttachmentFiles } = await loadAttachments(t);
  const limit = 25 * 1024 * 1024;
  const audio = { name: "a.m4a", type: "audio/mp4", size: limit };
  const pdf = { name: "b.pdf", type: "application/pdf", size: limit, slice: () => new Blob(["%PDF-"]) };
  const { accepted, errors } = await validateAttachmentFiles([
    audio, { ...audio, size: limit + 1 }, pdf, { ...pdf, size: limit + 1 },
    new File(["Other content"], "fake.pdf", { type: "application/pdf" }),
  ]);
  assert.deepEqual(accepted.map(({ file }) => file), [audio, pdf]);
  assert.equal(errors.length, 3);
  assert.match(errors[0], /a\.m4a: .*25 MiB/);
  assert.match(errors[1], /b\.pdf: .*25 MiB/);
  assert.match(errors[2], /fake\.pdf: .*valid PDF/);
});

test("selected audio keeps its original bytes, filename and audio playback metadata", async (t) => {
  const voice = new File([new Uint8Array(600 * 1024)], "My song.m4a", { type: "audio/mp4" });
  const { validateAttachmentFiles } = await loadAttachments(t);
  const { accepted: [selected] } = await validateAttachmentFiles([voice]);
  const { observed, uploadPromise } = await harness(t, selected);
  assert.deepEqual(observed.sequence, ["upload"]);
  assert.equal(observed.uploads[0].file, voice);
  assert.deepEqual(observed.uploads[0].metadata, { contentType: "audio/mp4" });
  await observed.complete();
  await uploadPromise;
  assert.deepEqual(observed.completed, ["My_song.m4a"]);
  assert.equal(observed.updates.at(-1).mediaKind, "audio");
});

test("recorded audio keeps its compression path", async (t) => {
  const file = new File(["voice"], "voice.webm", { type: "audio/webm;codecs=opus" });
  const { observed, uploadPromise } = await harness(t, { file, preserveOriginal: true });
  assert.deepEqual(observed.sequence, ["compress", "upload"]);
  await observed.complete();
  await uploadPromise;
  assert.equal(observed.updates.at(-1).mediaKind, "audio");
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

test("two converted videos keep distinct storage and saved names alongside an existing attachment", async (t) => {
  const {
    getAvailableAttachmentFileName, getCachedAttachmentQueue, getCompletedAttachmentFileNamesForSave,
  } = await loadAttachments(t);
  const saved = getCachedAttachmentQueue({
    conversationId: "conversation-test", messageId: "message-test", fileNames: ["holiday.mp4"],
  });
  const inUse = new Set(saved.map((item) => item.fileName));
  const reserveFileName = (name) => {
    const available = getAvailableAttachmentFileName(name, (candidate) => inUse.has(candidate));
    inUse.add(available);
    return available;
  };

  const runs = await Promise.all([
    harness(t, { file: new File(["mov"], "holiday.mov", { type: "video/quicktime" }), reserveFileName }),
    harness(t, { file: new File(["webm"], "holiday.webm", { type: "video/webm" }), reserveFileName }),
  ]);
  const completed = [];
  for (const { observed, uploadPromise } of runs) {
    const [{ file, ref }] = observed.uploads;
    assert.equal(ref.fullPath, `conversations/conversation-test/messages/message-test/${file.name}`);
    assert.equal(observed.updates.find((item) => item.file)?.fileName, file.name);
    await observed.complete();
    await uploadPromise;
    assert.deepEqual(observed.completed, [file.name]);
    completed.push(observed.updates.at(-1));
  }
  assert.deepEqual(getCompletedAttachmentFileNamesForSave([...saved, ...completed]).sort(), [
    "holiday-2.mp4", "holiday-3.mp4", "holiday.mp4",
  ]);
});

test("removing an attachment during compression cannot reserve a filename or start an upload", async (t) => {
  const controller = new AbortController();
  const { createAttachmentFromFile, uploadAttachmentFile } = await loadAttachments(t, {
    compressMedia: async (_file, reportProgress, { signal }) => {
      assert.equal(signal, controller.signal);
      controller.abort();
      reportProgress(1);
      return new Blob(["compressed"], { type: "video/mp4" });
    },
  });
  const updates = [];
  await uploadAttachmentFile({
    attachment: createAttachmentFromFile(new File(["mov"], "clip.mov", { type: "video/quicktime" })),
    conversationId: "conversation-test",
    messageId: "message-test",
    signal: controller.signal,
    reserveFileName: () => assert.fail("Canceled file reserved a storage name"),
    onComplete: () => assert.fail("Canceled file completed"),
    onUpdate: (_key, update) => updates.push(update),
  });
  assert.deepEqual(updates, [{ status: "compressing", progress: 0 }]);
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
    progress: 50,
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
