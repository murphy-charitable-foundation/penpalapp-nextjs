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

const getProcessingOptions = () => {
  const cores = globalThis.navigator?.hardwareConcurrency || 4;
  const memory = globalThis.navigator?.deviceMemory || 4;
  const constrained = cores <= 2 || memory <= 2;

  // Device hints change resource limits, never the requested output quality.
  return {
    videoQueueSize: constrained ? 2 : 4,
    videoMaxOutputBytes: (constrained ? 32 : 64) * MB,
    videoCodecTimeoutMs: constrained ? 30000 : 15000,
  };
};

const getOptions = (custom) => {
  const profile = Object.hasOwn(COMPRESSION_PROFILES, custom.profile) ? custom.profile : "balanced";
  return {
    ...COMPRESSION_PROFILES[profile],
    ...getProcessingOptions(),
    videoMinSavingsRatio: 0.25,
    ...custom,
    profile,
  };
};

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
    profile: options.profile,
    skipBelowBytes: options.videoSkipBelowBytes,
    queueSize: options.videoQueueSize,
    maxOutputBytes: options.videoMaxOutputBytes,
    codecTimeoutMs: options.videoCodecTimeoutMs,
  } : null;
  if (process.env.NODE_ENV !== "production" && diagnostics) {
    console.info("[media-compression] start", JSON.stringify(diagnostics));
  }
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
    if (process.env.NODE_ENV !== "production") {
      console.warn(`${kind} compression skipped; original preserved:`, error);
    }
  } finally {
    report(1, true);
  }

  // Expose the final video result to optional compression observers.
  if (kind === "video") {
    Object.assign(diagnostics, {
      outcome: output === file ? "skipped" : "compressed",
      reason: output === file ? diagnostics.reason : null,
      outputBytes: output.size,
      elapsedMs: Math.round(performance.now() - startedAt),
    });
    if (process.env.NODE_ENV !== "production") {
      console.info("[media-compression] result", JSON.stringify(diagnostics));
    }
    onStage?.({
      stage: "compression-output",
      blob: output,
      outcome: output === file ? "skipped" : "recorded",
      diagnostics,
    });
  }
  return output;
}
