import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const fixtures = new Map();
const fixtureKey = Symbol.for("compressMedia.test.fixtures");
globalThis[fixtureKey] = fixtures;
let nextFixture = 0;
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const mediaFile = (type, size = 100) => new Blob([new Uint8Array(size)], { type });
const options = { profile: "balanced", videoSkipBelowBytes: 0, audioSkipBelowBytes: 0 };

// Replace only the browser dependency import URLs. The public wrapper's actual
// source runs unchanged, without requiring browser globals or a Node loader.
async function harness(t, handlers = {}) {
  t.mock.method(console, "info", () => {});
  const id = nextFixture++;
  const state = { imports: [], handlers };
  fixtures.set(id, state);
  t.after(() => fixtures.delete(id));
  let source = await readFile(new URL("../app/utils/compressMedia/index.js", import.meta.url), "utf8");
  for (const [kind, specifier, exported] of [
    ["image", "./image.js", "default"],
    ["video", "./videoTranscoder.js", "compressVideo"],
    ["audio", "./audio.js", "compressAudio"],
  ]) {
    const stub = dataModule(`
      const fixture = globalThis[Symbol.for("compressMedia.test.fixtures")].get(${id});
      fixture.imports.push(${JSON.stringify(kind)});
      const compress = (...args) => fixture.handlers[${JSON.stringify(kind)}](...args);
      export { compress as ${exported} };
    `);
    // Exercise the real image adapter as well, replacing only its library.
    let replacement = stub;
    if (kind === "image") {
      const adapter = await readFile(new URL("../app/utils/compressMedia/image.js", import.meta.url), "utf8");
      replacement = dataModule(adapter.replace('"browser-image-compression"', JSON.stringify(stub)));
    }
    const target = `import(${JSON.stringify(specifier)})`;
    assert.ok(source.includes(target), `Expected lazy ${kind} import`);
    source = source.replace(target, `import(${JSON.stringify(replacement)})`);
  }
  const api = await import(dataModule(source));
  assert.deepEqual(state.imports, [], "Loading the API must not load compression dependencies");
  return { ...api, imports: state.imports };
}

function assertCompleteProgress(progress) {
  assert.equal(progress[0], 0);
  assert.equal(progress.at(-1), 1);
  assert.equal(progress.filter((value) => value === 1).length, 1, "Completion is reported once");
  assert.ok(progress.every((value, index) => Number.isFinite(value) && value >= 0 &&
    value <= 1 && (!index || value >= progress[index - 1])), "Progress stays bounded and monotonic");
}

test("images load only the image library and honor profile and image options", async (t) => {
  const file = mediaFile("image/jpeg");
  const output = mediaFile("image/jpeg", 50);
  const progress = [];
  const stages = [];
  let received;
  const api = await harness(t, {
    image: async (input, imageOptions) => {
      assert.equal(input, file);
      received = imageOptions;
      imageOptions.onProgress(40);
      imageOptions.onProgress(100);
      return output;
    },
  });
  assert.equal(await api.compressMedia(file, (value) => progress.push(value), {
    profile: "lowEnd",
    imageCompressionOptions: { maxSizeMB: 0.4, preserveExif: true },
  }, (stage) => stages.push(stage)), output);
  assert.deepEqual(api.imports, ["image"]);
  assert.equal(received.maxSizeMB, 0.4);
  assert.equal(received.maxWidthOrHeight, 1024);
  assert.equal(received.initialQuality, 0.65);
  assert.equal(received.useWebWorker, true);
  assert.equal(received.preserveExif, true);
  assert.deepEqual(stages, []);
  assertCompleteProgress(progress);
});

for (const [kind, type] of [["image", "image/png"], ["video", "video/mp4"], ["audio", "audio/webm;codecs=opus"]]) {
  test(`${kind} shares throttled, monotonic progress and accepts smaller output`, async (t) => {
    let now = 0;
    t.mock.method(performance, "now", () => now);
    const file = mediaFile(type);
    const output = mediaFile(type, 50);
    const progress = [];
    const stages = [];
    const api = await harness(t, {
      [kind]: async (input, reporter) => {
        assert.equal(input, file);
        const report = kind === "image" ? (value) => reporter.onProgress(value * 100) : reporter;
        for (const value of [0, 0.2, 0.15, 0.3, 0.6, 0.4, 0.8, 1, 1]) {
          now += 150;
          report(value);
        }
        return output;
      },
    });
    assert.equal(await api.compressMedia(file, (value) => progress.push(value), options,
      (stage) => stages.push(stage)), output);
    assert.deepEqual(api.imports, [kind]);
    assert.ok(progress.some((value) => value > 0 && value < 1), "Intermediate progress is forwarded");
    assertCompleteProgress(progress);
    assert.deepEqual(stages.map(({ diagnostics, ...stage }) => stage),
      kind === "video" ? [{ stage: "compression-output", blob: output, outcome: "recorded" }] : []);
    if (kind === "video") assert.equal(stages[0].diagnostics.reason, null);
  });

  test(`${kind} preserves the original on errors, empty output, larger output, and codec skips`, async (t) => {
    t.mock.method(console, "warn", () => {});
    const file = mediaFile(type);
    const results = [new Error("Unavailable codec or failed compression"), null,
      mediaFile(type, 0), mediaFile(type, 100), mediaFile(type, 101), file];
    let current;
    const api = await harness(t, {
      [kind]: async () => {
        if (current instanceof Error) throw current;
        return current;
      },
    });
    for (current of results) {
      const progress = [];
      const stages = [];
      assert.equal(await api.compressMedia(file, (value) => progress.push(value), options,
        (stage) => stages.push(stage)), file);
      assertCompleteProgress(progress);
      assert.deepEqual(stages.map(({ diagnostics, ...stage }) => stage),
        kind === "video" ? [{ stage: "compression-output", blob: file, outcome: "skipped" }] : []);
      if (kind === "video") assert.equal(stages[0].diagnostics.reason,
        current instanceof Error ? "compression-error" : "no-smaller-output");
    }
  });
}

test("image library progress overrides cannot disable public progress", async (t) => {
  let now = 0;
  t.mock.method(performance, "now", () => now);
  const file = mediaFile("image/jpeg");
  const progress = [];
  const api = await harness(t, {
    image: async (_file, imageOptions) => {
      now += 150;
      imageOptions.onProgress(50);
      return mediaFile("image/jpeg", 50);
    },
  });
  await api.compressMedia(file, (value) => progress.push(value), {
    imageCompressionOptions: { onProgress: () => {} },
  });
  assert.ok(progress.includes(0.5));
  assertCompleteProgress(progress);
});

test("progress bursts are throttled for every media type", async (t) => {
  t.mock.method(performance, "now", () => 0);
  for (const kind of ["image", "video", "audio"]) {
    const progress = [];
    const file = mediaFile(`${kind}/${kind === "image" ? "jpeg" : "mp4"}`);
    const api = await harness(t, {
      [kind]: async (_file, reporter) => {
        for (let value = 1; value <= 100; value++) {
          if (kind === "image") reporter.onProgress(value);
          else reporter(value / 100);
        }
        return file;
      },
    });
    await api.compressMedia(file, (value) => progress.push(value), options);
    assert.ok(progress.length <= 3, "A synchronous progress burst must not flood the UI");
    assertCompleteProgress(progress);
  }
});

test("unsupported file types still reject without loading compression modules", async (t) => {
  const api = await harness(t);
  await assert.rejects(api.compressMedia(mediaFile("application/pdf")), { message: "Unsupported file type" });
  assert.deepEqual(api.imports, []);
});

test("small audio and video files finish without loading their codecs", async (t) => {
  for (const kind of ["audio", "video"]) {
    const api = await harness(t);
    const file = mediaFile(`${kind}/mp4`);
    const progress = [];
    assert.equal(await api.compressMedia(file, (value) => progress.push(value)), file);
    assert.deepEqual(api.imports, []);
    assertCompleteProgress(progress);
  }
});

test("video logs and stage diagnostics explain native fallback without logging the file", async (t) => {
  const api = await harness(t, {
    video: async (file, _progress, _options, diagnostic) => {
      diagnostic({ phase: "codec-check", sourceCodec: "hvc1.1.6.L93.B0",
        reason: "decoder-unsupported", decoderSupported: false });
      return file;
    },
  });
  const logs = [];
  t.mock.method(console, "info", (...args) => logs.push(args));
  const file = mediaFile("video/quicktime");
  const stages = [];
  await api.compressMedia(file, null, options, (stage) => stages.push(stage));
  assert.equal(logs.length, 2);
  const [prefix, serialized] = logs.at(-1);
  assert.equal(prefix, "[media-compression] result");
  const details = JSON.parse(serialized);
  assert.equal(details.reason, "decoder-unsupported");
  assert.equal(details.sourceCodec, "hvc1.1.6.L93.B0");
  assert.equal(details.inputBytes, file.size);
  assert.equal(details.outputBytes, file.size);
  assert.equal(details.outcome, "skipped");
  assert.equal(details.decoderSupported, false);
  assert(Number.isFinite(details.elapsedMs));
  assert.deepEqual(details, stages[0].diagnostics);
  assert(!Object.hasOwn(details, "blob"));
});

test("video diagnostics distinguish small files and processing errors", async (t) => {
  t.mock.method(console, "warn", () => {});
  const api = await harness(t, { video: async () => { throw new Error("HDR video requires the original file"); } });
  const file = mediaFile("video/mp4");
  const stages = [];
  await api.compressMedia(file, null, {}, (stage) => stages.push(stage));
  await api.compressMedia(file, null, options, (stage) => stages.push(stage));
  assert.equal(stages[0].diagnostics.reason, "below-size-threshold");
  assert.equal(stages[1].diagnostics.reason, "compression-error");
  assert.equal(stages[1].diagnostics.message, "HDR video requires the original file");
});
