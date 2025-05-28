/**
 * Compress an image (supports File, Blob, or URL input)
 * @param {File|Blob|string} input - The image source
 * @param {Object} options - Optional settings
 * @param {number} [options.maxWidth] - Maximum width (maintains aspect ratio)
 * @param {number} [options.maxHeight] - Maximum height (maintains aspect ratio)
 * @param {number} [options.quality=0.8] - Compression quality (0 to 1)
 * @returns {Promise<Blob>} - The compressed image as a Blob
 * eg:  
  const compressedBlob = await compressImage(file, {
    maxWidth: 1000,
    quality: 0.75
  });

  console.log('Compressed Blob:', compressedBlob);
 */
export default async function compressImage(input, options = {}) {
    const { maxWidth, maxHeight, quality = 0.8 } = options;
  
    const imageUrl = typeof input === 'string' ? input : URL.createObjectURL(input);
    const image = await loadImage(imageUrl);
    const { width, height } = getTargetSize(image, maxWidth, maxHeight);
  
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
  
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);
  
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) throw new Error('Compression failed');
          resolve(blob);
          if (typeof input !== 'string') URL.revokeObjectURL(imageUrl);
        },
        'image/jpeg',
        quality
      );
    });
  }
  
  // Load image from a URL
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  
  // Calculate target size with aspect ratio based on maxWidth or maxHeight
  function getTargetSize(img, maxWidth, maxHeight) {
    let width = img.width;
    let height = img.height;
  
    if (maxWidth && width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = height * ratio;
    }
  
    if (maxHeight && height > maxHeight) {
      const ratio = maxHeight / height;
      height = maxHeight;
      width = width * ratio;
    }
  
    return { width: Math.round(width), height: Math.round(height) };
  }
  