/**
 * Compress an image (supports File, Blob, or URL input)
 * @param {File|Blob|string} input - The image source
 * @returns {Promise<Blob>} - The compressed image as a Blob
 * eg:  
  const compressedBlob = await compressImage(file);
  console.log('Compressed Blob:', compressedBlob);
 */
export default async function compressImage(input) {
  const maxWidth = 1000;    
  const maxHeight = 1000; 
  const quality = 0.8;      

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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

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
  