"use client";

import React, { useState } from "react";
import { Film, Image as ImageIcon } from "lucide-react";

import { compressMedia } from "../utils/compressMedia";

import AudioRecorder from "../../components/media/AudioRecorder"
import AudioPlayer from "../../components/media/AudioPlayer";
import VideoUploader from "../../components/media/VideoUploader";
import VideoPlayer from "../../components/media/VideoPlayer";
import ImageUploader from "../../components/media/ImageUploader";
import useBeforeUnloadWarning from "../../components/media/useBeforeUnloadWarning";
/**
 *
 * // Audio and Video compression test
 */
export default function LocalDownload() {
  const [progress, setProgress] = useState(0);
  const [audioContent, setAudioContent] = useState("");
  const [videoContent, setVideoContent] = useState("");
  const [imgContent, setImgContent] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [testFile, setTestFile] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState("");

  useBeforeUnloadWarning(isCompressing);

  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getExtensionFromMimeType = (mimeType) => {
    const baseType = mimeType.split(";")[0];
    const extensionMap = {
      "audio/mpeg": "mp3",
      "audio/mp3": "mp3",
      "audio/mp4": "m4a",
      "audio/ogg": "ogg",
      "audio/webm": "webm",
      "video/mp4": "mp4",
      "video/webm": "webm",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    return extensionMap[baseType] || baseType.split("/")[1] || "bin";
  };

  const clearTestResult = () => {
    if (testResult?.url) URL.revokeObjectURL(testResult.url);
    setTestResult(null);
  };

  async function handleCompressionTest(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    clearTestResult();
    setTestFile(file ?? null);
    setTestError("");
    setProgress(0);

    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedBlob = await compressMedia(file, (p) =>
        setProgress(Math.round(p * 100)),
      );

      const url = URL.createObjectURL(compressedBlob);
      setTestResult({
        blob: compressedBlob,
        url,
        fileName: `compressed_${Date.now()}.${getExtensionFromMimeType(
          compressedBlob.type,
        )}`,
      });
    } catch (error) {
      console.error("Compression test failed:", error);
      setTestError(error.message || "Compression failed");
    } finally {
      setIsCompressing(false);
    }
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
      <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h1 className="text-lg font-semibold text-slate-800">
            Local Compression Test
          </h1>
          <p className="text-sm text-slate-500">
            Runs compressMedia in this browser only. Nothing is uploaded.
          </p>
        </div>

        <label className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-600 hover:bg-slate-100">
          Choose photo, video, or audio
          <input
            type="file"
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={handleCompressionTest}
            disabled={isCompressing}
          />
        </label>

        {(testFile || isCompressing || testError) && (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {testFile && (
              <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3">
                <span>Original</span>
                <span className="text-right font-medium">
                  {formatSize(testFile.size)}
                </span>
                <span>Compressed</span>
                <span className="text-right font-medium">
                  {testResult ? formatSize(testResult.blob.size) : "-"}
                </span>
              </div>
            )}

            {isCompressing && (
              <div>
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Compressing</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {testError && <p className="text-red-600">{testError}</p>}

            {testResult && (
              <div className="space-y-3">
                {testResult.blob.type.startsWith("image") && (
                  <img
                    src={testResult.url}
                    alt="Compressed preview"
                    className="max-h-72 w-full rounded-md bg-slate-100 object-contain"
                  />
                )}
                {testResult.blob.type.startsWith("video") && (
                  <video
                    src={testResult.url}
                    controls
                    className="max-h-72 w-full rounded-md bg-black"
                  />
                )}
                {testResult.blob.type.startsWith("audio") && (
                  <audio src={testResult.url} controls className="w-full" />
                )}
                <a
                  href={testResult.url}
                  download={testResult.fileName}
                  className="inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Download compressed file
                </a>
              </div>
            )}
          </div>
        )}
      </section>

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
