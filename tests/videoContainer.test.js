import test from "node:test";
import assert from "node:assert/strict";
import * as MP4Box from "mp4box";
import { inspectSource, muxVideo, readSample, releaseSource } from "../app/utils/compressMedia/videoContainer.js";

// Small synthetic encoded payloads exercise container integrity. The browser
// harness separately decodes real AVC/HEVC/AAC fixtures and verifies unchanged audio.
const avcC = Uint8Array.from(Buffer.from("0142c00affe100176742c00ad9047b011000000300100000030140f122648001000568cb83cb20", "hex"));
// Main-profile 8-bit decoder configuration from a 64x48 libx265 test pattern.
const hvcC = Uint8Array.from(Buffer.from("0101600000009000000000001ef000fcfdf8f800000f03a00001001840010c01ffff01600000030090000003000003001e959809a10001002c42010101600000030090000003000003001ea02083165959ae4caf016a040402080000030008000003002040a2000100064401c173d089", "hex"));
const aacDescriptor = Uint8Array.from([3, 128, 128, 128, 37, 0, 2, 0, 4, 128,
  128, 128, 23, 64, 21, 0, 0, 0, 0, 0, 126, 198, 0, 0, 126, 198,
  5, 128, 128, 128, 5, 18, 8, 86, 229, 0, 6, 128, 128, 128, 1, 2]);

function edit(track, entries) {
  const edts = new MP4Box.BoxParser.box.edts();
  const elst = new MP4Box.BoxParser.box.elst();
  elst.entries = entries;
  edts.addBox(elst);
  track.addBox(edts);
}

function padding(length = 32768, type = "free") {
  const value = new Uint8Array(length);
  new DataView(value.buffer).setUint32(0, length);
  value.set(Buffer.from(type), 4);
  return value;
}

function rawBox(type, data) {
  const box = new MP4Box.Box();
  box.type = type;
  box.data = data;
  return box;
}

function colorBox(transfer, type = "nclx") {
  const data = new Uint8Array(type === "nclx" ? 11 : 10);
  data.set(Buffer.from(type));
  const view = new DataView(data.buffer);
  view.setUint16(4, 1);
  view.setUint16(6, transfer);
  view.setUint16(8, 1);
  return rawBox("colr", data);
}

function fixture({ audio = true, extraAudio = false, sampleRate = 44100,
  matrix, videoEdits, audioGap = 0, extend = padding(),
  videoType = "avc1", videoConfig = videoType === "avc1" ? avcC : hvcC, videoBoxes = [] } = {}) {
  const file = MP4Box.createFile();
  file.init({ timescale: 1000, duration: 1000 + audioGap, brands: ["isom"] });
  const video = file.addTrack({ type: videoType, timescale: 1000, duration: 1000,
    media_duration: 1000, width: 64, height: 48,
    [videoType === "avc1" ? "avcDecoderConfigRecord" : "hevcDecoderConfigRecord"]: videoConfig.buffer });
  const videoTrack = file.getTrackById(video);
  const entry = videoTrack.mdia.minf.stbl.stsd.entries[0];
  // Write source configuration verbatim so the fixture does not reproduce the
  // MP4Box hvcC writer's reserved-bit/temporal-layer changes.
  entry.boxes[0] = rawBox(videoType === "avc1" ? "avcC" : "hvcC", videoConfig);
  for (const box of videoBoxes) entry.addBox(box);
  if (matrix) videoTrack.tkhd.matrix = matrix;
  if (videoEdits) edit(videoTrack, videoEdits);
  for (let i = 0; i < 4; i++) file.addSample(video, new Uint8Array([0, 0, 0, 1, i]),
    { dts: i * 250, cts: i * 250, duration: 250, is_sync: i === 0 });
  for (let trackIndex = 0; trackIndex < (audio ? (extraAudio ? 2 : 1) : 0); trackIndex++) {
    const esds = new MP4Box.BoxParser.box.esds();
    esds.data = aacDescriptor.slice();
    const id = file.addTrack({ type: "mp4a", hdlr: "soun", timescale: 44100,
      duration: 1000 + audioGap, media_duration: 45124, samplerate: sampleRate,
      channel_count: 1, description: esds });
    edit(file.getTrackById(id), [
      ...(audioGap ? [{ segment_duration: audioGap, media_time: -1, media_rate_integer: 1, media_rate_fraction: 0 }] : []),
      { segment_duration: 1000, media_time: 1024, media_rate_integer: 1, media_rate_fraction: 0 },
    ]);
    for (let i = 0; i < 45; i++) file.addSample(id, new Uint8Array([31, i, 127]),
      { dts: i * 1024, cts: i * 1024, duration: i === 44 ? 68 : 1024, is_sync: true });
  }
  return new Blob([file.getBuffer().buffer, extend], { type: "video/mp4" });
}

async function encodedSource(source) {
  return {
    width: source.width, height: source.height, description: source.videoDescription,
    samples: await Promise.all(source.videoSamples.map(async (sample) => ({
      data: await readSample(source.blob, sample),
      timestamp: sample.cts / source.video.timescale * 1e6,
      duration: sample.duration / source.video.timescale * 1e6,
      type: sample.is_sync ? "key" : "delta",
    }))),
  };
}

test("metadata parsing skips large media payloads and returns no encoded samples", async () => {
  class ObservedBlob extends Blob {
    reads = [];
    slice(start, end) { this.reads.push([start, end]); return super.slice(start, end); }
  }
  const blob = new ObservedBlob([fixture({ extend: padding(4 * 1024 * 1024, "mdat") })]);
  const source = await inspectSource(blob);
  assert.equal(source.videoSamples.length, 4);
  assert.equal(source.audioSamples.length, 45);
  assert.equal(source.audioConfig.rate, 44100);
  assert.equal(source.audioTimeline.mediaStart, 1024);
  assert(source.videoSamples.every((sample) => !Object.hasOwn(sample, "data")));
  assert(blob.reads.reduce((count, [start, end]) => count + end - start, 0) < 20000);
  assert.deepEqual(await readSample(blob, source.audioSamples[3]), new Uint8Array([31, 3, 127]));
  releaseSource(source);
});

test("AVC and both HEVC sample entry types forward the exact decoder configuration", async () => {
  const avc = await inspectSource(fixture());
  assert.deepEqual(new Uint8Array(avc.videoDescription), avcC);
  for (const videoType of ["hvc1", "hev1"]) {
    const source = await inspectSource(fixture({ videoType }));
    assert.equal(source.video.codec, `${videoType}.1.6.L30.90`);
    assert.deepEqual(new Uint8Array(source.videoDescription), hvcC);
    assert.equal(source.videoSamples.length, 4);
    assert.equal(source.audioSamples.length, 45);
  }
});

test("HEVC accepts SDR while HDR color boxes and Dolby Vision keep the original", async () => {
  for (const videoType of ["avc1", "hvc1", "hev1"]) {
    for (const colorType of ["nclx", "nclc"]) {
      await inspectSource(fixture({ videoType, videoBoxes: [colorBox(1, colorType)] }));
      for (const transfer of [16, 18]) {
        await assert.rejects(inspectSource(fixture({ videoType,
          videoBoxes: [colorBox(1, colorType), colorBox(transfer, colorType)] })), /HDR/);
      }
    }
  }
  for (const type of ["dvcC", "dvvC", "dvwC", "mdcv", "clli"]) {
    await assert.rejects(inspectSource(fixture({ videoType: "hvc1",
      videoBoxes: [rawBox(type, new Uint8Array(32))] })), /HDR|Dolby Vision/);
  }
});

test("10-bit HEVC and non-Main profiles reject before invoking a decoder", async () => {
  for (const [offset, value] of [[1, 2], [17, 0xfa], [18, 0xfa], [16, 0xfe]]) {
    const videoConfig = hvcC.slice();
    videoConfig[offset] = value;
    await assert.rejects(inspectSource(fixture({ videoType: "hvc1", videoConfig })), /8-bit HEVC Main/);
  }
});

test("HEVC source can mux AVC output while keeping every original AAC sample", async () => {
  const source = await inspectSource(fixture({ videoType: "hvc1", audioGap: 350 }));
  const encoded = await encodedSource(source);
  encoded.description = avcC;
  const output = await muxVideo(source, encoded);
  const checked = await inspectSource(output);
  assert.match(checked.video.codec, /^avc1\./);
  assert.deepEqual(checked.audioTimeline.edits, source.audioTimeline.edits);
  for (let i = 0; i < checked.audioSamples.length; i++) {
    assert.deepEqual(await readSample(output, checked.audioSamples[i]),
      await readSample(source.blob, source.audioSamples[i]));
  }
});

test("mux preserves every AAC byte, sample rate, priming edit, and timestamp", async () => {
  const source = await inspectSource(fixture({ audioGap: 350 }));
  const output = await muxVideo(source, await encodedSource(source));
  const checked = await inspectSource(output);
  assert(output.size < source.blob.size);
  assert.equal(output.type, "video/mp4");
  assert.equal(checked.audioConfig.rate, 44100);
  assert.equal(checked.audioConfig.channels, 1);
  assert.equal(checked.audioTimeline.startUs, 350000);
  assert.deepEqual(checked.audioTimeline.edits, source.audioTimeline.edits);
  assert.deepEqual(checked.audioSamples.map(({ dts, cts, duration }) => ({ dts, cts, duration })),
    source.audioSamples.map(({ dts, cts, duration }) => ({ dts, cts, duration })));
  for (let i = 0; i < checked.audioSamples.length; i++) {
    assert.deepEqual(await readSample(output, checked.audioSamples[i]),
      await readSample(source.blob, source.audioSamples[i]));
  }
});

test("silent video remains without an audio track", async () => {
  const source = await inspectSource(fixture({ audio: false }));
  const checked = await inspectSource(await muxVideo(source, await encodedSource(source)));
  assert.equal(checked.audio, null);
  assert.equal(checked.videoSamples.length, 4);
});

test("quarter-turn phone orientation survives resized coded dimensions", async () => {
  const source = await inspectSource(fixture({ matrix: [0, 65536, 0, -65536, 0, 0, 48 * 65536, 0, 1073741824] }));
  assert.equal(source.rotation, 90);
  const encoded = await encodedSource(source);
  encoded.width = 32;
  encoded.height = 24;
  const checked = await inspectSource(await muxVideo(source, encoded));
  assert.equal(checked.rotation, 90);
  assert.equal(checked.matrix[6], 24 * 65536);
  assert.equal(checked.width, 32);
});

test("multiple audio tracks, mismatched AAC rate, and complex edits reject safely", async () => {
  await assert.rejects(inspectSource(fixture({ extraAudio: true })), /track layout/);
  await assert.rejects(inspectSource(fixture({ sampleRate: 48000 })), /sample rate/);
  await assert.rejects(inspectSource(fixture({ videoEdits: [
    { segment_duration: 1000, media_time: 0, media_rate_integer: 2, media_rate_fraction: 0 },
  ] })), /edit rate/);
});

test("truncated input and resource bounds abort without creating an output", async () => {
  const blob = fixture();
  await assert.rejects(inspectSource(blob.slice(0, blob.size - 1)), /box bounds/);
  await assert.rejects(inspectSource(blob, { videoMaxSamples: 8 }), /too many samples/);
  await assert.rejects(inspectSource(blob, { videoMaxDurationSeconds: 0.5 }), /duration/);
  await assert.rejects(inspectSource(blob, { signal: AbortSignal.abort() }), /cancelled/);
  const source = await inspectSource(blob);
  await assert.rejects(muxVideo(source, await encodedSource(source), { maxOutputBytes: 100 }), /size budget/);
});

test("tiny metadata declaring millions of constant-size samples rejects before allocation", async () => {
  const data = Buffer.from(await fixture().arrayBuffer());
  const at = data.indexOf(Buffer.from("stsz"));
  assert(at > 0);
  data.writeUInt32BE(1, at + 8); // constant sample size
  data.writeUInt32BE(100000000, at + 12); // declared sample count
  await assert.rejects(inspectSource(new Blob([data])), /too many samples/);
});

test("mux refuses missing tail frames and timestamp gaps", async () => {
  const source = await inspectSource(fixture());
  const encoded = await encodedSource(source);
  encoded.samples.pop();
  await assert.rejects(muxVideo(source, encoded), /end time/);
  const gapped = await encodedSource(source);
  gapped.samples[1].timestamp++;
  await assert.rejects(muxVideo(source, gapped), /timeline/);
});
