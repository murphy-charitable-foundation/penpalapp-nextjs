import assert from "node:assert/strict";
import test from "node:test";
import { createAttachmentUploadQueue } from "../app/utils/attachmentUploadQueue.js";

test("uploads share two slots across batches and skip canceled files", async () => {
  const enqueue = createAttachmentUploadQueue();
  const started = [];
  const controls = new Map();

  const add = (name, controller = new AbortController()) => enqueue(() => {
    started.push(name);
    return new Promise((resolve, reject) => controls.set(name, { resolve, reject }));
  }, controller.signal);

  const first = add("movie");
  const second = add("photo");
  const removed = new AbortController();
  const third = add("removed", removed);
  const fourth = add("recording");
  const fifth = add("pdf");
  removed.abort();
  assert.deepEqual(started, ["movie", "photo"]);

  controls.get("photo").reject(new Error("upload failed"));
  await assert.rejects(second, /upload failed/);
  await third;
  assert.deepEqual(started, ["movie", "photo", "recording"]);
  controls.get("recording").resolve();
  await fourth;
  assert.deepEqual(started, ["movie", "photo", "recording", "pdf"]);
  controls.get("pdf").resolve();
  controls.get("movie").resolve();
  await Promise.all([first, fifth]);
});
