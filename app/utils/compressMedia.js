"use client";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let ffmpegInstance = null;

async function getFFmpeg() {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg({ log: true });

  console.log("Loading ffmpeg-core.wasm...");
  try {
    await ffmpeg.load();
    console.log("FFmpeg core loaded!");
    ffmpegInstance = ffmpeg;
    return ffmpegInstance;
  } catch (error) {
    console.error("Loading FFmpeg core error:", error);
    ffmpegInstance = null;
    return null;
  }
}

/**
 * Superfast compression configuration
 */
export async function compressMedia(
  file,
  onProgress = null,
  customOptions = {}
) {
  const ffmpeg = await getFFmpeg();
  if (!ffmpeg) {
    throw new Error("FFmpeg instance failed to load.");
  }

  if (onProgress) {
    ffmpeg.on("progress", ({ progress }) => {
      if (progress >= 0 && progress <= 1) {
        onProgress(progress);
      }
    });
  }

  const inputName = file.name;

  // --- Optimized Default Options ---
  const defaultOptions = {
    // 1. Force max width 1280 (720p), height scales automatically. Avoids 4K video causing crashes or extreme slowness
    videoScale: "scale=1280:-2",
    // 2. Reduce frame rate to 24fps, reducing the number of frames to encode
    videoFps: "24",
    // 3. Use CRF instead of fixed bitrate. 28 is a balance point for lower quality/high compression/faster speed
    crf: "28",
    // 4. Critical: Use the ultrafast preset, which sacrifices compression ratio for maximum speed
    preset: "ultrafast",
    audioBitrate: "96k", // Audio bitrate can also be slightly lowered
    outputFormat: file.type.startsWith("video") ? "mp4" : "mp3",
  };

  const options = { ...defaultOptions, ...customOptions };
  const outputName = `output.${options.outputFormat}`;

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  let args = [];

  if (file.type.startsWith("video")) {
    args = [
      "-i",
      inputName,
      "-vf",
      options.videoScale,
      "-c:v",
      "libx264",
      // Use CRF to control quality/size
      "-crf",
      options.crf,
      // Fastest preset
      "-preset",
      options.preset,
      "-r",
      options.videoFps,
      "-c:a",
      "aac",
      "-b:a",
      options.audioBitrate,
      // faststart allows video to start playing before fully downloading on the web
      "-movflags",
      "+faststart",
      "-y",
      outputName,
    ];
  } else if (file.type.startsWith("audio")) {
    // Audio options remain standard, usually very fast
    args = [
      "-i",
      inputName,
      "-b:a",
      options.audioBitrate,
      "-ar",
      "44100",
      "-c:a",
      options.outputFormat === "mp3" ? "libmp3lame" : "aac",
      "-y",
      outputName,
    ];
  } else {
    throw new Error("Unsupported file type");
  }

  console.log("FFmpeg Command:", args.join(" ")); // Debug log

  await ffmpeg.exec(args);

  const data = await ffmpeg.readFile(outputName);

  // Cleanup memory
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  if (onProgress) {
    ffmpeg.off("progress");
  }

  return new Blob([data.buffer], {
    type: file.type.startsWith("video")
      ? `video/${options.outputFormat}`
      : `audio/${options.outputFormat}`,
  });
}
