import imageCompression from "browser-image-compression";

export const compressImage = async (file, onProgress, options) => {
  const { onProgress: onImageProgress, ...imageOptions } = options.imageCompressionOptions || {};

  return imageCompression(file, {
    maxSizeMB: options.imageMaxSizeMB,
    maxWidthOrHeight: options.imageMaxWidthOrHeight,
    initialQuality: options.imageQuality,
    useWebWorker: true,
    ...imageOptions,
    onProgress: (percent) => {
      onProgress(percent / 100);
      onImageProgress?.(percent);
    },
  });
};
