"use client";

import imageCompression from "browser-image-compression";

const VIDEO_MIME_TYPES = [
  "video/mp4;codecs=h264,aac",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

const AUDIO_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
];

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

const clampProgress = (progress) => Math.min(1, Math.max(0, progress));

const reportProgress = (onProgress, progress) => {
  if (onProgress) onProgress(clampProgress(progress));
};

const getSupportedMimeType = (mimeTypes) => {
  if (typeof MediaRecorder === "undefined") return "";
  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? "";
};

const getCaptureStream = (mediaElement) => {
  if (mediaElement.captureStream) return mediaElement.captureStream();
  if (mediaElement.mozCaptureStream) return mediaElement.mozCaptureStream();
  return null;
};

// Some browsers populate captureStream()'s audio track asynchronously (via
// "addtrack") once decoding starts, rather than synchronously on creation.
// Querying it immediately can race and silently miss the audio track.
const waitForAudioTrack = (stream, timeoutMs = 500) =>
  new Promise((resolve) => {
    if (!stream) return resolve(null);

    const existingTrack = stream.getAudioTracks()[0];
    if (existingTrack) return resolve(existingTrack);

    const cleanup = () => {
      clearTimeout(timer);
      stream.removeEventListener("addtrack", onAddTrack);
    };

    const onAddTrack = (event) => {
      if (event.track.kind !== "audio") return;
      cleanup();
      resolve(event.track);
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve(stream.getAudioTracks()[0] ?? null);
    }, timeoutMs);

    stream.addEventListener("addtrack", onAddTrack);
  });

const chooseSmallerMedia = (originalFile, compressedBlob) => {
  if (!compressedBlob?.size || compressedBlob.size >= originalFile.size) {
    return originalFile;
  }

  return compressedBlob;
};

const finishWithOriginal = (file, onProgress) => {
  reportProgress(onProgress, 1);
  return file;
};

const getDeviceProfileName = () => {
  if (typeof navigator === "undefined") return "balanced";

  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const isMobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    navigator.maxTouchPoints > 1;

  if (cores <= 2 || memory <= 2) return "lowEnd";
  if (cores <= 4 || memory <= 4 || isMobile) return "balanced";
  return "capable";
};

const getAdaptiveOptions = (customOptions) => {
  const profileName = customOptions.profile || getDeviceProfileName();
  const profile =
    COMPRESSION_PROFILES[profileName] || COMPRESSION_PROFILES.balanced;

  return {
    ...profile,
    ...customOptions,
  };
};

export const getDetectedCompressionProfile = getDeviceProfileName;

const waitForMetadata = (mediaElement) =>
  new Promise((resolve, reject) => {
    mediaElement.onloadedmetadata = resolve;
    mediaElement.onerror = () => reject(new Error("Unable to load media file."));
  });

const compressImage = async (file, onProgress, options) => {
  const compressedFile = await imageCompression(file, {
    maxSizeMB: options.imageMaxSizeMB,
    maxWidthOrHeight: options.imageMaxWidthOrHeight,
    initialQuality: options.imageQuality,
    useWebWorker: true,
    onProgress: (progress) => reportProgress(onProgress, progress / 100),
    ...options.imageCompressionOptions,
  });

  reportProgress(onProgress, 1);
  return compressedFile;
};

const compressAudio = async (file, onProgress, options) => {
  if (typeof MediaRecorder === "undefined") {
    return finishWithOriginal(file, onProgress);
  }

  if (file.size < options.audioSkipBelowBytes) {
    return finishWithOriginal(file, onProgress);
  }

  const audio = document.createElement("audio");
  const objectUrl = URL.createObjectURL(file);
  let audioContext = null;

  try {
    audio.src = objectUrl;
    audio.preload = "metadata";
    await waitForMetadata(audio);

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let stream = null;

    if (AudioContextClass) {
      audioContext = new AudioContextClass();
      const source = audioContext.createMediaElementSource(audio);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      stream = destination.stream;
    } else {
      stream = getCaptureStream(audio);
    }

    if (!stream) {
      return finishWithOriginal(file, onProgress);
    }

    const mimeType = getSupportedMimeType(AUDIO_MIME_TYPES);
    const mediaRecorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: options.audioBitsPerSecond,
    });

    return await recordMedia({
      mediaElement: audio,
      mediaRecorder,
      onProgress,
      fallbackType: file.type,
      onStart: () => audioContext?.resume?.(),
      onCleanup: () => audioContext?.close?.(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const compressVideo = async (file, onProgress, options) => {
  if (typeof MediaRecorder === "undefined") {
    return finishWithOriginal(file, onProgress);
  }

  if (file.size < options.videoSkipBelowBytes) {
    return finishWithOriginal(file, onProgress);
  }

  const video = document.createElement("video");
  const objectUrl = URL.createObjectURL(file);

  try {
    video.src = objectUrl;
    // Keep audio decoding "live" for captureStream(); muting can suppress the
    // captured audio track on some browsers, so silence via volume instead.
    video.muted = false;
    video.volume = 0;
    video.playsInline = true;
    video.preload = "metadata";
    await waitForMetadata(video);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to create video canvas.");

    const scale = Math.min(1, options.videoMaxWidth / video.videoWidth);
    const width = Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2);
    const height = Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2);

    canvas.width = width;
    canvas.height = height;

    if (!canvas.captureStream) {
      return finishWithOriginal(file, onProgress);
    }

    // Briefly play the source once so browsers that populate captureStream's
    // audio track asynchronously have a chance to attach it before we commit
    // to a recording pass; otherwise the audio track can be silently missed.
    const sourceStream = getCaptureStream(video);
    let audioTrack = null;
    try {
      await video.play();
      audioTrack = await waitForAudioTrack(sourceStream);
    } catch (error) {
      // Autoplay may be blocked; fall through with no audio track detected.
    } finally {
      video.pause();
      video.currentTime = 0;
    }

    const canvasStream = canvas.captureStream(options.videoFps);
    if (audioTrack) canvasStream.addTrack(audioTrack);

    const mimeType = getSupportedMimeType(VIDEO_MIME_TYPES);
    const mediaRecorder = new MediaRecorder(canvasStream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: options.videoBitsPerSecond,
      audioBitsPerSecond: options.audioBitsPerSecond,
    });

    return await recordMedia({
      mediaElement: video,
      mediaRecorder,
      onProgress,
      fallbackType: file.type,
      onFrame: () => context.drawImage(video, 0, 0, width, height),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const recordMedia = ({
  mediaElement,
  mediaRecorder,
  onProgress,
  fallbackType,
  onFrame,
  onStart,
  onCleanup,
}) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let animationFrameId = null;

    const cleanup = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      onCleanup?.();
    };

    mediaRecorder.ondataavailable = (event) => {
      if (event.data?.size > 0) chunks.push(event.data);
    };

    mediaRecorder.onerror = (event) => {
      cleanup();
      reject(event.error ?? new Error("Media compression failed."));
    };

    mediaRecorder.onstop = () => {
      cleanup();
      reportProgress(onProgress, 1);
      resolve(new Blob(chunks, { type: mediaRecorder.mimeType || fallbackType }));
    };

    mediaElement.onended = () => {
      if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
    };

    const drawFrame = () => {
      if (mediaElement.paused || mediaElement.ended) return;
      onFrame?.();
      if (mediaElement.duration) {
        reportProgress(onProgress, mediaElement.currentTime / mediaElement.duration);
      }

      if ("requestVideoFrameCallback" in mediaElement) {
        mediaElement.requestVideoFrameCallback(drawFrame);
      } else {
        animationFrameId = requestAnimationFrame(drawFrame);
      }
    };

    mediaRecorder.start();
    onStart?.();
    mediaElement
      .play()
      .then(() => {
        drawFrame();
      })
      .catch((error) => {
        cleanup();
        reject(error);
      });
  });

/**
 * Compress media with lightweight browser-native paths.
 */
export async function compressMedia(file, onProgress = null, customOptions = {}) {
  const options = getAdaptiveOptions(customOptions);
  reportProgress(onProgress, 0);

  if (file.type.startsWith("image")) {
    return chooseSmallerMedia(file, await compressImage(file, onProgress, options));
  }

  if (file.type.startsWith("video")) {
    return chooseSmallerMedia(file, await compressVideo(file, onProgress, options));
  }

  if (file.type.startsWith("audio")) {
    return chooseSmallerMedia(file, await compressAudio(file, onProgress, options));
  }

  throw new Error("Unsupported file type");
}
