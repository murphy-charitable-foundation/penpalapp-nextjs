import test from "node:test";
import assert from "node:assert/strict";
import {
  createAudioRecorder,
  createRecordingBlob,
  disposeAudioRecorder,
  getAudioRecordingError,
  getVoiceFileName,
} from "../components/media/audioRecording.js";

function browser({ supported = ["audio/mp4"], defaultType = "audio/mp4", failure } = {}) {
  const observed = { requests: 0, stopped: 0 };
  const stream = { getTracks: () => [{ stop() { observed.stopped += 1; } }] };
  class Recorder {
    static isTypeSupported(type) { return supported.includes(type); }
    constructor(input, options) {
      if (failure) throw failure;
      this.stream = input;
      this.options = options;
      this.mimeType = options?.mimeType || defaultType;
      this.state = "inactive";
    }
    stop() { this.state = "inactive"; observed.recorderStopped = true; }
  }
  return {
    observed,
    isSecureContext: true,
    MediaRecorder: Recorder,
    navigator: { mediaDevices: { async getUserMedia(constraints) {
      assert.deepEqual(constraints, { audio: true });
      observed.requests += 1;
      return stream;
    } } },
  };
}

test("insecure origins explain HTTPS without asking for microphone permission", async () => {
  const env = browser();
  env.isSecureContext = false;
  await assert.rejects(createAudioRecorder(env), (error) => {
    assert.match(getAudioRecordingError(error), /HTTPS/);
    assert.doesNotMatch(getAudioRecordingError(error), /Allow microphone/);
    return error.name === "InsecureContextError";
  });
  assert.equal(env.observed.requests, 0);
});

test("missing capture or recorder APIs are reported before requesting microphone access", async () => {
  for (const missing of ["capture", "recorder"]) {
    const env = browser();
    if (missing === "capture") env.navigator.mediaDevices = undefined;
    else env.MediaRecorder = undefined;
    await assert.rejects(createAudioRecorder(env), { name: "UnsupportedRecordingError" });
    assert.equal(env.observed.requests, 0);
  }
});

test("MP4-only browsers record with their supported format", async () => {
  const env = browser();
  const recorder = await createAudioRecorder(env);
  assert.equal(recorder.mimeType, "audio/mp4");
  assert.equal(env.observed.requests, 1);
  assert.equal(env.observed.stopped, 0);
});

test("WebM-only browsers use Opus and retain that recording type", async () => {
  const recorder = await createAudioRecorder(browser({ supported: ["audio/webm;codecs=opus"] }));
  assert.equal(recorder.mimeType, "audio/webm;codecs=opus");
  const blob = createRecordingBlob([new Blob(["voice"])], recorder.mimeType);
  assert.equal(blob.type, "audio/webm;codecs=opus");
  assert.match(getVoiceFileName(blob), /\.webm$/);
});

test("browser default recording does not receive an empty or unsupported MIME option", async () => {
  const recorder = await createAudioRecorder(browser({ supported: [] }));
  assert.equal(recorder.options, undefined);
  assert.equal(recorder.mimeType, "audio/mp4");
});

test("recorder setup failure releases microphone tracks and retains the actual error", async () => {
  const failure = new DOMException("Encoder unavailable", "NotSupportedError");
  const env = browser({ failure });
  await assert.rejects(createAudioRecorder(env), (error) => error === failure);
  assert.equal(env.observed.stopped, 1);
  assert.doesNotMatch(getAudioRecordingError(failure), /permission|access is blocked/);
});

test("disposing a recorder releases the microphone and prevents late event handlers", async () => {
  for (const state of ["inactive", "recording"]) {
    const env = browser();
    const recorder = await createAudioRecorder(env);
    recorder.state = state;
    recorder.ondataavailable = recorder.onstop = recorder.onerror = () => assert.fail("late callback");
    disposeAudioRecorder(recorder);
    assert.equal(env.observed.stopped, 1);
    assert.equal(recorder.state, "inactive");
    assert.equal(recorder.ondataavailable, null);
    assert.equal(recorder.onstop, null);
    assert.equal(recorder.onerror, null);
    assert.equal(Boolean(env.observed.recorderStopped), state === "recording");
  }
});

test("recording uses actual MP4 chunk MIME and matching M4A filename", () => {
  const blob = createRecordingBlob([
    new Blob(["voice"], { type: "audio/mp4;codecs=mp4a.40.2" }),
  ], "audio/webm");
  assert.equal(blob.type, "audio/mp4;codecs=mp4a.40.2");
  assert.match(getVoiceFileName(blob), /^voice_\d+\.m4a$/);
});

test("empty recordings cannot be sent", () => {
  assert.throws(() => createRecordingBlob([], "audio/mp4"), { name: "EmptyRecordingError" });
});

test("permission, device, and recorder failures give different actionable messages", () => {
  assert.match(getAudioRecordingError({ name: "NotAllowedError" }), /Allow microphone access/);
  assert.match(getAudioRecordingError({ name: "NotFoundError" }), /No microphone/);
  assert.match(getAudioRecordingError({ name: "NotReadableError" }), /Close other apps/);
  assert.match(getAudioRecordingError({ name: "TypeError" }), /could not be completed/);
  assert.doesNotMatch(getAudioRecordingError({ name: "TypeError" }), /permission/);
});
