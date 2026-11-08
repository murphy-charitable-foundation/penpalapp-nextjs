const recordingTypes = [
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
];

export function getAudioRecordingError(error) {
  switch (error?.name) {
    case "InsecureContextError":
      return "Microphone recording requires a secure connection. Open this site using HTTPS, then try again.";
    case "UnsupportedRecordingError":
      return "Voice recording is not available in this browser. Try an updated Safari or Chrome browser.";
    case "NotAllowedError":
    case "SecurityError":
      return "Microphone access is blocked. Allow microphone access for this site in your browser and device settings, then try again.";
    case "NotFoundError":
      return "No microphone was found. Connect a microphone and try again.";
    case "NotReadableError":
    case "AbortError":
      return "The microphone could not start. Close other apps using it, then try again.";
    case "NotSupportedError":
      return "This browser could not start an audio recording. Try an updated browser.";
    case "EmptyRecordingError":
      return "No audio was recorded. Please record your message again.";
    default:
      return "The audio recording could not be completed. Please try again.";
  }
}

export async function createAudioRecorder(browser = globalThis) {
  if (typeof browser.navigator?.mediaDevices?.getUserMedia !== "function") {
    if (browser.isSecureContext === false) {
      throw new DOMException("Microphone recording requires HTTPS", "InsecureContextError");
    }
    throw new DOMException("Audio recording is unavailable", "UnsupportedRecordingError");
  }
  if (typeof browser.MediaRecorder !== "function") {
    throw new DOMException("Audio recording is unavailable", "UnsupportedRecordingError");
  }

  // Let the browser enforce access and request permission when capture is available.
  const stream = await browser.navigator.mediaDevices.getUserMedia({ audio: true });
  try {
    const mimeType = recordingTypes.find((type) => browser.MediaRecorder.isTypeSupported?.(type));
    return mimeType
      ? new browser.MediaRecorder(stream, { mimeType })
      : new browser.MediaRecorder(stream);
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    throw error;
  }
}

export function disposeAudioRecorder(recorder) {
  if (!recorder) return;
  recorder.ondataavailable = null;
  recorder.onstop = null;
  recorder.onerror = null;
  try {
    if (recorder.state !== "inactive") recorder.stop();
  } finally {
    recorder.stream.getTracks().forEach((track) => track.stop());
  }
}

export function getVoiceFileName(blob) {
  const type = blob.type.split(";")[0].toLowerCase();
  const extension = {
    "audio/mp4": "m4a",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/mpeg": "mp3",
  }[type] || "audio";
  return `voice_${Date.now()}.${extension}`;
}

export function createRecordingBlob(chunks, mimeType) {
  const type = chunks.find((chunk) => chunk.type)?.type || mimeType;
  const blob = new Blob(chunks, { type });
  if (!blob.size) throw new DOMException("No audio was recorded", "EmptyRecordingError");
  return blob;
}
