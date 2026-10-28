import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const fixtures = new Map();
const fixtureKey = Symbol.for("attachments.test.fixtures");
globalThis[fixtureKey] = fixtures;
let nextFixture = 0;
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;

async function harness(t, { preserveOriginal = false, signal, file } = {}) {
  const original =
    file ??
    new File([new Uint8Array(100)], "portrait.mov", {
      type: "video/quicktime",
    });
  const compressed = new Blob([new Uint8Array(20)], { type: "video/mp4" });
  const observed = { uploads: [], updates: [], completed: [], sequence: [] };
  const id = nextFixture++;
  const state = {
    ref: (_storage, fullPath) => ({ fullPath }),
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
  fixtures.set(id, state);
  t.after(() => fixtures.delete(id));
  const fixture = `const fixture = globalThis[Symbol.for("attachments.test.fixtures")].get(${id});`;
  const dependencies = {
    "@firebase/storage": dataModule(`${fixture}
      export const ref = fixture.ref;
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
  const uploadPromise = uploadAttachmentFile({
    signal,
    attachment: { clientKey: "attachment-test", file: original, fileName: original.name },
    conversationId: "conversation-test",
    messageId: "message-test",
    onUpdate: (key, update) => {
      assert.equal(key, "attachment-test");
      observed.updates.push(update);
    },
    onComplete: (name) => observed.completed.push(name),
  });
  await new Promise((resolve) => setImmediate(resolve));
  return { original, compressed, observed, uploadPromise };
}

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
