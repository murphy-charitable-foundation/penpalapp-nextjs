const AUDIO_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
];
const SETUP_TIMEOUT_MS = 10000;

const mediaError = (element, message) =>
  new Error(
    `${message} (code ${element.error?.code ?? "unknown"}): ` +
      (element.error?.message || "No browser details")
  );

const waitForMetadata = (element) =>
  new Promise((resolve, reject) => {
    if (element.readyState >= 1) return resolve();

    const cleanup = () => {
      clearTimeout(deadline);
      element.removeEventListener("loadedmetadata", loaded);
      element.removeEventListener("error", failed);
    };
    const loaded = () => {
      cleanup();
      resolve();
    };
    const failed = () => {
      cleanup();
      reject(mediaError(element, "Cannot decode audio metadata"));
    };
    const deadline = setTimeout(() => {
      cleanup();
      reject(new Error("Audio metadata loading timed out"));
    }, SETUP_TIMEOUT_MS);

    element.addEventListener("loadedmetadata", loaded);
    element.addEventListener("error", failed);
    try {
      element.load();
    } catch (error) {
      cleanup();
      reject(error);
    }
  });

const resumeContext = async (context) => {
  let deadline;
  try {
    await Promise.race([
      context.resume(),
      new Promise((_, reject) => {
        deadline = setTimeout(
          () => reject(new Error("Audio context resume timed out")),
          SETUP_TIMEOUT_MS
        );
      }),
    ]);
  } finally {
    clearTimeout(deadline);
  }
};

const recordAudio = (element, recorder, onProgress) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    const duration = element.duration;
    let settled = false;
    let completed = false;
    let deadline;

    const cleanup = () => {
      clearTimeout(deadline);
      element.removeEventListener("ended", ended);
      element.removeEventListener("error", failed);
      element.removeEventListener("pause", paused);
      element.removeEventListener("timeupdate", progress);
      recorder.ondataavailable = null;
      recorder.onerror = null;
      recorder.onstop = null;
    };
    const finish = (error, blob) => {
      if (settled) return;
      settled = true;
      cleanup();
      element.pause();
      if (error) reject(error);
      else resolve(blob);
    };
    const fail = (error) => {
      finish(error instanceof Error ? error : new Error(String(error)));
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        // Preserve the original failure if stopping also fails.
      }
    };
    const ended = () => {
      completed = true;
      try {
        if (recorder.state === "inactive") {
          fail(new Error("Audio recorder ended too early"));
        } else {
          recorder.stop();
        }
      } catch (error) {
        fail(error);
      }
    };
    const failed = () => fail(mediaError(element, "Audio playback failed"));
    const paused = () => {
      if (!completed && !element.ended && !settled) {
        fail(new Error("Audio playback interrupted"));
      }
    };
    const progress = () => onProgress?.(0.9 * element.currentTime / duration);

    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunks.push(event.data);
    };
    recorder.onerror = (event) =>
      fail(event.error || new Error("Audio recorder failed"));
    recorder.onstop = () => {
      if (!completed) {
        fail(new Error("Recording stopped before audio ended"));
        return;
      }
      const blob = new Blob(chunks, { type: recorder.mimeType });
      if (!blob.type || !blob.size) {
        fail(new Error("Empty audio recording"));
        return;
      }
      finish(null, blob);
    };

    element.addEventListener("ended", ended);
    element.addEventListener("error", failed);
    element.addEventListener("pause", paused);
    element.addEventListener("timeupdate", progress);
    deadline = setTimeout(
      () => fail(new Error("Audio recording timed out")),
      Math.min(2147483647, Math.max(20000, duration * 2000 + 15000))
    );

    try {
      recorder.start(1000);
      Promise.resolve(element.play()).catch(fail);
    } catch (error) {
      fail(error);
    }
  });

// Standalone audio uses a playback recording. Video keeps its original AAC track.
export async function compressAudio(file, onProgress, options) {
  const Context =
    typeof window !== "undefined" &&
    (window.AudioContext || window.webkitAudioContext);
  if (
    !Context ||
    typeof document === "undefined" ||
    typeof MediaRecorder === "undefined" ||
    typeof MediaRecorder.isTypeSupported !== "function"
  ) {
    return file;
  }
  const mimeType = AUDIO_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
  if (!mimeType) return file;

  const element = document.createElement("audio");
  const url = URL.createObjectURL(file);
  let context;
  let source;
  let destination;

  try {
    element.preload = "metadata";
    element.muted = false;
    element.src = url;
    await waitForMetadata(element);
    if (!Number.isFinite(element.duration) || element.duration <= 0) {
      throw new Error("Cannot determine audio duration");
    }

    context = new Context();
    source = context.createMediaElementSource(element);
    destination = context.createMediaStreamDestination();
    // Route audio to the recorder without playing it through the device speakers.
    source.connect(destination);
    if (!destination.stream.getAudioTracks().length) return file;
    await resumeContext(context);
    if (context.state !== "running") return file;

    const recorder = new MediaRecorder(destination.stream, {
      mimeType,
      audioBitsPerSecond: options.audioBitsPerSecond,
    });
    return await recordAudio(element, recorder, onProgress);
  } finally {
    element.pause();
    element.removeAttribute("src");
    destination?.stream.getTracks().forEach((track) => track.stop());
    source?.disconnect();
    destination?.disconnect();
    // Closing releases the graph; do not let a suspended browser delay fallback.
    if (context) void context.close().catch(() => {});
    URL.revokeObjectURL(url);
    element.load();
  }
}
