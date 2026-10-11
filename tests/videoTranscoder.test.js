import test from "node:test";
import assert from "node:assert/strict";
import { compressVideo, encodeVideo, getVideoConfigurations, getVideoPlan } from "../app/utils/compressMedia/videoTranscoder.js";

const MiB = 1024 * 1024;
const options = {
  videoMaxWidth: 640,
  videoFps: 15,
  videoBitsPerSecond: 650000,
  videoMinSavingsRatio: 0.25,
};

function sourceFixture() {
  // Decode order differs from presentation order; audio bytes follow the video.
  return {
    blob: new Blob([Uint8Array.from([11, 12, 13, 14, 91, 92])]),
    video: { timescale: 1000 },
    videoSamples: [0, 200, 100, 300].map((cts, i) => ({
      offset: i, size: 1, cts, dts: i * 100, duration: 100, is_sync: i === 0,
    })),
    audioSamples: [{ offset: 4, size: 2, cts: 0, dts: 0, duration: 400 }],
  };
}

const planFixture = (overrides = {}) => ({
  width: 320, height: 180, fps: 5, duration: 0.4,
  bitrate: 160000, audioBytes: 2, maxOutputBytes: MiB, ...overrides,
});
const config = { decoder: { codec: "avc1.640028" }, encoder: { codec: "avc1.420028" } };

// These mocks model callback ordering and resource ownership, not codec output.
// Real codec/container interoperability is covered by video-compression.browser.js.
function codecs(t, mode = "normal") {
  const observed = { frames: [], decoders: [], encoders: [], inputs: [], encodes: [] };
  const makeFrame = (timestamp, duration) => {
    const frame = { timestamp, duration, closed: false, close() { this.closed = true; } };
    if (mode === "hdr") frame.colorSpace = { transfer: "hlg" };
    observed.frames.push(frame);
    return frame;
  };

  class Codec extends EventTarget {
    constructor(init) {
      super();
      this.init = init;
      this.state = "unconfigured";
      this.listeners = new Set();
    }
    configure(value) { this.configuration = value; this.state = "configured"; }
    close() { this.state = "closed"; }
    addEventListener(type, listener) {
      this.listeners.add(listener);
      super.addEventListener(type, listener);
    }
    removeEventListener(type, listener) {
      this.listeners.delete(listener);
      super.removeEventListener(type, listener);
    }
  }

  class Decoder extends Codec {
    static async isConfigSupported() { return { supported: true }; }
    constructor(init) { super(init); this.decodeQueueSize = 0; observed.decoders.push(this); }
    decode(chunk) {
      observed.inputs.push(chunk);
      if (mode === "queue-stall") {
        this.init.output(makeFrame(chunk.timestamp, chunk.duration));
        this.decodeQueueSize = 4;
      }
    }
    async flush() {
      let inputs = [...observed.inputs].sort((a, b) => a.timestamp - b.timestamp);
      if (mode === "decoder-drop") inputs = inputs.slice(0, -1);
      for (const input of inputs) {
        const delta = ["decoder-rounding", "all-rounding"].includes(mode) ? -1 : mode === "decoder-retime" ? 10000 : 0;
        this.init.output(makeFrame(input.timestamp + delta, input.duration));
        if (mode === "decoder-error") { this.init.error(new Error("Decoder hardware failed")); return; }
        if (mode === "decoder-stall") return new Promise(() => {});
      }
    }
  }

  class Encoder extends Codec {
    static async isConfigSupported() { return { supported: true }; }
    constructor(init) { super(init); this.encodeQueueSize = 0; observed.encoders.push(this); }
    encode(frame, { keyFrame }) {
      assert.equal(frame.closed, false, "Only live frames may be encoded");
      observed.encodes.push({ timestamp: frame.timestamp, duration: frame.duration, keyFrame });
      if (mode === "encoder-error") this.init.error(new Error("Encoder hardware failed"));
    }
    async flush() {
      if (mode === "encoder-stall") return new Promise(() => {});
      let outputs = [...observed.encodes];
      if (mode === "encoder-drop") outputs = outputs.slice(0, -1);
      if (mode === "encoder-drop-middle") outputs.splice(1, 1);
      if (mode === "encoder-duplicate") outputs.splice(1, 0, outputs[0]);
      if (mode === "encoder-reorder") outputs = [outputs[0], ...outputs.slice(1).reverse()];
      outputs.forEach((frame, index) => {
        const data = Uint8Array.from([1, 2, 3, 4]);
        const chunk = {
          timestamp: frame.timestamp + (mode === "encoder-retime" ? 10000 :
            ["encoder-rounding", "all-rounding"].includes(mode) ? -1 : 0),
          type: frame.keyFrame ? "key" : "delta",
          byteLength: data.byteLength,
          copyTo(destination) { destination.set(data); },
        };
        const description = Uint8Array.from([1, 66, 0, mode === "changed-config" && index ? 41 : 40]);
        this.init.output(chunk, mode === "missing-config" ? {} : { decoderConfig: { description } });
      });
    }
  }

  class Frame {
    constructor(frame, init) {
      if (mode === "clone-error") throw new Error("VideoFrame cloning failed");
      assert.equal(frame.closed, false, "Only live frames may be cloned");
      return makeFrame(init.timestamp + (["clone-rounding", "all-rounding"].includes(mode) ? -1 : 0), init.duration);
    }
  }
  class Chunk { constructor(init) { Object.assign(this, init); } }
  for (const [name, value] of Object.entries({
    VideoDecoder: Decoder, VideoEncoder: Encoder, VideoFrame: Frame, EncodedVideoChunk: Chunk,
  })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else delete globalThis[name];
    });
  }
  observed.assertReleased = () => {
    assert.ok(observed.decoders.length && observed.encoders.length);
    for (const codec of [...observed.decoders, ...observed.encoders]) {
      assert.equal(codec.state, "closed", "Codec must close on success and failure");
      assert.equal(codec.listeners.size, 0, "Queue listeners must be removed");
    }
    for (const frame of observed.frames) assert.equal(frame.closed, true, "Every frame must close");
  };
  return observed;
}

test("frame reduction preserves presentation timing and never decodes the original audio", async (t) => {
  const observed = codecs(t);
  const source = sourceFixture();
  const audio = structuredClone(source.audioSamples);
  const progress = [];
  const encoded = await encodeVideo(source, planFixture(), config, (p) => progress.push(p));

  assert.deepEqual(observed.inputs.map((chunk) => chunk.timestamp), [0, 200000, 100000, 300000]);
  assert.deepEqual(observed.inputs.map((chunk) => [...chunk.data]), [[11], [12], [13], [14]]);
  assert.deepEqual(encoded.samples.map(({ timestamp, duration, type }) => ({ timestamp, duration, type })), [
    { timestamp: 0, duration: 200000, type: "key" },
    { timestamp: 200000, duration: 200000, type: "delta" },
  ]);
  assert.deepEqual(source.audioSamples, audio);
  assert.ok(progress.length > 0 && progress.every((p) => p >= 0.1 && p <= 0.85));
  assert.equal(encoded.width, 320);
  assert.equal(encoded.height, 180);
  observed.assertReleased();
});

test("frame reduction keeps nonzero source CTS instead of independently resetting the video clock", async (t) => {
  const observed = codecs(t);
  const source = sourceFixture();
  source.videoSamples.forEach((sample) => { sample.cts += 200; });
  const encoded = await encodeVideo(source, planFixture(), config);
  assert.deepEqual(encoded.samples.map(({ timestamp, duration }) => [timestamp, duration]), [
    [200000, 200000], [400000, 200000],
  ]);
  observed.assertReleased();
});

for (const mode of ["decoder-rounding", "clone-rounding", "encoder-rounding", "all-rounding"]) {
  test(`${mode} restores the exact source timeline and reports microsecond corrections`, async (t) => {
    const observed = codecs(t, mode);
    const source = sourceFixture();
    source.videoSamples.forEach((sample) => { sample.cts += 200; });
    const diagnostics = {};
    const encoded = await encodeVideo(source, planFixture(), config, null, {},
      (details) => Object.assign(diagnostics, details));
    assert.deepEqual(encoded.samples.map(({ timestamp, duration }) => [timestamp, duration]), [
      [200000, 200000], [400000, 200000],
    ]);
    assert(diagnostics.timestampCorrections > 0);
    assert.equal(diagnostics.maxTimestampCorrectionUs, 1);
    observed.assertReleased();
  });
}

test("large timestamp shifts report actual and expected times before refusing the output", async (t) => {
  const observed = codecs(t, "encoder-retime");
  const diagnostics = {};
  await assert.rejects(encodeVideo(sourceFixture(), planFixture(), config, null, {},
    (details) => Object.assign(diagnostics, details)), /expected 0 us, received 10000 us/);
  assert.deepEqual(diagnostics.timestampMismatch, {
    stage: "Encoder", expectedUs: 0, actualUs: 10000, deltaUs: 10000,
  });
  observed.assertReleased();
});

for (const [mode, expected] of [
  ["decoder-error", /Decoder hardware failed/],
  ["encoder-error", /Encoder hardware failed/],
  ["decoder-drop", /Decoder omitted frames/],
  ["encoder-drop", /Encoder omitted frames/],
  ["encoder-reorder", /Encoder changed video timestamps|Unexpected encoded frame reordering/],
  ["encoder-drop-middle", /Encoder changed video timestamps/],
  ["encoder-duplicate", /Unexpected encoded frame reordering/],
  ["encoder-retime", /Encoder changed video timestamps/],
  ["decoder-retime", /Decoder changed video timestamps/],
  ["missing-config", /Encoder omitted frames or AVC configuration/],
  ["changed-config", /Encoder changed AVC configuration/],
  ["clone-error", /VideoFrame cloning failed/],
  ["hdr", /HDR video requires the original file/],
]) {
  test(`${mode} rejects the result and releases codecs and frames`, async (t) => {
    const observed = codecs(t, mode);
    await assert.rejects(encodeVideo(sourceFixture(), planFixture({ fps: 10 }), config), expected);
    observed.assertReleased();
  });
}

for (const [mode, expected] of [
  ["decoder-stall", /Video decode timed out/],
  ["encoder-stall", /Video encode timed out/],
  ["queue-stall", /Codec queue timed out/],
]) {
  test(`${mode} times out and releases even a held decoded frame`, async (t) => {
    const observed = codecs(t, mode);
    await assert.rejects(encodeVideo(sourceFixture(), planFixture(), config, null,
      { videoCodecTimeoutMs: 10 }), expected);
    assert.ok(observed.frames.length > 0, "Exercise frame ownership during the timeout");
    observed.assertReleased();
  });
}

test("encoding aborts when encoded bytes plus copied audio exceed the output budget", async (t) => {
  const observed = codecs(t);
  await assert.rejects(encodeVideo(sourceFixture(), planFixture({
    maxOutputBytes: 405, audioBytes: 2,
  }), config), /Video output exceeds size budget/);
  observed.assertReleased();
});

test("plan scales rotated coded dimensions to the displayed width limit", () => {
  const plan = getVideoPlan({ size: 20 * MiB }, {
    width: 1920, height: 1080, rotation: 90, duration: 30, audioSamples: [],
  }, options);
  assert.ok(plan);
  assert.equal(plan.height, 640, "Coded height is display width after rotation");
  assert.equal(plan.width, 1136);
  assert.equal(plan.width % 2, 0);
  assert.equal(plan.height % 2, 0);
});

test("plan uses actual AAC byte size and skips audio-dominated videos with little saving", () => {
  const source = { width: 1280, height: 720, rotation: 0, duration: 10, audioSamples: [] };
  const file = { size: 2 * MiB };
  assert.ok(getVideoPlan(file, source, options));
  assert.equal(getVideoPlan(file, { ...source, audioSamples: [{ size: 1.5 * MiB }] }, {
    ...options, audioBitsPerSecond: 8000,
  }), null, "The old audio target cannot hide the size of copied AAC");
  const plan = getVideoPlan({ size: 10 * MiB }, {
    ...source, audioSamples: [{ size: 1234 }, { size: 5678 }],
  }, options);
  assert.equal(plan.audioBytes, 6912);
});

test("plan skips invalid metadata, excessive duration and outputs above the memory budget", () => {
  const source = { width: 1280, height: 720, rotation: 0, duration: 10, audioSamples: [] };
  const file = { size: 20 * MiB };
  assert.equal(getVideoPlan(file, { ...source, duration: Infinity }, options), null);
  assert.equal(getVideoPlan(file, { ...source, duration: 601 }, options), null);
  assert.equal(getVideoPlan(file, source, { ...options, videoFps: 0 }), null);
  assert.equal(getVideoPlan(file, source, { ...options, videoMaxOutputBytes: 1024 }), null);
});

test("configuration falls back to supported constrained Baseline and passes through HEVC configuration", async (t) => {
  codecs(t);
  const source = { video: { codec: "hvc1.1.6.L93.B0" }, width: 1920, height: 1080,
    videoDescription: Uint8Array.from([1, 2, 3]) };
  let checkedDecoder;
  t.mock.method(VideoDecoder, "isConfigSupported", async (value) => {
    checkedDecoder = value;
    return { supported: true };
  });
  t.mock.method(VideoEncoder, "isConfigSupported", async (value) => ({
    supported: value.codec === "avc1.42e01f",
  }));
  const details = {};
  const result = await getVideoConfigurations(source, planFixture(), (value) => Object.assign(details, value));
  assert.equal(checkedDecoder.codec, source.video.codec);
  assert.equal(checkedDecoder.description, source.videoDescription);
  assert.equal(result.encoder.codec, "avc1.42e01f");
  assert.equal(result.encoder.hardwareAcceleration, "prefer-hardware");
  assert.equal(result.encoder.latencyMode, "quality");
  assert.equal(details.decoderSupported, true);
  assert.equal(details.encoderSupported, true);
});

test("configuration can relax hardware preference without requesting an undersized AVC level", async (t) => {
  codecs(t);
  const tried = [];
  t.mock.method(VideoEncoder, "isConfigSupported", async (value) => {
    tried.push(value);
    if (value.hardwareAcceleration === "prefer-hardware") throw new TypeError("Unsupported preference");
    return { supported: true };
  });
  const source = { video: { codec: "avc1.640028" }, width: 1080, height: 1920 };
  const result = await getVideoConfigurations(source, planFixture({ width: 854, height: 1518 }));
  assert.equal(result.encoder.hardwareAcceleration, "no-preference");
  assert(tried.every(({ codec }) => codec.endsWith("28")), "Level 3.1 cannot fit these portrait dimensions");
});

test("configuration explains whether the decoder or encoder is unsupported", async (t) => {
  codecs(t);
  const source = { video: { codec: "hvc1.1.6.L93.B0" }, width: 1280, height: 720 };
  let decoderSupported = false;
  let encoderChecks = 0;
  t.mock.method(VideoDecoder, "isConfigSupported", async () => ({ supported: decoderSupported }));
  t.mock.method(VideoEncoder, "isConfigSupported", async () => {
    encoderChecks++;
    return { supported: false };
  });
  const details = [];
  assert.equal(await getVideoConfigurations(source, planFixture(), (value) => details.push(value)), null);
  assert.equal(encoderChecks, 0);
  assert.equal(details.at(-1).reason, "decoder-unsupported");
  decoderSupported = true;
  assert.equal(await getVideoConfigurations(source, planFixture(), (value) => details.push(value)), null);
  assert.equal(details.at(-1).reason, "encoder-unsupported");
  assert(encoderChecks <= 8, "Capability probing stays bounded");
});

test("missing native codecs return the original and explain the skip", async (t) => {
  codecs(t);
  delete globalThis.VideoEncoder;
  const file = new Blob([new Uint8Array(100)]);
  const details = [];
  assert.equal(await compressVideo(file, null, options, (value) => details.push(value)), file);
  assert.equal(details[0].reason, "native-codecs-unavailable");
});
