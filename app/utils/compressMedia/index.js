"use client";

const KB = 1024;
const MB = 1024 * KB;

const COMPRESSION_PROFILES = {
  lowEnd: {
    imageMaxSizeMB: 0.75,
    imageMaxWidthOrHeight: 1024,
    imageQuality: 0.65,
    videoMaxWidth: 480,
    videoFps: 12,
    videoBitsPerSecond: 450000,
    audioBitsPerSecond: 48000,
    audioSkipBelowBytes: 500 * KB,
    videoSkipBelowBytes: 5 * MB,
  },
  balanced: {
    imageMaxSizeMB: 1,
    imageMaxWidthOrHeight: 1280,
    imageQuality: 0.72,
    videoMaxWidth: 640,
    videoFps: 15,
    videoBitsPerSecond: 650000,
    audioBitsPerSecond: 56000,
    audioSkipBelowBytes: 500 * KB,
    videoSkipBelowBytes: 8 * MB,
  },
  capable: {
    imageMaxSizeMB: 1.25,
    imageMaxWidthOrHeight: 1600,
    imageQuality: 0.78,
    videoMaxWidth: 854,
    videoFps: 20,
    videoBitsPerSecond: 900000,
    audioBitsPerSecond: 64000,
    audioSkipBelowBytes: 500 * KB,
    videoSkipBelowBytes: 10 * MB,
  },
};

export const getDetectedCompressionProfile = () => {
  if (typeof navigator === "undefined") return "balanced";

  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    navigator.maxTouchPoints > 1;

  if (cores <= 2 || memory <= 2) return "lowEnd";
  if (cores <= 4 || memory <= 4 || mobile) return "balanced";
  return "capable";
};

const getOptions = (custom) => ({
  ...(COMPRESSION_PROFILES[custom.profile || getDetectedCompressionProfile()] ||
    COMPRESSION_PROFILES.balanced),
  videoMinSavingsRatio: 0.25,
  ...custom,
});

// One bounded, monotonic progress stream for every media type. Reserve 1 for
// the wrapper's final result, and avoid re-rendering the upload UI per frame.
const createProgressReporter = (callback) => {
  let latest = 0;
  let reported = -1;
  let lastUpdate = -Infinity;

  return (value, force = false) => {
    if (!Number.isFinite(value)) return;
    latest = Math.max(latest, Math.max(0, Math.min(force ? 1 : 0.99, value)));
    const now = performance.now();
    if (latest === reported || (!force && now - lastUpdate < 100)) return;
    reported = latest;
    lastUpdate = now;
    callback?.(latest);
  };
};

// The only public compression entry point. Format-specific modules produce a
// candidate; this wrapper owns progress, original-file fallback and size checks.
export async function compressMedia(
  file,
  onProgress = null,
  customOptions = {},
  onStage = null
) {
  const report = createProgressReporter(onProgress);
  report(0, true);

  const kind = file.type.split("/")[0];
  if (!["image", "video", "audio"].includes(kind)) {
    throw new Error("Unsupported file type");
  }

  const options = getOptions(customOptions);
  const startedAt = performance.now();
  const diagnostics = kind === "video" ? {
    inputBytes: file.size,
    inputType: file.type,
    videoDecoderAvailable: typeof VideoDecoder !== "undefined",
    videoEncoderAvailable: typeof VideoEncoder !== "undefined",
    secureContext: globalThis.isSecureContext ?? null,
    skipBelowBytes: options.videoSkipBelowBytes,
  } : null;
  if (diagnostics) console.info("[media-compression] start", JSON.stringify(diagnostics));
  if (diagnostics) diagnostics.reason = "below-size-threshold";
  let output = file;
  try {
    let candidate;
    if (kind === "image") {
      const { compressImage } = await import("./image.js");
      candidate = await compressImage(file, report, options);
    } else if (kind === "video" && file.size >= options.videoSkipBelowBytes) {
      diagnostics.reason = "no-smaller-output";
      const { compressVideo } = await import("./videoTranscoder.js");
      candidate = await compressVideo(file, report, options,
        (details) => Object.assign(diagnostics, details));
    } else if (kind === "audio" && file.size >= options.audioSkipBelowBytes) {
      const { compressAudio } = await import("./audio.js");
      candidate = await compressAudio(file, report, options);
    }

    if (candidate?.size > 0 && candidate.size < file.size) output = candidate;
  } catch (error) {
    if (diagnostics) {
      diagnostics.reason = "compression-error";
      diagnostics.message = error instanceof Error ? error.message : String(error);
    }
    console.warn(`${kind} compression skipped; original preserved:`, error);
  } finally {
    report(1, true);
  }

  // Preserve the existing attachments.js video diagnostic contract.
  if (kind === "video") {
    Object.assign(diagnostics, {
      outcome: output === file ? "skipped" : "compressed",
      reason: output === file ? diagnostics.reason : null,
      outputBytes: output.size,
      elapsedMs: Math.round(performance.now() - startedAt),
    });
    console.info("[media-compression] result", JSON.stringify(diagnostics));
    onStage?.({
      stage: "compression-output",
      blob: output,
      outcome: output === file ? "skipped" : "recorded",
      diagnostics,
    });
  }
  return output;
}
