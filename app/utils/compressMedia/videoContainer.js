// Container work is kept out of the initial upload bundle. Encoded source data is
// read only on demand; AAC payloads are copied as Blob slices without decoding.
const MB = 1024 * 1024;
const MICROSECONDS = 1_000_000;
let modulePromise;
const loadMp4Box = () => (modulePromise ||= import("mp4box"));
const sampleCache = new WeakMap();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function checkpoint(options) {
  if (options.signal?.aborted) throw new Error("Video compression cancelled");
  options.checkpoint?.();
}

function limits(options) {
  return {
    samples: Math.min(options.videoMaxSamples || 100000, 100000),
    duration: Math.min(options.videoMaxDurationSeconds || 600, 3600),
    metadata: 16 * MB,
  };
}

function bytes(value) {
  return value instanceof ArrayBuffer
    ? new Uint8Array(value)
    : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

function serialize(box, MP4Box) {
  const stream = new MP4Box.DataStream();
  box.write(stream);
  return stream.buffer;
}

// Reject declared sample counts before MP4Box expands constant-size sample
// tables. A small metadata box can otherwise allocate millions of objects.
function countDeclaredSamples(buffer, maximum) {
  const view = new DataView(buffer);
  let count = 0;
  const containers = new Set(["moov", "trak", "mdia", "minf", "stbl", "moof", "traf"]);
  const walk = (start, end, depth) => {
    assert(depth <= 8, "MP4 metadata nesting exceeds compression budget");
    for (let offset = start; offset < end;) {
      assert(offset + 8 <= end, "Truncated MP4 metadata header");
      let size = view.getUint32(offset);
      const type = String.fromCharCode(...new Uint8Array(buffer, offset + 4, 4));
      let headerSize = 8;
      if (size === 1) {
        assert(offset + 16 <= end, "Truncated MP4 extended metadata header");
        size = view.getUint32(offset + 8) * 4294967296 + view.getUint32(offset + 12);
        headerSize = 16;
      } else if (size === 0) size = end - offset;
      assert(Number.isSafeInteger(size) && size >= headerSize && size <= end - offset,
        "Invalid MP4 metadata bounds");
      const data = offset + headerSize;
      if (type === "stsz" || type === "stz2" || type === "trun") {
        const countOffset = data + (type === "trun" ? 4 : 8);
        assert(countOffset + 4 <= offset + size, "Truncated MP4 sample count");
        count += view.getUint32(countOffset);
        assert(count <= maximum, "Video has too many samples to compress safely");
      } else if (containers.has(type)) walk(data, offset + size, depth + 1);
      offset += size;
    }
  };
  walk(0, buffer.byteLength, 0);
  return count;
}

// Read top-level box headers and skip mdat payloads entirely. This also handles
// phone MOVs with moov at the end without retaining the intervening video.
async function parseMetadata(blob, options, MP4Box) {
  const parser = MP4Box.createFile(false);
  const bounds = limits(options);
  const mediaRanges = [];
  let metadataBytes = 0;
  let declaredSamples = 0;
  let error;
  parser.onError = (message) => { error = new Error(String(message)); };
  for (let offset = 0; offset < blob.size;) {
    checkpoint(options);
    const header = await blob.slice(offset, offset + 16).arrayBuffer();
    assert(header.byteLength >= 8, "Truncated MP4 box header");
    const view = new DataView(header);
    const type = String.fromCharCode(...new Uint8Array(header, 4, 4));
    let size = view.getUint32(0);
    let headerSize = 8;
    if (size === 1) {
      assert(header.byteLength === 16, "Truncated MP4 extended box header");
      size = view.getUint32(8) * 4294967296 + view.getUint32(12);
      headerSize = 16;
    } else if (size === 0) {
      size = blob.size - offset;
    }
    assert(Number.isSafeInteger(size) && size >= headerSize && size <= blob.size - offset,
      "Invalid MP4 box bounds");
    let buffer;
    if (type === "mdat") {
      mediaRanges.push([offset + headerSize, offset + size]);
      buffer = header.slice(0, headerSize);
      // MP4Box cannot infer the extent of a zero-sized mdat from a sparse read.
      if (view.getUint32(0) === 0) {
        assert(size <= 0xffffffff, "Unsupported large open-ended mdat");
        new DataView(buffer).setUint32(0, size);
      }
    } else {
      metadataBytes += size;
      assert(metadataBytes <= bounds.metadata, "MP4 metadata exceeds compression budget");
      buffer = await blob.slice(offset, offset + size).arrayBuffer();
      declaredSamples += countDeclaredSamples(buffer, bounds.samples - declaredSamples);
    }
    buffer.fileStart = offset;
    parser.appendBuffer(buffer);
    if (error) throw error;
    const sampleCount = parser.moov?.traks.reduce((count, track) => count + track.samples.length, 0) || 0;
    assert(sampleCount <= bounds.samples, "Video has too many samples to compress safely");
    offset += size;
  }
  parser.flush();
  if (error) throw error;
  assert(parser.moov && parser.ftyp && mediaRanges.length, "Complete MP4 metadata is unavailable");
  return { parser, mediaRanges };
}

function containsSample(ranges, sample) {
  let lo = 0;
  let hi = ranges.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (ranges[mid][0] <= sample.offset) lo = mid + 1;
    else hi = mid;
  }
  const range = ranges[lo - 1];
  return range && sample.offset + sample.size <= range[1];
}

function sampleMetadata(track, ranges) {
  // Reconstruct ordinary sample-table timestamps directly. MP4Box 2.4.1's
  // buildTrakSampleLists has boundary errors for variable-duration stts runs.
  const table = track.mdia.minf.stbl;
  const regular = table.stsz?.sample_sizes.length > 0;
  let timeRun = 0;
  let timeLeft = table.stts?.sample_counts[0] || 0;
  let compRun = 0;
  let compLeft = table.ctts?.sample_counts[0] || 0;
  let dts = 0;
  let previousEnd = null;
  const samples = track.samples.map((sample) => {
    const result = {
      offset: sample.offset, size: sample.size,
      dts: sample.dts, cts: sample.cts, duration: sample.duration,
      is_sync: Boolean(sample.is_sync),
    };
    if (regular) {
      assert(timeLeft > 0, "Incomplete video timing table");
      result.dts = dts;
      result.duration = table.stts.sample_deltas[timeRun];
      result.cts = dts + (table.ctts ? table.ctts.sample_offsets[compRun] : 0);
      dts += result.duration;
      if (--timeLeft === 0) timeLeft = table.stts.sample_counts[++timeRun] || 0;
      if (table.ctts && --compLeft === 0) compLeft = table.ctts.sample_counts[++compRun] || 0;
    }
    assert([result.offset, result.size, result.dts, result.cts, result.duration].every(Number.isSafeInteger)
      && result.size > 0 && result.size <= 16 * MB && result.duration > 0
      && result.dts >= 0 && result.cts >= 0 && sample.description_index === 0
      && containsSample(ranges, result), "Unsupported or incomplete MP4 sample");
    assert(previousEnd === null || result.dts === previousEnd, "Discontinuous MP4 decode timeline");
    previousEnd = result.dts + result.duration;
    return result;
  });
  assert(samples.length > 0, "MP4 track is empty");
  return samples;
}

function timeline(track, samples, movieTimescale) {
  const edits = (track.edits || []).map((edit) => ({ ...edit }));
  assert(edits.length <= 2, "Complex MP4 edit lists are unsupported");
  let gap = 0;
  let active = null;
  for (const edit of edits) {
    assert(Number.isSafeInteger(edit.segment_duration) && edit.segment_duration > 0
      && Number.isSafeInteger(edit.media_time) && edit.media_time >= -1
      && edit.media_rate_integer === 1 && edit.media_rate_fraction === 0,
    "Unsupported MP4 edit rate or range");
    if (edit.media_time === -1) {
      assert(!gap && !active, "Unsupported MP4 empty edit");
      gap = edit.segment_duration;
    } else {
      assert(!active, "Multiple MP4 media edits are unsupported");
      active = edit;
    }
  }
  assert(!edits.length || active, "MP4 has no playable edit");
  const first = samples.reduce((start, sample) => Math.min(start, sample.cts), Infinity);
  const last = samples.reduce((end, sample) => Math.max(end, sample.cts + sample.duration), 0);
  const mediaStart = active?.media_time || 0;
  const duration = active ? active.segment_duration / movieTimescale : track.movie_duration / movieTimescale;
  assert(duration > 0 && first <= mediaStart + track.timescale / 20
    && mediaStart + duration * track.timescale <= last + track.timescale / 20,
  "MP4 edits extend outside the playable samples");
  const startUs = Math.round(gap / movieTimescale * MICROSECONDS);
  const durationUs = Math.round(duration * MICROSECONDS);
  return { edits, mediaStart, startUs, durationUs, endUs: startUs + durationUs,
    mediaEndUs: Math.round(last / track.timescale * MICROSECONDS) };
}

function rotationFor(matrix) {
  assert(matrix?.length === 9 && matrix[2] === 0 && matrix[5] === 0
    && matrix[8] === 1073741824, "Unsupported video perspective transform");
  const linear = [matrix[0], matrix[1], matrix[3], matrix[4]].join(",");
  const rotations = new Map([
    ["65536,0,0,65536", 0], ["0,65536,-65536,0", 90],
    ["-65536,0,0,-65536", 180], ["0,-65536,65536,0", 270],
  ]);
  assert(rotations.has(linear), "Unsupported video rotation or mirroring");
  return rotations.get(linear);
}

function audioConfiguration(entry) {
  const esds = entry.esds || entry.wave?.esds;
  const config = esds?.esd?.findDescriptor(4)?.findDescriptor(5)?.data;
  assert(esds && config?.length >= 2, "AAC decoder configuration is missing");
  let at = 0;
  const read = (length) => {
    assert(at + length <= config.length * 8, "Truncated AAC configuration");
    let value = 0;
    while (length--) value = value * 2 + ((config[at >>> 3] >>> (7 - (at++ & 7))) & 1);
    return value;
  };
  assert(read(5) === 2, "Only AAC LC audio can be copied safely");
  const rateIndex = read(4);
  const rates = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
  const rate = rateIndex === 15 ? read(24) : rates[rateIndex];
  const channels = read(4);
  assert(rate && rate <= 65535 && [1, 2].includes(channels)
    && entry.samplerate === rate && entry.channel_count === channels,
  "Unsupported AAC channel layout or sample rate");
  assert(read(3) === 0, "Unsupported AAC frame length or extension");
  if (config.length * 8 - at >= 16) {
    assert(read(11) === 0x2b7 && read(5) === 5 && read(1) === 0,
      "AAC SBR extensions cannot be copied by this pipeline");
  }
  while (at < config.length * 8) assert(read(1) === 0, "Unsupported AAC configuration extension");
  return { esds, config: Uint8Array.from(config), rate, channels };
}

function videoConfiguration(entry, codec) {
  const hevc = /^(hvc1|hev1)\./i.test(codec);
  const config = hevc ? entry.hvcC : /^avc1\./i.test(codec) && entry.avcC;
  assert(config, "Unsupported video codec or missing decoder configuration");
  const boxes = entry.boxes || [];
  assert(!boxes.some((box) => ["dvcC", "dvvC", "dvwC", "mdcv", "clli"].includes(box.type)),
    "HDR or Dolby Vision video requires the original file");
  for (const color of boxes.filter((box) => box.type === "colr")) {
    // QuickTime's nclc uses the same first three color fields as nclx, but
    // MP4Box 2.4.1 only parses nclx. Check every box, including hev1.colrs.
    const transfer = color.colour_type === "nclc" && color.data?.byteLength >= 10
      ? new DataView(color.data.buffer, color.data.byteOffset, color.data.byteLength).getUint16(6)
      : color.transfer_characteristics;
    assert(![16, 18].includes(transfer), "HDR video requires the original file");
  }
  if (hevc) {
    // Native decoding is probed later. Admit ordinary Main-profile phone
    // recordings; 10-bit/HDR and extended profiles need explicit tone mapping.
    assert(config.configurationVersion === 1 && config.general_profile_space === 0
      && config.general_profile_idc === 1 && config.chroma_format_idc === 1
      && config.bit_depth_luma_minus8 === 0 && config.bit_depth_chroma_minus8 === 0,
    "Only 8-bit HEVC Main video can be compressed safely");
  }
  return config;
}

/** Inspect H.264 or SDR HEVC MOV/MP4 with optional AAC, without extracting payloads. */
export async function inspectSource(blob, options = {}) {
  const MP4Box = await loadMp4Box();
  const { parser, mediaRanges } = await parseMetadata(blob, options, MP4Box);
  const info = parser.getInfo();
  const bounds = limits(options);
  assert(Number.isSafeInteger(info.timescale) && info.timescale > 0
    && info.duration > 0 && info.duration / info.timescale <= bounds.duration,
  "Video duration exceeds the compression budget");
  const videoTracks = parser.moov.traks.filter((track) => track.mdia.hdlr.handler === "vide");
  const audioTracks = parser.moov.traks.filter((track) => track.mdia.hdlr.handler === "soun");
  assert(videoTracks.length === 1 && info.videoTracks.length === 1
    && audioTracks.length <= 1 && info.audioTracks.length === audioTracks.length,
  "Unsupported video or audio track layout");
  const video = info.videoTracks[0];
  const audio = info.audioTracks[0] || null;
  const videoTrack = videoTracks[0];
  const audioTrack = audioTracks[0];
  const videoEntries = videoTrack.mdia.minf.stbl.stsd.entries;
  const videoEntry = videoEntries[0];
  assert(videoEntries.length === 1 && !videoEntry.sinf && !videoEntry.clap
    && (!videoEntry.pasp || videoEntry.pasp.hSpacing === videoEntry.pasp.vSpacing),
  "Unsupported video description, encryption or pixel geometry");
  const videoConfig = videoConfiguration(videoEntry, video.codec);
  const width = videoEntry.width;
  const height = videoEntry.height;
  assert(width > 0 && height > 0 && width * height <= 33554432,
    "Video dimensions exceed the compression budget");
  const matrix = Array.from(videoTrack.tkhd.matrix);
  const rotation = rotationFor(matrix);
  const videoSamples = sampleMetadata(videoTrack, mediaRanges);
  assert(videoSamples[0].is_sync, "Video does not begin with a key frame");
  const videoTimeline = timeline(video, videoSamples, info.timescale);
  let audioEntry = null;
  let audioSamples = [];
  let audioTimeline = null;
  let audioConfig = null;
  if (audio) {
    const entries = audioTrack.mdia.minf.stbl.stsd.entries;
    audioEntry = entries[0];
    assert(entries.length === 1 && audio.codec === "mp4a.40.2" && !audioEntry.sinf,
      "Only a single AAC LC audio description is supported");
    audioConfig = audioConfiguration(audioEntry);
    audioSamples = sampleMetadata(audioTrack, mediaRanges);
    assert(audioSamples.every((sample) => sample.cts === sample.dts), "Unsupported AAC presentation timeline");
    audioTimeline = timeline(audio, audioSamples, info.timescale);
  }
  assert(videoSamples.length + audioSamples.length <= bounds.samples,
    "Video has too many samples to compress safely");
  return {
    blob, info, video, audio, videoEntry, audioEntry, audioConfig,
    videoSamples, audioSamples, videoTimeline, audioTimeline,
    width, height, matrix, rotation, duration: info.duration / info.timescale,
    // Preserve the original configuration bytes. Reserializing hvcC through
    // MP4Box 2.4.1 changes reserved bits and can lose temporal-layer flags.
    videoDescription: await blob.slice(videoConfig.start + videoConfig.hdr_size,
      videoConfig.start + videoConfig.size).arrayBuffer(),
    audioBytes: audioSamples.reduce((total, sample) => total + sample.size, 0),
  };
}

/** At most one bounded read-ahead buffer per input Blob; never cache all frames. */
export async function readSample(blob, sample) {
  let cached = sampleCache.get(blob);
  if (!cached || sample.offset < cached.start || sample.offset + sample.size > cached.end) {
    const end = Math.min(blob.size, sample.offset + Math.max(MB, sample.size));
    cached = { start: sample.offset, end, data: await blob.slice(sample.offset, end).arrayBuffer() };
    sampleCache.set(blob, cached);
  }
  return new Uint8Array(cached.data, sample.offset - cached.start, sample.size);
}

export function releaseSource(source) {
  sampleCache.delete(source.blob);
}

function addEdits(track, sourceTimeline, sourceTimescale, outputTimescale, MP4Box) {
  if (!sourceTimeline.edits.length) return;
  const edits = new MP4Box.BoxParser.box.elst();
  edits.entries = sourceTimeline.edits.map((edit) => ({ ...edit,
    media_time: edit.media_time < 0 ? -1 : Math.round(edit.media_time / sourceTimescale * outputTimescale),
  }));
  const container = new MP4Box.BoxParser.box.edts();
  container.addBox(edits);
  track.addBox(container);
}

function equalBytes(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/** Mux original-media-timeline WebCodecs AVC samples and unchanged AAC. */
export async function muxVideo(source, encoded, options = {}) {
  const MP4Box = await loadMp4Box();
  checkpoint(options);
  const samples = encoded.samples.map((sample) => ({
    data: bytes(sample.data), cts: sample.timestamp, dts: sample.timestamp,
    duration: sample.duration, is_sync: sample.type === "key",
  }));
  assert(samples.length && samples[0].is_sync, "Encoded video is missing its key frame");
  let previousEnd = null;
  for (const sample of samples) {
    assert([sample.cts, sample.duration].every(Number.isSafeInteger)
      && sample.cts >= 0 && sample.duration > 0 && sample.data.byteLength > 0
      && (previousEnd === null || sample.dts === previousEnd),
    "Encoded video has an incomplete or reordered timeline");
    previousEnd = sample.dts + sample.duration;
  }
  const tolerance = 2;
  assert(Math.abs(previousEnd - source.videoTimeline.mediaEndUs) <= tolerance,
    "Encoded video does not preserve the original end time");
  const file = MP4Box.createFile();
  file.init({ timescale: source.info.timescale, duration: source.info.duration,
    brands: ["isom", "iso6", "avc1", "mp41"] });
  const description = bytes(encoded.description);
  const videoId = file.addTrack({ type: "avc1", hdlr: "vide",
    timescale: MICROSECONDS, duration: source.video.movie_duration,
    media_duration: previousEnd, width: encoded.width, height: encoded.height,
    language: source.video.language,
    avcDecoderConfigRecord: description.buffer.slice(description.byteOffset, description.byteOffset + description.byteLength),
  });
  const videoTrack = file.getTrackById(videoId);
  videoTrack.first_dts = 0;
  videoTrack.tkhd.volume = 0;
  videoTrack.tkhd.matrix = source.matrix.slice();
  // Translation is in display coordinates. Preserve pure phone rotations while
  // scaling their offsets to the new coded dimensions.
  videoTrack.tkhd.matrix[6] = Math.round(source.matrix[6] * (source.rotation % 180 ? encoded.height / source.height : encoded.width / source.width));
  videoTrack.tkhd.matrix[7] = Math.round(source.matrix[7] * (source.rotation % 180 ? encoded.width / source.width : encoded.height / source.height));
  addEdits(videoTrack, source.videoTimeline, source.video.timescale, MICROSECONDS, MP4Box);
  let audioId;
  if (source.audio) {
    audioId = file.addTrack({ type: "mp4a", hdlr: "soun",
      timescale: source.audio.timescale, duration: source.audio.movie_duration,
      media_duration: source.audio.duration, samplerate: source.audioConfig.rate,
      channel_count: source.audioConfig.channels, samplesize: source.audioEntry.samplesize,
      language: source.audio.language, description: source.audioConfig.esds,
    });
    const audioTrack = file.getTrackById(audioId);
    audioTrack.first_dts = 0;
    audioTrack.tkhd.width = 0;
    audioTrack.tkhd.height = 0;
    audioTrack.tkhd.volume = 256;
    addEdits(audioTrack, source.audioTimeline, source.audio.timescale, source.audio.timescale, MP4Box);
  }
  // getBuffer() returns a DataStream in MP4Box 2.4.1. Only serialize the small
  // initialization segment; media is emitted as bounded fragments + Blob slices.
  const parts = [file.getBuffer().buffer];
  const maximum = Math.min(options.maxOutputBytes || options.videoMaxOutputBytes || 64 * MB, source.blob.size);
  let total = parts[0].byteLength;
  let videoAt = 0;
  let audioAt = 0;
  while (videoAt < samples.length || audioAt < source.audioSamples.length) {
    checkpoint(options);
    const videoTime = videoAt < samples.length ? samples[videoAt].dts / MICROSECONDS : Infinity;
    const audioTime = audioAt < source.audioSamples.length
      ? source.audioSamples[audioAt].dts / source.audio.timescale : Infinity;
    const useVideo = videoTime <= audioTime;
    const input = useVideo ? samples : source.audioSamples;
    let at = useVideo ? videoAt : audioAt;
    const timescale = useVideo ? MICROSECONDS : source.audio.timescale;
    const trackId = useVideo ? videoId : audioId;
    const batch = [];
    const payloads = [];
    const endTime = input[at].dts + timescale / 2;
    let payloadSize = 0;
    do {
      const sample = input[at++];
      const payload = useVideo ? sample.data : source.blob.slice(sample.offset, sample.offset + sample.size);
      const size = useVideo ? payload.byteLength : payload.size;
      batch.push({ ...sample, track_id: trackId, size });
      payloads.push(payload);
      payloadSize += size;
    } while (at < input.length && batch.length < 32 && input[at].dts < endTime);
    const moof = file.createMoof(batch);
    moof.computeSize();
    moof.trafs[0].truns[0].data_offset = moof.size + 8;
    const fragment = serialize(moof, MP4Box);
    const mdat = new Uint8Array(8);
    new DataView(mdat.buffer).setUint32(0, payloadSize + 8);
    mdat.set([109, 100, 97, 116], 4);
    total += fragment.byteLength + 8 + payloadSize;
    assert(total < maximum, "Compressed video exceeds the output size budget");
    parts.push(fragment, mdat, ...payloads);
    if (useVideo) videoAt = at;
    else audioAt = at;
  }
  const output = new Blob(parts, { type: "video/mp4" });
  const checked = await inspectSource(output, options);
  assert(checked.videoSamples.length === samples.length
    && checked.audioSamples.length === source.audioSamples.length
    && Boolean(checked.audio) === Boolean(source.audio)
    && checked.width === encoded.width && checked.height === encoded.height
    && checked.rotation === source.rotation
    && Math.abs(checked.duration - source.duration) < 1 / source.info.timescale,
  "Muxed video failed track or duration validation");
  for (let i = 0; i < samples.length; i++) {
    const actual = checked.videoSamples[i];
    const expected = samples[i];
    assert(actual.cts === expected.cts && actual.dts === expected.dts && actual.duration === expected.duration,
      "Muxed video timestamps changed");
  }
  if (source.audio) {
    assert(checked.audio.timescale === source.audio.timescale
      && equalBytes(checked.audioConfig.config, source.audioConfig.config)
      && checked.audioConfig.rate === source.audioConfig.rate
      && JSON.stringify(checked.audioTimeline.edits) === JSON.stringify(source.audioTimeline.edits),
    "Muxed AAC configuration or edits changed");
    for (let i = 0; i < source.audioSamples.length; i++) {
      const actual = checked.audioSamples[i];
      const expected = source.audioSamples[i];
      assert(actual.size === expected.size && actual.dts === expected.dts
        && actual.cts === expected.cts && actual.duration === expected.duration,
      "Muxed AAC samples or timestamps changed");
    }
  }
  sampleCache.delete(source.blob);
  return output;
}
