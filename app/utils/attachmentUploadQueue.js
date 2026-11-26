const MAX_ACTIVE_UPLOADS = 2;

// A slot covers both compression and the subsequent Storage upload. Hand it
// directly to the oldest waiting file, including files from later selections.
export function createAttachmentUploadQueue() {
  let active = 0;
  const waiting = [];

  return async function enqueue(upload, signal) {
    if (signal.aborted) return;
    if (active < MAX_ACTIVE_UPLOADS) {
      active += 1;
    } else {
      await new Promise((resolve) => waiting.push(resolve));
    }

    try {
      if (!signal.aborted) await upload();
    } finally {
      if (waiting.length) waiting.shift()();
      else active -= 1;
    }
  };
}
