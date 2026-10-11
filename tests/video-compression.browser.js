#!/usr/bin/env node
// Real-browser integration test. No production or test npm dependencies needed.
// Requires Node >=22, ffmpeg, ffprobe, and a locally installed Chromium browser.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = process.env.VIDEO_TEST_OUTPUT || await mkdtemp(path.join(tmpdir(), "penpal-video-"));
await mkdir(directory, { recursive: true });
const inputPath = (name) => path.join(directory, name);
const duration = Number(process.env.VIDEO_TEST_DURATION || 6);
const width = Number(process.env.VIDEO_TEST_WIDTH || 960);
const height = Number(process.env.VIDEO_TEST_HEIGHT || 540);
const targetWidth = Number(process.env.VIDEO_TEST_TARGET_WIDTH || 480);
const targetBitrate = Number(process.env.VIDEO_TEST_TARGET_BITRATE || 450000);
const browserPath = process.env.CHROME_PATH || [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].find(existsSync);
assert(browserPath, "Set CHROME_PATH to a local Chromium browser executable");

function command(executable, args) {
  const result = spawnSync(executable, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${executable} failed: ${result.stderr}`);
  return result.stdout;
}
function ffmpeg(args) { return command("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]); }
function probe(file) {
  return JSON.parse(command("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]));
}
function audioPackets(file) {
  return JSON.parse(command("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_packets",
    "-show_data_hash", "sha256", "-show_entries", "packet=pts_time,duration_time,data_hash", "-of", "json", file])).packets;
}
function videoPackets(file) {
  return JSON.parse(command("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_packets",
    "-show_entries", "packet=pts_time,duration_time", "-of", "json", file])).packets;
}

if (!process.env.VIDEO_TEST_REUSE) {
console.log(`Generating fixtures in ${directory}`);
ffmpeg(["-f", "lavfi", "-i", `testsrc2=size=${width}x${height}:rate=30`, "-f", "lavfi", "-i",
  "sine=frequency=440:sample_rate=44100", "-t", String(duration), "-c:v", "libx264", "-preset", "veryfast",
  "-crf", "8", "-bf", "2", "-g", "30", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-ac", "2",
  "-movflags", "+faststart", inputPath("bframes.mp4")]);
ffmpeg(["-i", inputPath("bframes.mp4"), "-c", "copy", inputPath("iphone-like.mov")]);
ffmpeg(["-display_rotation:v:0", "90", "-i", inputPath("bframes.mp4"), "-c", "copy", inputPath("rotated.mov")]);
ffmpeg(["-i", inputPath("bframes.mp4"), "-an", "-c:v", "copy", inputPath("no-audio.mp4")]);
ffmpeg(["-i", inputPath("bframes.mp4"), "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-map", "0:v", "-map", "1:a",
  "-t", String(duration), "-c:v", "copy", "-c:a", "aac", inputPath("silent-aac.mp4")]);
ffmpeg(["-i", inputPath("bframes.mp4"), "-itsoffset", "0.35", "-i", inputPath("bframes.mp4"), "-map", "0:v", "-map", "1:a",
  "-c", "copy", inputPath("audio-offset.mp4")]);
ffmpeg(["-i", inputPath("bframes.mp4"), "-c:v", "copy", "-c:a", "pcm_s16le", inputPath("unsupported-pcm.mov")]);
ffmpeg(["-i", inputPath("bframes.mp4"), "-map", "0:v", "-map", "0:a", "-map", "0:a", "-c", "copy", inputPath("multiple-audio.mov")]);
ffmpeg(["-i", inputPath("bframes.mp4"), "-t", "0.3", "-c", "copy", inputPath("short.mp4")]);
ffmpeg(["-i", inputPath("bframes.mp4"), "-vf", "scale=320:-2", "-c:v", "libx264", "-crf", "38",
  "-preset", "veryfast", "-c:a", "copy", inputPath("already-small.mp4")]);
await writeFile(inputPath("corrupt.mp4"), Buffer.alloc(64 * 1024, 3));
}

// Reused fixture directories may predate the iPhone HEVC cases.
for (const [name, hdr] of [["hevc-sdr.mov", false], ["hevc-hdr.mov", true]]) {
  if (process.env.VIDEO_TEST_REUSE && existsSync(inputPath(name)) &&
    probe(inputPath(name)).streams.some((stream) => stream.codec_type === "video" &&
      stream.color_transfer === (hdr ? "arib-std-b67" : "bt709"))) continue;
  ffmpeg(["-i", inputPath("bframes.mp4"), "-c:v", "libx265", "-preset", "ultrafast", "-crf", "8",
    "-x265-params", `pools=2:frame-threads=2:log-level=error:colorprim=${hdr ? 9 : 1}:transfer=${hdr ? 18 : 1}:colormatrix=${hdr ? 9 : 1}`,
    "-tag:v", "hvc1", "-movflags", "+write_colr",
    "-pix_fmt", hdr ? "yuv420p10le" : "yuv420p",
    "-color_primaries", hdr ? "bt2020" : "bt709", "-color_trc", hdr ? "arib-std-b67" : "bt709",
    "-colorspace", hdr ? "bt2020nc" : "bt709", "-c:a", "copy", inputPath(name)]);
  const video = probe(inputPath(name)).streams.find((stream) => stream.codec_type === "video");
  assert.equal(video.codec_name, "hevc", `${name}: fixture must contain HEVC`);
  assert.equal(video.pix_fmt, hdr ? "yuv420p10le" : "yuv420p", `${name}: unexpected bit depth`);
  assert.equal(video.color_transfer, hdr ? "arib-std-b67" : "bt709", `${name}: unexpected transfer function`);
}

const html = `<!doctype html><meta charset="utf-8"><title>Compression integration test</title>
<script type="importmap">${JSON.stringify({ imports: {
  "mp4box": "/node_modules/mp4box/dist/mp4box.all.mjs",
  "browser-image-compression": "/node_modules/browser-image-compression/dist/browser-image-compression.mjs",
} })}</script>`;
const imageWorkerLibraryPath = "/node_modules/browser-image-compression/dist/browser-image-compression.js";
let imageWorkerLibraryRequests = 0;
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (pathname === imageWorkerLibraryPath) imageWorkerLibraryRequests++;
    if (pathname === "/") { res.setHeader("Content-Type", "text/html"); return res.end(html); }
    if (pathname.startsWith("/output/") && req.method === "PUT") {
      const parts = [];
      for await (const part of req) parts.push(part);
      await writeFile(inputPath(path.basename(pathname)), Buffer.concat(parts));
      return res.end("ok");
    }
    const prefix = pathname.startsWith("/fixture/") ? directory : root;
    let filename = pathname.startsWith("/fixture/") ? path.basename(pathname) : pathname.slice(1);
    filename = path.resolve(prefix, filename);
    if (!filename.startsWith(`${prefix}${path.sep}`)) { res.statusCode = 403; return res.end(); }
    if (!path.extname(filename) && existsSync(`${filename}.js`)) filename += ".js";
    const body = await readFile(filename);
    res.setHeader("Content-Type", /\.(m?js)$/.test(filename) ? "text/javascript" : "application/octet-stream");
    res.end(body);
  } catch (error) { res.statusCode = 404; res.end(String(error)); }
});
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
let connection;
try {
  browser = spawn(browserPath, ["--headless=new", "--remote-debugging-port=0", "--no-first-run", "--no-default-browser-check",
    `--user-data-dir=${path.join(directory, "chrome-profile")}`, "--autoplay-policy=no-user-gesture-required", "about:blank"],
  { stdio: ["ignore", "ignore", "pipe"] });
  const endpoint = await new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error(`Chrome startup timed out: ${output}`)), 20000);
    browser.once("error", (error) => { clearTimeout(timeout); reject(error); });
    browser.once("exit", (code) => { clearTimeout(timeout); reject(new Error(`Chrome exited (${code}): ${output}`)); });
    browser.stderr.on("data", (data) => {
      output += data;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
  });
  const debugOrigin = endpoint.replace(/^ws:/, "http:").replace(/\/devtools\/.*$/, "");
  const tab = await (await fetch(`${debugOrigin}/json/new?${encodeURIComponent(origin)}`, { method: "PUT" })).json();
  connection = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { connection.onopen = resolve; connection.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  connection.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timeout } = pending.get(message.id);
      pending.delete(message.id); clearTimeout(timeout);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
    if (message.method === "Runtime.consoleAPICalled" && ["warning", "error"].includes(message.params.type)) {
      console.error("Browser:", message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
    }
  };
  function cdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 180000);
      pending.set(id, { resolve, reject, timeout });
      connection.send(JSON.stringify({ id, method, params }));
    });
  }
  await cdp("Runtime.enable");
  async function evaluate(fn, ...args) {
    const result = await cdp("Runtime.evaluate", { expression: `(${fn.toString()})(...${JSON.stringify(args)})`,
      awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  await cdp("Page.enable");
  await cdp("Page.navigate", { url: origin });
  const navigationDeadline = Date.now() + 10000;
  while (!(await evaluate((expected) => location.origin === expected && document.readyState === "complete", origin))) {
    assert(Date.now() < navigationDeadline, "Test page did not finish loading");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  console.log(await evaluate(() => ({ browser: navigator.userAgent, decoder: typeof VideoDecoder, encoder: typeof VideoEncoder })));
  const cases = [
    { name: "bframes.mp4", compressed: true },
    { name: "bframes.mp4", label: "timestamp-rounding", compressed: true, roundTimestamps: true },
    { name: "iphone-like.mov", compressed: true },
    { name: "rotated.mov", compressed: true, rotated: true },
    { name: "no-audio.mp4", compressed: true },
    { name: "silent-aac.mp4", compressed: true },
    { name: "audio-offset.mp4", compressed: true },
    { name: "hevc-sdr.mov", compressed: true, probeDecoder: true },
    { name: "hevc-hdr.mov", compressed: false },
    { name: "short.mp4", compressed: false, options: { videoSkipBelowBytes: 5 * 1024 * 1024 } },
    { name: "already-small.mp4", compressed: false },
    { name: "unsupported-pcm.mov", compressed: false },
    { name: "multiple-audio.mov", compressed: false },
    { name: "corrupt.mp4", compressed: false },
    { name: "bframes.mp4", label: "codec-unavailable", compressed: false, disableCodecs: true },
  ];
  const results = [];
  for (const item of cases) {
    const selection = process.env.VIDEO_TEST_CASE;
    // Keep the native baseline when running only the timestamp regression.
    const needsBaseline = selection && "timestamp-rounding".includes(selection) && item.name === "bframes.mp4" && !item.label;
    if (selection && !(item.label || item.name).includes(selection) && !needsBaseline) continue;
    const result = await evaluate(async ({ name, label, options, disableCodecs, traceCodecs, targetWidth, targetBitrate, probeDecoder, roundTimestamps }) => {
      const { compressMedia } = await import("/app/utils/compressMedia/index.js");
      const fixture = await (await fetch(`/fixture/${name}`)).blob();
      const file = new File([fixture], name, { type: name.endsWith(".mov") ? "video/quicktime" : "video/mp4" });
      const progress = []; const stages = [];
      const started = performance.now();
      const originalDecoder = globalThis.VideoDecoder;
      const originalEncoder = globalThis.VideoEncoder;
      const originalFrame = globalThis.VideoFrame;
      let roundedFrames = 0;
      let roundedChunks = 0;
      let decoderSupported = null;
      if (probeDecoder) {
        const { inspectSource, releaseSource } = await import("/app/utils/compressMedia/videoContainer.js");
        const source = await inspectSource(file, {});
        try {
          decoderSupported = !!originalDecoder && (await originalDecoder.isConfigSupported({
            codec: source.video.codec, codedWidth: source.width, codedHeight: source.height,
            description: source.videoDescription,
          })).supported;
        } finally { releaseSource(source); }
      }
      let output;
      try {
        if (roundTimestamps) globalThis.VideoFrame = class extends originalFrame {
          constructor(source, init) {
            super(source, { ...init, timestamp: (init?.timestamp ?? source.timestamp) - 1 });
            roundedFrames++;
          }
        };
        if (traceCodecs || roundTimestamps) globalThis.VideoEncoder = class extends originalEncoder {
          constructor(init) { super({ ...init, output(chunk, metadata) {
            if (traceCodecs && metadata?.decoderConfig) {
              const value = metadata.decoderConfig.description;
              const bytes = ArrayBuffer.isView(value) ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength) : new Uint8Array(value);
              console.warn("Encoder config", chunk.timestamp, JSON.stringify({ ...metadata.decoderConfig, description: Array.from(bytes) }));
            }
            if (roundTimestamps) {
              const data = new Uint8Array(chunk.byteLength);
              chunk.copyTo(data);
              chunk = new EncodedVideoChunk({ type: chunk.type, timestamp: chunk.timestamp - 1,
                duration: chunk.duration ?? undefined, data });
              roundedChunks++;
            }
            init.output(chunk, metadata);
          } }); }
        };
        if (disableCodecs) { globalThis.VideoDecoder = undefined; globalThis.VideoEncoder = undefined; }
        output = await compressMedia(file, (value) => progress.push(value), {
          profile: "balanced", videoSkipBelowBytes: 0, videoMaxWidth: targetWidth, videoFps: 15,
          videoBitsPerSecond: targetBitrate, ...options,
        }, (stage) => stages.push({ ...stage, blob: undefined }));
      } finally {
        globalThis.VideoDecoder = originalDecoder;
        globalThis.VideoEncoder = originalEncoder;
        globalThis.VideoFrame = originalFrame;
      }
      const elapsedMs = performance.now() - started;
      let videoTimeline = null;
      if (roundTimestamps && output !== file) {
        const { inspectSource, releaseSource } = await import("/app/utils/compressMedia/videoContainer.js");
        const source = await inspectSource(file, {});
        try {
          const compressed = await inspectSource(output, {});
          try {
            const firstCts = (media) => Math.min(...media.videoSamples.map((sample) =>
              Math.round(sample.cts * 1e6 / media.video.timescale)));
            videoTimeline = { firstSourceCtsUs: firstCts(source), firstOutputCtsUs: firstCts(compressed) };
          } finally { releaseSource(compressed); }
        } finally { releaseSource(source); }
      }
      const outputName = `output-${label || name}.mp4`;
      await fetch(`/output/${outputName}`, { method: "PUT", body: output });
      let playback = null;
      if (output !== file) {
        const video = document.createElement("video");
        const url = URL.createObjectURL(output);
        try {
          video.muted = true; video.src = url;
          playback = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Output playback timed out")), 15000);
            video.onerror = () => { clearTimeout(timeout); reject(new Error(video.error?.message || "Output playback failed")); };
            video.onloadeddata = () => {
              clearTimeout(timeout);
              resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration });
            };
            video.load();
          });
          await video.play();
        } finally { video.pause(); video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url); }
      }
      return { name: label || name, originalBytes: file.size, outputBytes: output.size, skipped: output === file,
        type: output.type, elapsedMs, stages, progress, playback, outputName, decoderSupported,
        ...(roundTimestamps ? { roundedFrames, roundedChunks, videoTimeline } : {}),
        // Chromium JS heap is not decoder/encoder/GPU memory or peak process memory.
        jsHeapBytesAfter: performance.memory?.usedJSHeapSize ?? null };
    }, { ...item, targetWidth, targetBitrate, traceCodecs: !!process.env.VIDEO_TEST_TRACE_CODECS });
    console.log(JSON.stringify({ ...result, progress: `${result.progress.length} callbacks, last=${result.progress.at(-1)}` }));
    assert.equal(result.skipped, !(item.compressed && result.decoderSupported !== false),
      `${result.name}: unexpected compression/fallback result`);
    if (result.decoderSupported === false) console.log(`${result.name}: host has no HEVC decoder; verified original fallback only`);
    assert.equal(result.progress.at(-1), 1, `${result.name}: progress must finish at 1`);
    assert(result.progress.every((p, i, values) => p >= 0 && p <= 1 && (!i || p >= values[i - 1])), "Progress must be bounded and monotonic");
    if (!result.skipped) {
      assert(result.outputBytes < result.originalBytes, "Compression must make the file smaller");
      const before = probe(inputPath(item.name));
      const after = probe(inputPath(result.outputName));
      const video = after.streams.find((stream) => stream.codec_type === "video");
      assert.equal(video.codec_name, "h264");
      assert.equal(after.streams.filter((s) => s.codec_type === "audio").length,
        before.streams.filter((s) => s.codec_type === "audio").length, "Audio-track count changed");
      assert(Math.abs(Number(before.format.duration) - Number(after.format.duration)) < 0.2, "Duration changed");
      assert(result.playback.width <= targetWidth, "Display width exceeds configured maximum");
      assert(Math.abs(evalFraction(video.avg_frame_rate) - 15) < 1, "Unexpected output frame rate");
      if (item.rotated) assert(result.playback.height > result.playback.width, "Portrait display orientation was lost");
      const sourceAudio = audioPackets(inputPath(item.name));
      const outputAudio = audioPackets(inputPath(result.outputName));
      assert.deepEqual(outputAudio.map((p) => p.data_hash), sourceAudio.map((p) => p.data_hash), "AAC samples must remain byte-for-byte identical");
      if (sourceAudio.length) {
        const sourceVideo = before.streams.find((s) => s.codec_type === "video");
        const a = before.streams.find((s) => s.codec_type === "audio");
        const b = after.streams.find((s) => s.codec_type === "audio");
        const sourceOffset = Number(a.start_time) - Number(sourceVideo.start_time);
        const outputOffset = Number(b.start_time) - Number(video.start_time);
        assert(Math.abs(sourceOffset - outputOffset) < 0.03, `A/V start offset changed (${sourceOffset} -> ${outputOffset})`);
      }
      ffmpeg(["-i", inputPath(result.outputName), "-f", "null", "-"]);
      if (item.roundTimestamps) {
        assert(result.roundedFrames > 0 && result.roundedChunks > 0, "Timestamp regression must exercise both rounding stages");
        assert.equal(result.videoTimeline.firstOutputCtsUs, result.videoTimeline.firstSourceCtsUs,
          "Rounding must not shift the source composition timeline");
        assert.deepEqual(videoPackets(inputPath(result.outputName)), videoPackets(inputPath("output-bframes.mp4.mp4")),
          "Rounding must preserve every output video packet timestamp and duration");
        assert(result.stages.at(-1).diagnostics.timestampCorrections >= result.roundedFrames + result.roundedChunks,
          "Diagnostics must report the injected timestamp corrections");
      }
      result.mediaDurationSeconds = Number(before.format.duration);
      result.realtimeFactor = result.mediaDurationSeconds / (result.elapsedMs / 1000);
      result.savingsPercent = 100 * (1 - result.outputBytes / result.originalBytes);
      result.codecs = after.streams.map((s) => s.codec_name);
      result.outputDimensions = [video.width, video.height];
      result.audioPacketsPreserved = sourceAudio.length;
    } else {
      assert.deepEqual(await readFile(inputPath(result.outputName)), await readFile(inputPath(item.name)), "Fallback changed original bytes");
    }
    results.push(result);
    await writeFile(inputPath("results.json"), JSON.stringify(results, null, 2));
  }
  let imageChecks = 0;
  if (!process.env.VIDEO_TEST_CASE) {
    const imageResult = await evaluate(async (libURL) => {
      const { compressMedia } = await import("/app/utils/compressMedia/index.js");
      const canvas = document.createElement("canvas");
      canvas.width = 1600; canvas.height = 1000;
      const context = canvas.getContext("2d");
      const pixels = context.createImageData(canvas.width, canvas.height);
      let seed = 12345;
      for (let i = 0; i < pixels.data.length; i += 4) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        pixels.data[i] = seed >>> 24;
        pixels.data[i + 1] = seed >>> 16 & 255;
        pixels.data[i + 2] = seed >>> 8 & 255;
        pixels.data[i + 3] = 255;
      }
      context.putImageData(pixels, 0, 0);
      const jpeg = await new Promise((resolve, reject) => canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("JPEG fixture creation failed")), "image/jpeg", 1));
      canvas.width = 1; canvas.height = 1;
      const file = new File([jpeg], "noise.jpg", { type: "image/jpeg" });
      const progress = [];
      const started = performance.now();
      const output = await compressMedia(file, (value) => progress.push(value), {
        profile: "lowEnd", imageCompressionOptions: { libURL },
      });
      const elapsedMs = performance.now() - started;
      const decoded = await createImageBitmap(output);
      const dimensions = [decoded.width, decoded.height];
      decoded.close();
      return { name: "image-jpeg", originalBytes: file.size, outputBytes: output.size,
        skipped: output === file, elapsedMs, dimensions, progress };
    }, `${origin}${imageWorkerLibraryPath}`);
    assert.equal(imageResult.skipped, false, "JPEG should compress");
    assert(imageResult.outputBytes < imageResult.originalBytes, "JPEG output must be smaller");
    assert(Math.max(...imageResult.dimensions) <= 1024, "JPEG dimensions exceed the lowEnd profile");
    assert(imageWorkerLibraryRequests > 0, "Image compression must load the local worker library");
    assert.equal(imageResult.progress[0], 0, "JPEG progress must start at 0");
    assert.equal(imageResult.progress.at(-1), 1, "JPEG progress must finish at 1");
    assert(imageResult.progress.every((p, i, values) => p >= 0 && p <= 1 && (!i || p >= values[i - 1])),
      "JPEG progress must be bounded and monotonic");
    console.log(JSON.stringify({ ...imageResult,
      progress: `${imageResult.progress.length} callbacks, last=${imageResult.progress.at(-1)}` }));
    imageChecks++;

    const corruptResult = await evaluate(async (libURL) => {
      const { compressMedia } = await import("/app/utils/compressMedia/index.js");
      const file = new File([new Uint8Array(1024).fill(3)], "corrupt.jpg", { type: "image/jpeg" });
      const progress = [];
      const output = await compressMedia(file, (value) => progress.push(value), {
        profile: "lowEnd", imageCompressionOptions: { libURL },
      });
      return { name: "image-corrupt", skipped: output === file, progress };
    }, `${origin}${imageWorkerLibraryPath}`);
    assert.equal(corruptResult.skipped, true, "Corrupt JPEG must retain the exact original file");
    assert.equal(corruptResult.progress[0], 0, "Corrupt JPEG progress must start at 0");
    assert.equal(corruptResult.progress.at(-1), 1, "Corrupt JPEG progress must finish at 1");
    assert(corruptResult.progress.every((p, i, values) => p >= 0 && p <= 1 && (!i || p >= values[i - 1])),
      "Corrupt JPEG progress must be bounded and monotonic");
    console.log(JSON.stringify(corruptResult));
    await writeFile(inputPath("image-results.json"), JSON.stringify([imageResult, corruptResult], null, 2));
    imageChecks++;
  }
  console.log(`Passed ${results.length} video browser cases and ${imageChecks} image checks. Artifacts: ${directory}`);
} finally {
  connection?.close();
  browser?.kill("SIGTERM");
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}

function evalFraction(value) {
  const [numerator, denominator = 1] = value.split("/").map(Number);
  return numerator / denominator;
}
