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

  // 1. 统一处理输入：如果是文件对象，生成临时 URL
  const isStringInput = typeof input === "string";
  const imageUrl = isStringInput ? input : URL.createObjectURL(input);

  try {
    // 2. 加载图片
    const image = await loadImage(imageUrl);
    const { width, height } = getTargetSize(image, maxWidth, maxHeight);

    // 3. 创建 Canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available"); // 安全检查

    // 4. 绘制图片
    ctx.drawImage(image, 0, 0, width, height);

    // 5. 导出 Blob (包装成 Promise 以便使用 await)
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Compression failed"))),
        "image/jpeg",
        quality
      );
    });

    return blob;
  } finally {
    // 6. 关键修复：无论成功还是失败，只要创建了临时 URL，最后一定要释放
    if (!isStringInput) {
      URL.revokeObjectURL(imageUrl);
    }
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
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
