import React, { useState, useRef, useEffect } from "react";
import { Loader2, Image as ImageIcon, X, Send } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

import Compress from "compress.js";

import { storage, auth } from "../../app/firebaseConfig";

const ImageUploader = ({ onUploadSuccess, onRequireLogin, trigger }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // State management: idle -> preview -> compressing -> uploading
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handlePick = () => {
    if (!user) {
      alert("Please log in first");
      if (onRequireLogin) onRequireLogin();
      return;
    }
    // Prevent interaction if uploading in background
    if (status === "uploading") return;
    fileInputRef.current?.click();
  };

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStatus("preview"); // Open modal
  };

  const handleCancel = () => {
    setFile(null);
    setStatus("idle");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetState = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (!file || !user) return;

    setStatus("compressing");

    try {
      let fileToUpload = file;

      if (file.size > 200 * 1024) {
        try {
          const compress = new Compress();
          const results = await compress.compress([file], {
            size: 2,
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1920,
            resize: true,
            rotate: false,
          });

          if (results && results.length > 0) {
            const img = results[0];
            const base64str = img.data;
            const imgExt = img.ext;
            const compressedFile = Compress.convertBase64ToFile(
              base64str,
              imgExt
            );

            console.log(
              `Compression: ${(file.size / 1024).toFixed(2)}KB -> ${(
                compressedFile.size / 1024
              ).toFixed(2)}KB`
            );

            if (compressedFile.size < file.size) {
              fileToUpload = compressedFile;
            }
          }
        } catch (compressErr) {
          console.error("Compression failed, using original", compressErr);
        }
      }

      setStatus("uploading");

      const ext = fileToUpload.name.split(".").pop() || "jpg";
      const fileName = `img_${Date.now()}.${ext}`;
      const storageRef = ref(storage, `users/${user.uid}/images/${fileName}`);

      const task = uploadBytesResumable(storageRef, fileToUpload);

      task.on(
        "state_changed",
        (snap) => {
          const p = (snap.bytesTransferred / snap.totalBytes) * 100;
          setProgress(p);
        },
        (err) => {
          console.error(err);
          alert("Upload failed: " + err.message);
          resetState();
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          onUploadSuccess(url);
          resetState();
        }
      );
    } catch (e) {
      console.error(e);
      alert("Processing error: " + e.message);
      resetState();
    }
  };

  const isBackgroundUploading = status === "uploading";

  return (
    <>
      <input
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/gif"
        ref={fileInputRef}
        className="hidden"
        onChange={handleChange}
      />

      {/* Trigger Button */}
      <div
        onClick={handlePick}
        className="cursor-pointer flex items-center justify-center"
      >
        {isBackgroundUploading ? (
          // --- Uploading: Show Progress Circle ---
          <div className="relative w-6 h-6 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border-2 border-indigo-100"
              style={{
                background: `conic-gradient(#4f46e5 ${progress}%, transparent 0)`,
                maskImage: "radial-gradient(transparent 55%, black 56%)",
                WebkitMaskImage: "radial-gradient(transparent 55%, black 56%)",
              }}
            />
            <span className="text-[8px] font-bold text-indigo-600">
              {Math.round(progress)}
            </span>
          </div>
        ) : // --- Idle/Compressing: Show Icon ---
        trigger ? (
          trigger
        ) : (
          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <ImageIcon size={20} />
          </button>
        )}
      </div>

      {file && status !== "uploading" && status !== "idle" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-4 w-full max-w-xs shadow-xl relative">
            {/* Title Bar */}
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-slate-700">Send Image</span>
              <button
                onClick={handleCancel}
                disabled={status === "compressing"}
                className="p-1 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Image Preview Area */}
            <div className="aspect-square bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
              <img
                src={previewUrl}
                className="w-full h-full object-contain"
                alt="Preview"
              />

              {status === "compressing" && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-sm transition-all">
                  <Loader2 className="animate-spin mb-2" size={32} />
                  <span className="text-sm font-medium">Compressing...</span>
                </div>
              )}

              {status !== "compressing" && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={status === "compressing"}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={status === "compressing"}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {status === "compressing" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Send <Send size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUploader;
