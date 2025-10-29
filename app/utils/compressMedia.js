"use client";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';


let ffmpegInstance = null;

async function getFFmpeg() {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg({ log: true });

  console.log("Loading ffmpeg-core.wasm...");
  try {
    await ffmpeg.load();
    console.log("FFmpeg core loaded！");


    await ffmpeg.exec(['-version']);
    console.log("FFmpeg is ready to use");

    ffmpegInstance = ffmpeg;
    return ffmpegInstance;

  } catch (error) {
    console.error("Loading FFmpeg core error:", error);
  
    ffmpegInstance = null; 
    return null;
  }
}

/**
 * use ffmpeg.wasm v0.12+ API to compress media
 * @param {File} file - video or audio file
 * @param {Function} onProgress -
 * @param {Object} customOptions 
 * videoBitrate {string} - eg: '1000k'
 * audioBitrate {string} - eg: '128k'
 * videoScale {string} - eg: 'scale=iw*0.5:ih*0.5'
 * videoFps {string} - eg: '30'
 * outputFormat {string} - eg: 'mp4' or 'mp3'
 */
export async function compressMedia(file, onProgress = null, customOptions = {}) {
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
  const defaultOptions = {
    videoBitrate: '800k',
    audioBitrate: '128k',
    videoScale: 'scale=iw*0.5:ih*0.5',
    videoFps: '30',
    outputFormat: file.type.startsWith('video') ? 'mp4' : 'mp3'
  };

  const options = { ...defaultOptions, ...customOptions };
  const outputName = `output.${options.outputFormat}`;

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  let args = [];

  if (file.type.startsWith('video')) {
    args = [
      '-i', inputName,
      '-vf', options.videoScale,
      '-b:v', options.videoBitrate,
      '-r', options.videoFps,
      '-c:v', 'libx264',
      '-b:a', options.audioBitrate,
      '-c:a', 'aac',
      '-movflags', '+faststart',// Optimize the video so it can start playing more quickly
      '-preset', 'fast', // Balance encoding speed and output quality
      '-y', // Overwrite the output file
      outputName
    ];
  } else if (file.type.startsWith('audio')) {
    args = [
      '-i', inputName,
      '-b:a', options.audioBitrate,
      '-ar', '44100',
      '-c:a', options.outputFormat === 'mp3' ? 'libmp3lame' : 'aac',
      '-y',
      outputName
    ];
  } else {
    throw new Error('Unsupported file type');
  }


  await ffmpeg.exec(args);

  const data = await ffmpeg.readFile(outputName);

  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  // cleanup
  if (onProgress) {
    ffmpeg.off("progress");
  }

  return new Blob([data.buffer], {
    type: file.type.startsWith('video') ? `video/${options.outputFormat}` : `audio/${options.outputFormat}`
  });
}