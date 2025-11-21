import React from "react";

/**
 * Video Player Component
 * @param {string} src - URL of the video file
 * @param {string} [poster] - (Optional) URL of the video thumbnail/poster. Ignored if not provided.
 */
const VideoPlayer = ({ src, poster }) => {
  // Add null check to prevent rendering errors
  if (!src) return null;

  return (
    <div className="rounded-xl overflow-hidden bg-black max-w-[300px] shadow-sm border border-slate-200 relative group">
      <video
        src={src}
        controls
        className="w-full h-auto max-h-[480px]"
        playsInline
        poster={poster} // If poster is undefined, React automatically ignores this attribute
      />
    </div>
  );
};

export default VideoPlayer;
