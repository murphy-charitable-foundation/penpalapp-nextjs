import React, { useState, useRef, useEffect } from "react";
import { Loader2, Play, Send, X, Film } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { storage, auth } from "../../app/firebaseConfig";
import { compressMedia } from "../../app/utils/compressMedia";

const VideoUploader = ({ onUploadSuccess, onRequireLogin, trigger }) => {
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

  const handlePickVideo = () => {
    if (!user) {
      alert("Please log in first");
      if (onRequireLogin) onRequireLogin();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 30 * 1024 * 1024) {
      alert("Video file cannot exceed 30MB");
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(url);
  };

  const handleCancel = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStatus("idle");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const compressVideo = async (originalFile) => {
    // originalFile is the file object passed from state
    if (!originalFile) return;

    console.log("Start compressing:", originalFile.name);

    // Call your compression utility function
    const compressedBlob = await compressMedia(originalFile, (p) =>
      setProgress(Math.round(p * 100))
    );

    console.log("compressed: ready for downloading/uploading");
    return compressedBlob;
  };

  const handleSend = async () => {
    if (!file || !user) return;
    try {
      setStatus("compressing");
      setProgress(0);
      const compressedFile = await compressVideo(file);

      setStatus("uploading");
      setProgress(0);
      const fileName = `video_${Date.now()}.mp4`;
      const storagePath = `users/${user.uid}/video_messages/${fileName}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

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
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onUploadSuccess(downloadURL);
          handleCancel();
        }
      );
    } catch (error) {
      console.error("Error processing video", error);
      setStatus("idle");
      alert("Error processing video");
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
      {status === "idle" &&
        !file &&
        (trigger ? (
          <div onClick={handlePickVideo} className="cursor-pointer">
            {trigger}
          </div>
        ) : (
          <button
            onClick={handlePickVideo}
            className="p-2 bg-gray-100 rounded-full"
          >
            <Film />
          </button>
        ))}
      {file && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm shadow-2xl overflow-hidden relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700">Send Video</h3>
              <button
                onClick={handleCancel}
                disabled={status !== "idle"}
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
            {status !== "idle" && (
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-xs font-medium text-indigo-600">
                  <span>
                    {status === "compressing"
                      ? "Compressing..."
                      : "Uploading..."}
                  </span>
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
                disabled={status !== "idle"}
                className="flex-1 py-3 text-slate-600 font-medium bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={status !== "idle"}
                className="flex-1 py-3 text-white font-medium bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === "idle" ? (
                  <>
                    Send <Send size={18} />
                  </>
                ) : (
                  <Loader2 size={18} className="animate-spin" />
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
