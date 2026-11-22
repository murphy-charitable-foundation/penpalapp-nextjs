import test from "node:test";
import assert from "node:assert/strict";
import { createAttachmentSelection } from "../app/utils/attachmentSelection.js";

test("picking files during a send or draft restore starts no validation or uploads", async () => {
  const calls = [];
  const selection = createAttachmentSelection(async (files) => {
    calls.push("validate");
    return { accepted: files, errors: [] };
  });
  const callbacks = { onAdd: (file) => calls.push(file), onErrors: () => {} };
  let finishTransition;
  const transition = selection.runTransition(() => new Promise((resolve) => {
    finishTransition = resolve;
  }));

  assert.equal(await selection.select(["too early"], callbacks), false);
  assert.deepEqual(calls, []);
  finishTransition();
  await transition;
  assert.equal(await selection.select(["letter.pdf"], callbacks), true);
  assert.deepEqual(calls, ["validate", "letter.pdf"]);
});

test("validation from a closed draft cannot enqueue files or unlock the next draft", async () => {
  const validations = new Map();
  const selection = createAttachmentSelection(([file]) => new Promise((resolve) => {
    validations.set(file, resolve);
  }));
  const queued = [];
  const errors = [];
  const callbacks = { onAdd: (entry) => queued.push(entry), onErrors: (items) => errors.push(...items) };

  const oldDraft = selection.select(["first"], callbacks);
  selection.cancel();
  const newDraft = selection.select(["second"], callbacks);
  validations.get("first")({ accepted: ["stale"], errors: ["old error"] });
  await oldDraft;

  assert.deepEqual(queued, []);
  assert.deepEqual(errors, []);
  assert.equal(await selection.runTransition(() => assert.fail("draft changed during validation")), false);

  validations.get("second")({ accepted: ["current"], errors: [] });
  await newDraft;
  assert.deepEqual(queued, ["current"]);
  assert.equal(await selection.runTransition(() => {}), true);
});
