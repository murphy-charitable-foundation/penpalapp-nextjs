"use client";
import React, { useState } from "react";
import { Film, Image as ImageIcon } from "lucide-react";

import { compressMedia } from "../utils/compressMedia";

import AudioRecorder from "../../components/media/AudioRecorder";
import AudioPlayer from "../../components/media/AudioPlayer";
import VideoUploader from "../../components/media/VideoUploader";
import VideoPlayer from "../../components/media/VideoPlayer";
import ImageUploader from "../../components/media/ImageUploader";
/**
 *
 * // Audio and Video compression test
 */
export default function LocalDownload() {
  const [progress, setProgress] = useState(0);
  const [audioContent, setAudioContent] = useState("");
  const [videoContent, setVideoContent] = useState("");
  const [imgContent, setImgContent] = useState("");

  async function handleFileChange(e) {
    const input = e.target;
    const file = input.files?.[0];

    if (!file) {
      input.value = "";
      return;
    }

    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("文件过大，请选择小于 500MB 的文件");
      input.value = "";
      return;
    }

    if (isCompressing) return;
    setIsCompressing(true);
    setProgress(0);

    console.log("Start compressing:", file.name);

    let compressedBlob;
    try {
      compressedBlob = await compressMedia(file, (p) =>
        setProgress(Math.round(p * 100)),
      );
    } catch (error) {
      console.error("压缩失败:", error);
      alert("压缩失败，请重试");
      setProgress(0);
      setIsCompressing(false);
      input.value = "";
      return;
    }

    console.log("compressed: ready for downloading");

    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compressed_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    input.value = "";
    setProgress(0);
    setIsCompressing(false);
  }

  const handleRequireLogin = () => {
    const shouldLogin = confirm(
      "You are not logged in. Would you like to log in?",
    );
    if (shouldLogin) {
      console.log("Navigating to login...");
    }
  };
  const handleAudioSuccess = (url) => {
    setAudioContent(url);
    console.log("Parent received audio URL:", url);
    // Add your logic here, e.g., save the URL to Firestore or display it.
  };

  const handleVideoSuccess = (url) => {
    setVideoContent(url);
    console.log("Parent received video URL:", url);
  };

  const handleImageSuccess = (url) => {
    setImgContent(url);
    console.log("Parent received image URL:", url);
  };

  return (
    <div className="p-4 flex flex-col justify-center items-center gap-4">
      <div>
        <AudioPlayer src={audioContent} />
      </div>
      <div>
        {imgContent && (
          <div>
            <img
              src={imgContent}
              className="rounded-lg w-full h-auto max-h-[300px] object-cover cursor-zoom-in bg-slate-200"
              onClick={() => window.open(imgContent, "_blank")}
              alt="Uploaded preview"
            />
          </div>
        )}
      </div>
      <div>
        <VideoPlayer src={videoContent} />
      </div>
      {/* Bottom Toolbar (Fixed Layout) */}
      <div className="bg-white border-t border-slate-100 p-6 pb-8 sticky bottom-0 z-20 w-full">
        <div className="flex flex-col items-center w-full gap-6">
          {/* Pill Toolbar */}
          <div className="bg-slate-100 rounded-full px-5 py-1 flex items-center gap-8 shadow-inner">
            <VideoUploader
              onUploadSuccess={(url) => handleVideoSuccess(url)}
              onRequireLogin={handleRequireLogin}
              trigger={
                <Film
                  className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  size={24}
                />
              }
            />
            <div className="w-px h-5 bg-slate-300"></div>
            <ImageUploader
              onUploadSuccess={(url) => handleImageSuccess(url)}
              onRequireLogin={handleRequireLogin}
              trigger={
                <ImageIcon
                  className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  size={24}
                />
              }
            />
          </div>
        </div>
        {/* Big Record Button */}
        <div className="bg-slate-100 p-10 my-5">
          <AudioRecorder
            onUploadSuccess={(url) => handleAudioSuccess(url)}
            onRequireLogin={handleRequireLogin}
          />
        </div>
      </div>
    </div>
  );
}
