import { inspectSource, muxVideo, readSample, releaseSource } from "./videoContainer.js";

const MB = 1024 * 1024;
const microseconds = (ticks, timescale) => Math.round(ticks * 1e6 / timescale);
// WebKit can lose a microsecond when VideoFrame timestamps round-trip through
// seconds. Tolerate only rounding, then restore the exact source timeline.
// https://bugs.webkit.org/show_bug.cgi?id=321880
const TIMESTAMP_ROUNDING_US = 2;

// Estimate with the ORIGINAL audio bytes: AAC is copied, never re-encoded.
export function getVideoPlan(file, source, options) {
  const { width, height, duration, rotation } = source;
  const fps = options.videoFps;
  if (![width, height, duration, fps, options.videoMaxWidth,
    options.videoBitsPerSecond].every((n) => Number.isFinite(n) && n > 0)) return null;
  if (duration > (options.videoMaxDurationSeconds ?? 600) || fps > 60) return null;
  const displayWidth = rotation % 180 ? height : width;
  const scale = Math.min(1, options.videoMaxWidth / displayWidth);
  const targetWidth = Math.max(2, Math.floor(width * scale / 2) * 2);
  const targetHeight = Math.max(2, Math.floor(height * scale / 2) * 2);
  const pixelFactor = Math.min(1, Math.max(0.55,
    targetWidth * targetHeight / (options.videoMaxWidth ** 2)));
  const bitrate = Math.max(160000, Math.round(options.videoBitsPerSecond * pixelFactor));
  const audioBytes = source.audioSamples.reduce((total, sample) => total + sample.size, 0);
  // Include a conservative allowance for MP4 fragment headers.
  const estimate = bitrate * duration / 8 + audioBytes +
    (fps * duration + source.audioSamples.length) * 200 + 8192;
  const maxOutputBytes = Math.min(file.size - 1, options.videoMaxOutputBytes ?? 64 * MB);
  if (estimate > maxOutputBytes ||
    1 - estimate / file.size < (options.videoMinSavingsRatio ?? 0.25)) return null;
  return { width: targetWidth, height: targetHeight, bitrate, fps, duration,
    maxOutputBytes, audioBytes };
}

const sameBytes = (a, b) => a.length === b.length && a.every((value, i) => value === b[i]);

export async function getVideoConfigurations(source, plan, onDiagnostic) {
  const decoder = {
    codec: source.video.codec,
    codedWidth: source.width,
    codedHeight: source.height,
    description: source.videoDescription,
  };
  if (!(await VideoDecoder.isConfigSupported(decoder)).supported) {
    onDiagnostic?.({ reason: "decoder-unsupported", decoderSupported: false });
    return null;
  }
  onDiagnostic?.({ decoderSupported: true });
  // Baseline cannot contain B-frames, so encoder output DTS equals PTS. Level
  // 4.0 also accommodates portrait dimensions in the capable profile.
  // Some native encoders accept constrained Baseline but reject Baseline, or
  // accept level 3.1 but reject an unnecessary level 4.0 request. Keep probes
  // bounded and use 3.1 only when its frame/rate/bitrate limits accommodate us.
  const macroblocks = Math.ceil(plan.width / 16) * Math.ceil(plan.height / 16);
  const codecs = ["avc1.420028", "avc1.42e028"];
  if (macroblocks <= 3600 && macroblocks * plan.fps <= 108000 &&
    plan.bitrate <= 14000000 &&
    Math.max(Math.ceil(plan.width / 16), Math.ceil(plan.height / 16)) ** 2 <= 8 * 3600) {
    codecs.push("avc1.42001f", "avc1.42e01f");
  }
  for (const hardwareAcceleration of ["prefer-hardware", "no-preference"]) {
    for (const codec of codecs) {
      const encoder = {
        codec,
        width: plan.width,
        height: plan.height,
        bitrate: plan.bitrate,
        framerate: plan.fps,
        latencyMode: "quality",
        hardwareAcceleration,
        avc: { format: "avc" },
      };
      try {
        if ((await VideoEncoder.isConfigSupported(encoder)).supported) {
          onDiagnostic?.({ encoderSupported: true, outputCodec: codec, hardwareAcceleration });
          return { decoder, encoder };
        }
      } catch (_) {
        // A browser may reject a hardware preference while accepting the codec.
      }
    }
  }
  onDiagnostic?.({ reason: "encoder-unsupported", encoderSupported: false });
  return null;
}

function deadline(promise, milliseconds, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out`)), milliseconds);
    }),
  ]).finally(() => clearTimeout(timer));
}

// Decode in DTS order; the decoder delivers frames in presentation order.
// Skipping frames changes neither the remaining timestamps nor the audio clock.
export async function encodeVideo(source, plan, config, onProgress, options = {}, onDiagnostic = null) {
  const samples = [];
  const pendingEncodes = new Map();
  const presentationTimes = source.videoSamples.map((sample) =>
    microseconds(sample.cts, source.video.timescale)).sort((a, b) => a - b);
  const timeout = options.videoCodecTimeoutMs ?? 15000;
  const queueSize = Number.isInteger(options.videoQueueSize)
    ? Math.max(1, Math.min(4, options.videoQueueSize)) : 4;
  let decoder;
  let encoder;
  let heldFrame = null;
  let description = null;
  let failure = null;
  let encodedBytes = 0;
  let submitted = 0;
  let decoded = 0;
  let lastDecoded = -Infinity;
  let lastEncoded = -Infinity;
  let lastSelected = -Infinity;
  let lastKeyframe = -Infinity;
  let nextFrameTime = -Infinity;
  let finished = false;
  let timestampCorrections = 0;
  let maxTimestampCorrectionUs = 0;
  let rejectFailure;
  const failed = new Promise((_, reject) => { rejectFailure = reject; });
  // The callback can fail before the next awaited codec operation.
  failed.catch(() => {});
  const fail = (error) => {
    if (failure || finished) return;
    failure = error instanceof Error ? error : new Error(String(error));
    rejectFailure(failure);
  };
  const check = () => { if (failure) throw failure; };
  const guarded = (promise, label) => deadline(Promise.race([promise, failed]), timeout, label);
  const checkTimestamp = (actual, expected, stage) => {
    const delta = actual - expected;
    if (!Number.isSafeInteger(actual) || !Number.isSafeInteger(expected) ||
      Math.abs(delta) > TIMESTAMP_ROUNDING_US) {
      onDiagnostic?.({ timestampMismatch: { stage, expectedUs: expected, actualUs: actual, deltaUs: delta } });
      throw new Error(`${stage} changed video timestamps (expected ${expected} us, received ${actual} us)`);
    }
    if (delta) {
      timestampCorrections++;
      maxTimestampCorrectionUs = Math.max(maxTimestampCorrectionUs, Math.abs(delta));
    }
  };
  const submit = (frame, timestamp, end) => {
    let timed;
    try {
      const duration = end - timestamp;
      if (duration <= 0) throw new Error("Non-increasing video presentation timestamps");
      timed = new VideoFrame(frame, { timestamp, duration });
      checkTimestamp(timed.timestamp, timestamp, "VideoFrame");
      // Read back the actual constructed timestamp: WebKit may have rounded it.
      pendingEncodes.set(timestamp, { timestamp, duration, encoderTimestamp: timed.timestamp });
      const keyFrame = timestamp - lastKeyframe >= 2e6;
      encoder.encode(timed, { keyFrame });
      if (keyFrame) lastKeyframe = timestamp;
      submitted++;
    } finally {
      timed?.close();
      frame.close();
    }
  };

  try {
    encoder = new VideoEncoder({
      error: fail,
      output: (chunk, metadata) => {
        if (failure || finished) return;
        try {
          const configDescription = metadata?.decoderConfig?.description;
          if (configDescription) {
            const bytes = ArrayBuffer.isView(configDescription)
              ? new Uint8Array(configDescription.buffer, configDescription.byteOffset, configDescription.byteLength)
              : new Uint8Array(configDescription);
            if (description && !sameBytes(description, bytes)) throw new Error("Encoder changed AVC configuration");
            description = bytes.slice();
          }
          if ((!samples.length && chunk.type !== "key") ||
            chunk.timestamp <= lastEncoded) {
            throw new Error("Unexpected encoded frame reordering");
          }
          // Baseline produces frames in submission order. Match the next frame
          // within a tiny rounding bound; never infer timing from output order
          // alone or accept dropped/reordered frames under this workaround.
          const expected = pendingEncodes.values().next().value;
          if (!expected) throw new Error("Encoder produced an unexpected frame");
          checkTimestamp(chunk.timestamp, expected.encoderTimestamp, "Encoder");
          const { timestamp, duration } = expected;
          pendingEncodes.delete(timestamp);
          lastEncoded = chunk.timestamp;
          encodedBytes += chunk.byteLength + 200;
          if (encodedBytes + plan.audioBytes > plan.maxOutputBytes) throw new Error("Video output exceeds size budget");
          const data = new Uint8Array(chunk.byteLength);
          chunk.copyTo(data);
          samples.push({ data, timestamp, duration, type: chunk.type });
        } catch (error) { fail(error); }
      },
    });
    encoder.configure(config.encoder);
    decoder = new VideoDecoder({
      error: fail,
      output: (frame) => {
        try {
          if (failure || finished) return;
          if (["pq", "hlg"].includes(frame.colorSpace?.transfer)) {
            throw new Error("HDR video requires the original file");
          }
          const timestamp = presentationTimes[decoded++];
          if (frame.timestamp <= lastDecoded) throw new Error("Invalid decoded presentation order");
          lastDecoded = frame.timestamp;
          checkTimestamp(frame.timestamp, timestamp, "Decoder");
          if (timestamp + 1 < nextFrameTime) return;
          if (encoder.encodeQueueSize > 32) throw new Error("Encoder cannot keep up within memory budget");
          if (heldFrame) {
            const previous = heldFrame;
            heldFrame = null;
            submit(previous, lastSelected, timestamp);
          }
          heldFrame = frame;
          lastSelected = timestamp;
          if (!Number.isFinite(nextFrameTime)) nextFrameTime = timestamp;
          do { nextFrameTime += 1e6 / plan.fps; } while (nextFrameTime <= timestamp);
          onProgress?.(0.1 + 0.75 * decoded / source.videoSamples.length);
        } catch (error) { fail(error); }
        finally { if (heldFrame !== frame) frame.close(); }
      },
    });
    decoder.configure(config.decoder);
    for (let i = 0; i < source.videoSamples.length; i++) {
      check();
      if (decoder.decodeQueueSize >= queueSize || encoder.encodeQueueSize >= queueSize) {
        let ready;
        try {
          await guarded(new Promise((resolve) => {
            ready = () => {
              if (failure || (decoder.decodeQueueSize < queueSize && encoder.encodeQueueSize < queueSize)) resolve();
            };
            decoder.addEventListener("dequeue", ready);
            encoder.addEventListener("dequeue", ready);
            ready();
          }), "Codec queue");
        } finally {
          decoder.removeEventListener("dequeue", ready);
          encoder.removeEventListener("dequeue", ready);
        }
        check();
      }
      const sample = source.videoSamples[i];
      const data = await guarded(readSample(source.blob, sample), "Video read");
      check();
      decoder.decode(new EncodedVideoChunk({
        type: sample.is_sync ? "key" : "delta",
        timestamp: microseconds(sample.cts, source.video.timescale),
        duration: microseconds(sample.duration, source.video.timescale),
        data,
      }));
      // Yield periodically even when a browser dispatches codec work immediately.
      if (i % 32 === 31) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    await guarded(decoder.flush(), "Video decode");
    check();
    if (decoded !== source.videoSamples.length || !heldFrame) throw new Error("Decoder omitted frames");
    const end = source.videoSamples.reduce((max, sample) => Math.max(max,
      microseconds(sample.cts + sample.duration, source.video.timescale)), 0);
    if (end <= lastSelected) throw new Error("Invalid video end time");
    const last = heldFrame;
    heldFrame = null;
    submit(last, lastSelected, end);
    await guarded(encoder.flush(), "Video encode");
    check();
    if (!description || samples.length !== submitted || pendingEncodes.size) throw new Error("Encoder omitted frames or AVC configuration");
    return { samples, width: plan.width, height: plan.height, description };
  } finally {
    finished = true;
    heldFrame?.close();
    if (decoder && decoder.state !== "closed") decoder.close();
    if (encoder && encoder.state !== "closed") encoder.close();
    onDiagnostic?.({ timestampCorrections, maxTimestampCorrectionUs });
  }
}

export async function compressVideo(file, onProgress, options, onDiagnostic = null) {
  if (typeof VideoDecoder === "undefined" || typeof VideoEncoder === "undefined" ||
    typeof EncodedVideoChunk === "undefined" || typeof VideoFrame === "undefined") {
    onDiagnostic?.({ reason: "native-codecs-unavailable", secureContext: globalThis.isSecureContext ?? null });
    return file;
  }
  onDiagnostic?.({ phase: "inspect" });
  const source = await inspectSource(file, options);
  try {
    onDiagnostic?.({ sourceCodec: source.video.codec, width: source.width,
      height: source.height, durationSeconds: source.duration, phase: "plan" });
    const plan = getVideoPlan(file, source, options);
    if (!plan) {
      onDiagnostic?.({ reason: "outside-compression-budget" });
      return file;
    }
    onDiagnostic?.({ phase: "codec-check", targetWidth: plan.width, targetHeight: plan.height,
      targetFps: plan.fps, targetBitrate: plan.bitrate });
    const config = await deadline(getVideoConfigurations(source, plan, onDiagnostic),
      options.videoCodecTimeoutMs ?? 15000, "Codec support check");
    if (!config) return file;
    onDiagnostic?.({ phase: "encode" });
    onProgress?.(0.1);
    const encoded = await encodeVideo(source, plan, config, onProgress, options, onDiagnostic);
    onProgress?.(0.9);
    onDiagnostic?.({ phase: "mux" });
    return await muxVideo(source, encoded, { ...options, maxOutputBytes: plan.maxOutputBytes });
  } finally {
    releaseSource(source);
  }
}
