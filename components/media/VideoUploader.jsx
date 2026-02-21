import React, { useState, useRef, useEffect } from "react";
import { Loader2, Play, Send, X, Film } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { storage, auth } from "../../app/firebaseConfig";

// Fix: Detect supported mimeType at runtime instead of hardcoding
const getSupportedMimeType = () => {
  const types = [
    "video/mp4;codecs=h264,aac",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
};

// Fix: Derive file extension from actual mimeType
const getExtFromMimeType = (mimeType) => {
  const base = mimeType.split(";")[0]; // strip codecs
  return base.split("/")[1] || "webm"; // "video/mp4" → "mp4"
};

const VideoUploader = ({ onUploadSuccess, onRequireLogin, trigger }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState("idle"); // 'idle', 'compressing', 'uploading'
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handlePickVideo = () => {
    if (!user) {
      alert("Please log in first");
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (status === "uploading") return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 500 * 1024 * 1024) {
      alert("Video file cannot exceed 500MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";

    tempVideo.onloadedmetadata = () => {
      const duration = tempVideo.duration;
      if (duration > 60) {
        alert(
          `Video duration (${Math.round(duration)}s) exceeds the 60s limit.`,
        );
        URL.revokeObjectURL(url);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(url);
    };

    tempVideo.onerror = () => {
      alert("Failed to load video file.");
      URL.revokeObjectURL(url);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    tempVideo.src = url;
  };

  const handleCancel = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStatus("idle");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const compressWithMediaRecorder = async (file, onProgress) => {
    console.log("Using MediaRecorder compression...");
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const videoUrl = URL.createObjectURL(file);
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      video.onloadedmetadata = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const TARGET_WIDTH = 1280;
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > TARGET_WIDTH) {
          height = Math.round((height * TARGET_WIDTH) / width);
          width = TARGET_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const stream = canvas.captureStream(24);

        if (video.captureStream || video.mozCaptureStream) {
          const videoStream = video.captureStream
            ? video.captureStream()
            : video.mozCaptureStream();
          const audioTrack = videoStream.getAudioTracks()[0];
          if (audioTrack) stream.addTrack(audioTrack);
        }

        // Fix: Detect supported mimeType instead of hardcoding "video/mp4"
        const mimeType = getSupportedMimeType();
        let mediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 1500000,
          });
        } catch (e) {
          // Fix: Graceful fallback — let the browser choose its own format
          console.warn(
            "Specified mimeType not supported, falling back to browser default.",
            e,
          );
          try {
            mediaRecorder = new MediaRecorder(stream, {
              videoBitsPerSecond: 1500000,
            });
          } catch (e2) {
            URL.revokeObjectURL(videoUrl);
            reject(new Error("MediaRecorder not supported on this browser"));
            return;
          }
        }

        // Fix: Read the actual mimeType the browser chose, not what we requested
        const actualMimeType = mediaRecorder.mimeType || "video/webm";

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          // Fix: Use actualMimeType so blob type matches real content
          const blob = new Blob(chunks, { type: actualMimeType });
          URL.revokeObjectURL(videoUrl);
          resolve(blob);
        };

        mediaRecorder.onerror = (e) => {
          URL.revokeObjectURL(videoUrl);
          reject(e);
        };

        mediaRecorder.start();
        video.play().catch(reject);

        const drawFrame = () => {
          if (video.paused || video.ended) {
            mediaRecorder.stop();
            return;
          }
          ctx.drawImage(video, 0, 0, width, height);
          if (onProgress && video.duration) {
            onProgress(video.currentTime / video.duration);
          }
          requestAnimationFrame(drawFrame);
        };
        drawFrame();
      };

      video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        reject(new Error("Video load error"));
      };
    });
  };

  const compressWithWebCodecs = async (file, onProgress) => {
    if (!("VideoEncoder" in window)) {
      throw new Error("WebCodecs not supported");
    }
    return compressWithMediaRecorder(file, onProgress);
  };

  const handleSend = async () => {
    if (!file || !user) return;
    try {
      setStatus("compressing");
      setProgress(0);

      let compressedBlob = file;

      if (file.size > 20 * 1024 * 1024) {
        const isSafari = /^((?!chrome|android).)*safari/i.test(
          navigator.userAgent,
        );
        try {
          if (!isSafari) {
            compressedBlob = await compressWithWebCodecs(file, (p) =>
              setProgress(Math.round(p * 100)),
            );
          } else {
            compressedBlob = await compressWithMediaRecorder(file, (p) =>
              setProgress(Math.round(p * 100)),
            );
          }
        } catch (error) {
          console.warn("Compression failed, using original.", error);
          compressedBlob = file;
        }
      } else {
        console.log("File < 20MB, skipping compression.");
        setProgress(100);
      }

      setStatus("uploading");
      setProgress(0);

      // Fix: Derive extension from actual blob mimeType, not hardcoded assumption
      const ext = getExtFromMimeType(compressedBlob.type);
      const fileName = `video_${Date.now()}.${ext}`;
      const storagePath = `users/${user.uid}/video_messages/${fileName}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        },
        (error) => {
          console.error("Upload failed", error);
          alert("Upload failed");
          setStatus("idle");
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onUploadSuccess(downloadURL);
            handleCancel();
          } catch (error) {
            console.error("Failed to get download URL:", error);
            alert("Upload failed, please try again");
            setStatus("idle");
          }
        },
      );
    } catch (error) {
      console.error("Error processing video", error);
      alert("Error processing video.");
      handleCancel();
    }
  };

  return (
    <>
      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        onClick={handlePickVideo}
        className="cursor-pointer flex items-center justify-center"
      >
        {status === "uploading" ? (
          <div className="relative w-6 h-6 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border-2 border-indigo-100"
              style={{
                background: `conic-gradient(#4f46e5 ${progress}%, transparent 0)`,
                maskImage: "radial-gradient(transparent 55%, black 56%)",
                WebkitMaskImage: "radial-gradient(transparent 55%, black 56%)",
              }}
            />
            {progress === 0 ? (
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            ) : (
              <span className="text-[8px] font-bold text-indigo-600">
                {Math.round(progress)}
              </span>
            )}
          </div>
        ) : trigger ? (
          trigger
        ) : (
          <button className="p-2 bg-gray-100 rounded-full">
            <Film />
          </button>
        )}
      </div>

      {file && status !== "uploading" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm shadow-2xl overflow-hidden relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700">Send Video</h3>
              <button
                onClick={handleCancel}
                className="p-1 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative group">
              <video
                src={previewUrl}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Play size={40} className="text-white/50 fill-white/50" />
              </div>
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>

            {status === "compressing" && (
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-xs font-medium text-indigo-600">
                  <span>Processing... (Keep open)</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={status === "compressing"}
                className="flex-1 py-3 text-slate-600 font-medium bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={status === "compressing"}
                className="flex-1 py-3 text-white font-medium bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === "compressing" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Send <Send size={18} />
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

export default VideoUploader;
