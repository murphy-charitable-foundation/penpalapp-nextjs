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

const chooseSmallerMedia = (originalFile, compressedBlob) => {
  if (!compressedBlob?.size || compressedBlob.size >= originalFile.size) {
    return originalFile;
  }

  return compressedBlob;
};

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
    reportProgress(onProgress, 1);
    return file;
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
      reportProgress(onProgress, 1);
      return file;
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
    reportProgress(onProgress, 1);
    return file;
  }

  const video = document.createElement("video");
  const objectUrl = URL.createObjectURL(file);

  try {
    video.src = objectUrl;
    video.muted = true;
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
      reportProgress(onProgress, 1);
      return file;
    }

    const canvasStream = canvas.captureStream(options.videoFps);
    const sourceStream = getCaptureStream(video);
    const audioTrack = sourceStream?.getAudioTracks?.()[0];
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
      animationFrameId = requestAnimationFrame(drawFrame);
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
 *
 * Keeps the same public signature as the previous ffmpeg-based version:
 * compressMedia(file, onProgress, customOptions)
 */
export async function compressMedia(file, onProgress = null, customOptions = {}) {
  const defaultOptions = {
    imageMaxSizeMB: 1,
    imageMaxWidthOrHeight: 1280,
    imageQuality: 0.72,
    videoMaxWidth: 854,
    videoFps: 15,
    videoBitsPerSecond: 700000,
    audioBitsPerSecond: 64000,
  };

  const options = { ...defaultOptions, ...customOptions };
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
