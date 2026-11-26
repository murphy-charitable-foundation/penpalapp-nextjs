// Validation may read a PDF asynchronously. Keep the composer on the same
// draft until the validated files are queued, or discard them on navigation.
export function createAttachmentSelection(validateFiles, onBusyChange = () => {}) {
  let active = null;

  async function runTransition(action) {
    if (active) return false;
    const token = {};
    active = token;
    onBusyChange(true);
    const isCurrent = () => active === token;
    try {
      await action(isCurrent);
      return isCurrent();
    } finally {
      if (isCurrent()) {
        active = null;
        onBusyChange(false);
      }
    }
  }

  return {
    runTransition,
    select(files, { onAdd, onErrors }) {
      return runTransition(async (isCurrent) => {
        const { accepted, errors } = await validateFiles(files);
        if (!isCurrent()) return;
        accepted.forEach(onAdd);
        onErrors(errors);
      });
    },
    cancel() {
      if (active) {
        active = null;
        onBusyChange(false);
      }
    },
  };
}
