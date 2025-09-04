"use client";
import React, { useState } from "react";
import { compressMedia } from "../utils/compressMedia";

/**
 * 
 * Audio and Video compression test
 */
export default function LocalDownload() {
  
  const [progress, setProgress] = useState(0);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log("Start compressing:", file.name);

    const compressedBlob = await compressMedia(file, (p) =>
      setProgress(Math.round(p * 100))
    );

    console.log("compressed:ready for downloading");

    // create a temporary URL for the compressed file
    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compressed_${file.name}`;
    a.click();

    // cleanup 
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4">
      <input
        type="file"
        accept="audio/*,video/*"
        onChange={handleFileChange}
        className="mb-4"
      />

      {progress > 0 && <p>压缩进度：{progress}%</p>}
    </div>
  );
}