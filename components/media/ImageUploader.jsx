import React, { useState, useRef, useEffect } from "react";
import { Loader2, Image as ImageIcon, X, Upload, Send } from "lucide-react";

// --- Firebase Core Imports ---
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { storage, auth } from "../../app/firebaseConfig";
/**
 * Uses Canvas to compress images (Smart Version: Returns original file if compression increases size)
 * @param {File} file - Original image file
 * @param {number} maxWidth - Max width/height (default 1920px)
 * @param {number} quality - Compression quality (0.0 - 1.0, default 0.8)
 * @returns {Promise<Blob|File>} - Compressed Blob object or original File
 */
const compressImage = async (file, maxWidth = 1920, quality = 0.8) => {
  // If the image is already less than 200KB, skip compression
  if (file.size < 200 * 1024) {
    console.log("Image is less than 200KB, skipping compression");
    return file;
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(image.src); // Free up memory
      const canvas = document.createElement("canvas");
      let { width, height } = image;

      // Calculate scaled dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // Draw background (fixes transparent PNG background turning black)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      // Draw the image onto the canvas
      ctx.drawImage(image, 0, 0, width, height);

      // Convert canvas content to Blob (JPEG format)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(
              `Original: ${(file.size / 1024).toFixed(2)}KB, Compressed: ${(
                blob.size / 1024
              ).toFixed(2)}KB`
            );

            // [Crucial modification] If compression increases size, use the original file
            if (blob.size > file.size) {
              console.log(
                "Compressed size is larger, using original file for upload"
              );
              resolve(file);
            } else {
              resolve(blob);
            }
          } else {
            // If conversion fails, return original file as fallback
            console.warn("Canvas export failed, using original file");
            resolve(file);
          }
        },
        "image/jpeg", // Convert to JPEG for better compression
        quality
      );
    };

    image.onerror = (error) => {
      console.error("Image loading failed, using original file", error);
      resolve(file);
    };
  });
};

const ImageUploader = ({ onUploadSuccess, onRequireLogin, trigger }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handlePick = () => {
    if (!user)
      return onRequireLogin ? onRequireLogin() : alert("Please log in first");
    fileInputRef.current?.click();
  };

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleCancel = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (!file || !user) return;
    try {
      setStatus("compressing");
      const blob = await compressImage(file);
      setStatus("uploading");

      const ext = blob === file ? file.name.split(".").pop() : "jpg";
      const storageRef = ref(
        storage,
        `users/${user.uid}/images/img_${Date.now()}.${ext}`
      );
      const task = uploadBytesResumable(storageRef, blob);

      task.on(
        "state_changed",
        (snap) => setProgress((snap.bytesTransferred / snap.totalBytes) * 100),
        (err) => {
          console.error(err);
          alert("Upload failed");
          setStatus("idle");
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          onUploadSuccess(url);
          handleCancel();
        }
      );
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleChange}
      />

      {status === "idle" &&
        !file &&
        (trigger ? (
          <div onClick={handlePick} className="cursor-pointer">
            {trigger}
          </div>
        ) : (
          <button
            onClick={handlePick}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ImageIcon />
          </button>
        ))}

      {file && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-4 w-full max-w-xs shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-slate-700">Send Image</span>
              <button
                onClick={handleCancel}
                className="p-1 bg-slate-100 rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-square bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
              <img
                src={previewUrl}
                className="w-full h-full object-contain"
                alt="Image Preview"
              />
              {status !== "idle" && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                  <Loader2 className="animate-spin mb-2" />
                  <span className="text-xs">
                    {status === "compressing"
                      ? "Compressing..."
                      : `${Math.round(progress)}%`}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={status !== "idle"}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              Confirm Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUploader;
