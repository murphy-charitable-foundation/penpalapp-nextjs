import test from "node:test";
import assert from "node:assert/strict";
import { compressAudio } from "../app/utils/compressMedia/audio.js";

const file = new Blob([new Uint8Array(1024)], { type: "audio/wav" });
const options = { audioBitsPerSecond: 56000 };
const settle = () => new Promise(setImmediate);

function browser(t, mode = "normal") {
  const observed = { timers: new Map(), revoked: [], contexts: [], recorders: [] };
  let timerId = 0;
  t.mock.method(globalThis, "setTimeout", (callback, delay) => {
    const id = ++timerId;
    observed.timers.set(id, { callback, delay });
    return id;
  });
  t.mock.method(globalThis, "clearTimeout", (id) => observed.timers.delete(id));
  t.mock.method(URL, "createObjectURL", () => "blob:audio-test");
  t.mock.method(URL, "revokeObjectURL", (url) => observed.revoked.push(url));

  class Audio extends EventTarget {
    constructor() {
      super();
      this.readyState = 0;
      this.duration = mode === "unknown-duration" ? Infinity : 2;
      this.currentTime = 0;
      this.listeners = new Set();
      observed.element = this;
    }
    addEventListener(type, listener) {
      this.listeners.add(listener);
      super.addEventListener(type, listener);
    }
    removeEventListener(type, listener) {
      this.listeners.delete(listener);
      super.removeEventListener(type, listener);
    }
    load() {
      if (!this.src || mode === "metadata-stall") return;
      this.readyState = 1;
      this.dispatchEvent(new Event("loadedmetadata"));
    }
    removeAttribute(name) { delete this[name]; }
    pause() { this.paused = true; this.dispatchEvent(new Event("pause")); }
    play() {
      if (mode === "play-rejected") return Promise.reject(new Error("Playback denied"));
      this.paused = false;
      if (mode === "play-stall") return Promise.resolve();
      queueMicrotask(() => {
        if (mode === "early-stop") {
          observed.recorders[0].stop();
          return;
        }
        this.currentTime = 1;
        this.dispatchEvent(new Event("timeupdate"));
        this.ended = true;
        this.dispatchEvent(new Event("ended"));
      });
      return Promise.resolve();
    }
  }

  class Context {
    constructor() { this.state = "suspended"; observed.contexts.push(this); }
    createMediaElementSource() {
      this.source = {
        connect(destination) { this.destination = destination; },
        disconnect() { this.disconnected = true; },
      };
      return this.source;
    }
    createMediaStreamDestination() {
      const track = { stop() { this.stopped = true; } };
      this.destination = {
        stream: { getAudioTracks: () => [track], getTracks: () => [track] },
        disconnect() { this.disconnected = true; },
      };
      return this.destination;
    }
    resume() {
      if (mode === "resume-stall") return new Promise(() => {});
      this.state = "running";
      return Promise.resolve();
    }
    close() { this.state = "closed"; return Promise.resolve(); }
  }

  class Recorder {
    static isTypeSupported() { return mode !== "unsupported"; }
    constructor(stream, { mimeType }) {
      this.mimeType = mimeType;
      this.state = "inactive";
      observed.recorders.push(this);
    }
    start() { this.state = "recording"; }
    stop() {
      this.state = "inactive";
      queueMicrotask(() => {
        this.ondataavailable?.({ data: new Blob(["encoded-audio"]) });
        this.onstop?.();
      });
    }
  }

  for (const [name, value] of Object.entries({
    window: { AudioContext: Context },
    document: { createElement: () => new Audio() },
    MediaRecorder: Recorder,
  })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else delete globalThis[name];
    });
  }

  observed.assertReleased = () => {
    assert.equal(observed.element.src, undefined);
    assert.equal(observed.element.paused, true);
    assert.equal(observed.element.listeners.size, 0);
    assert.equal(observed.timers.size, 0);
    assert.deepEqual(observed.revoked, ["blob:audio-test"]);
    for (const context of observed.contexts) {
      assert.equal(context.state, "closed");
      assert.equal(context.source.disconnected, true);
      assert.equal(context.destination.disconnected, true);
      assert.ok(context.destination.stream.getTracks().every((track) => track.stopped));
    }
    for (const recorder of observed.recorders) {
      assert.equal(recorder.state, "inactive");
      assert.equal(recorder.ondataavailable, null);
      assert.equal(recorder.onstop, null);
      assert.equal(recorder.onerror, null);
    }
  };
  return observed;
}

test("audio records through a silent graph and releases browser resources", async (t) => {
  const observed = browser(t);
  const progress = [];
  const output = await compressAudio(file, (value) => progress.push(value), options);
  assert.equal(output.type, "audio/webm;codecs=opus");
  assert.equal(await output.text(), "encoded-audio");
  assert.deepEqual(progress, [0.45]);
  assert.equal(observed.contexts[0].source.destination, observed.contexts[0].destination);
  observed.assertReleased();
});

test("audio capability skips preserve the exact input without allocating resources", async (t) => {
  const observed = browser(t, "unsupported");
  assert.equal(await compressAudio(file, null, options), file);
  assert.equal(observed.element, undefined);
  assert.deepEqual(observed.contexts, []);
});

test("audio rejects unknown duration before recording", async (t) => {
  const observed = browser(t, "unknown-duration");
  await assert.rejects(compressAudio(file, null, options), /Cannot determine audio duration/);
  assert.equal(observed.contexts.length, 0);
  observed.assertReleased();
});

for (const [mode, message] of [
  ["metadata-stall", /metadata loading timed out/],
  ["resume-stall", /context resume timed out/],
  ["play-stall", /recording timed out/],
]) {
  test(`audio ${mode} fails within a deadline and releases resources`, async (t) => {
    const observed = browser(t, mode);
    const pending = assert.rejects(compressAudio(file, null, options), message);
    await settle();
    assert.equal(observed.timers.size, 1);
    const [{ callback, delay }] = observed.timers.values();
    assert.equal(delay, mode === "play-stall" ? 20000 : 10000);
    callback();
    await pending;
    observed.assertReleased();
  });
}

for (const [mode, message] of [
  ["play-rejected", /Playback denied/],
  ["early-stop", /Recording stopped before audio ended/],
]) {
  test(`audio ${mode} releases recorder and graph resources`, async (t) => {
    const observed = browser(t, mode);
    await assert.rejects(compressAudio(file, null, options), message);
    observed.assertReleased();
  });
}
