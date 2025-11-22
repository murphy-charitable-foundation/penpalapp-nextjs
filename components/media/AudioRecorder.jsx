import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Loader2,
  Lock,
  Trash2,
  Play,
  Pause,
  Send,
} from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

import { storage, auth } from "../../app/firebaseConfig";

/**
 * Audio Recording and Upload Component
 * @param {Function} onUploadSuccess - Callback upon successful upload: (url) => void
 * @param {Function} onRequireLogin - (Optional) Triggered when an unauthorized user clicks
 */
const AudioRecorder = ({ onUploadSuccess, onRequireLogin }) => {
  // --- State Management ---
  const [status, setStatus] = useState("idle"); // 'idle' | 'recording' | 'review' | 'uploading'
  const [time, setTime] = useState(0); // Recording duration or playback time
  const [duration, setDuration] = useState(0); // Total duration
  const [audioUrl, setAudioUrl] = useState(null); // Local preview URL after recording
  const [audioBlob, setAudioBlob] = useState(null); // File Blob after recording
  const [isPlaying, setIsPlaying] = useState(false); // Preview playback status

  // User State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null); // Used for playing the preview audio
  const sendAfterStopRef = useRef(false); // Flag if 'Send' was clicked during recording

  // --- 1. Listen for Login Status ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. Utility Functions ---
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Progress bar percentage
  const getProgressPercent = () => {
    const maxTime = status === "recording" ? 900 : duration; // Max recording is 15 minutes (900s)
    if (maxTime === 0) return 0;
    return Math.min((time / maxTime) * 100, 100);
  };

  // --- 3. Recording Logic ---
  const startRecording = async () => {
    if (authLoading) return;
    if (!user) {
      alert("Please log in to use voice features");
      if (onRequireLogin) onRequireLogin();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      sendAfterStopRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        stream.getTracks().forEach((track) => track.stop());

        setAudioBlob(blob);
        setAudioUrl(url);
        setDuration(time); // Save total duration

        // If the user clicked 'Send' directly while recording
        if (sendAfterStopRef.current) {
          handleUploadToFirebase(blob, user.uid);
        } else {
          setStatus("review"); // Otherwise, enter preview mode
          setTime(0); // Reset time for playback progress
        }
      };

      mediaRecorder.start();
      setStatus("recording");
      setTime(0);

      // Start timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTime((t) => {
          if (t >= 900) {
            // Auto stop after 15 minutes
            stopRecording();
            return t;
          }
          return t + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Microphone access failed:", error);
      alert("Please grant microphone permission");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleDelete = () => {
    // Reset all states
    if (status === "recording") stopRecording();
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    setStatus("idle");
    setAudioBlob(null);
    setAudioUrl(null);
    setTime(0);
    setDuration(0);
    setIsPlaying(false);
  };

  // Click Send while recording -> Stop and Upload
  const handleSendWhileRecording = () => {
    sendAfterStopRef.current = true;
    stopRecording();
  };

  // Click Send in preview -> Direct Upload
  const handleSendInReview = () => {
    if (audioBlob && user) {
      handleUploadToFirebase(audioBlob, user.uid);
    }
  };

  // --- 4. Preview Playback Logic ---
  const togglePlayPreview = () => {
    if (!audioPlayerRef.current) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioPlayerRef.current) {
      setTime(audioPlayerRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setTime(0);
  };

  // --- 5. Upload Logic ---
  const handleUploadToFirebase = async (blob, uid) => {
    setStatus("uploading");
    try {
      const fileName = `voice_${Date.now()}.webm`;
      const storagePath = `users/${uid}/voice_messages/${fileName}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Upload failed:", error);
          setStatus("review"); // Fallback to preview
          alert("Upload failed, please try again");
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("Upload successful:", downloadURL);

          // Cleanup and reset
          if (onUploadSuccess) onUploadSuccess(downloadURL);
          handleDelete();
        }
      );
    } catch (error) {
      console.error("Processing error:", error);
      setStatus("review");
    }
  };

  // Cleanup side effects
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // --- Render Section ---

  // 1. Uploading/Loading State
  if (status === "uploading") {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 animate-pulse">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm font-medium">Sending...</span>
        </div>
      </div>
    );
  }

  // 2. Idle State (Image 1 UI)
  if (status === "idle") {
    const isLoggedOut = !user && !authLoading;
    return (
      <div className="flex flex-col items-center gap-4">
        {/* Tooltip Bubble */}
        <div className="relative bg-green-100 text-green-800 px-4 py-2 rounded-xl text-xs text-center max-w-[200px] shadow-sm">
          Tap to record a voice message. The maximum length is 15 minutes.
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-green-100"></div>
        </div>

        {/* Record Button */}
        <button
          onClick={startRecording}
          disabled={authLoading}
          className={`w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center border border-gray-100 transition-transform hover:scale-105 active:scale-95 ${
            isLoggedOut ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoggedOut ? (
            <Lock className="text-gray-400" size={24} />
          ) : (
            // Red dot icon
            <div className="w-8 h-8 bg-red-500 rounded-full shadow-sm" />
          )}
        </button>
      </div>
    );
  }

  // 3. Recording (Image 2 UI) & 4. Review State (Image 3 UI)
  const isReviewing = status === "review";
  const maxDurationText = "15:00";
  const currentFormattedTime = formatTime(time);

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col gap-4">
      {/* Top Progress Bar and Time */}
      <div className="flex flex-col gap-1">
        {/* Tooltip for Review Mode */}
        {isReviewing && (
          <div className="relative self-center bg-green-100 text-green-800 px-4 py-2 rounded-xl text-xs text-center mb-2 shadow-sm">
            Listen back what you recorded, before you send it.
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-green-100"></div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
          <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden relative mr-3">
            <div
              className={`h-full ${
                isReviewing ? "bg-green-500" : "bg-red-500"
              } transition-all duration-300`}
              style={{ width: `${getProgressPercent()}%` }}
            />
          </div>
          <span>
            {isReviewing
              ? `${currentFormattedTime}/${formatTime(duration)}`
              : `${currentFormattedTime}/${maxDurationText}`}
          </span>
        </div>
      </div>

      {/* Control Buttons Row */}
      <div className="flex items-center justify-between px-4">
        {/* Left: Delete Button */}
        <button
          onClick={handleDelete}
          className="p-3 bg-gray-100 text-red-800/70 rounded-xl hover:bg-red-100 transition-colors"
        >
          <Trash2 size={20} />
        </button>

        {/* Center: Main Action Button */}
        {isReviewing ? (
          // Review Mode: Play/Pause (Green border, white background, green icon)
          <button
            onClick={togglePlayPreview}
            className="w-20 h-20 bg-white border-2 border-green-500 rounded-3xl flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            {isPlaying ? (
              <Pause className="text-green-500 fill-current" size={32} />
            ) : (
              <Play className="text-green-500 fill-current ml-1" size={32} />
            )}
          </button>
        ) : (
          // Recording Mode: Stop (Solid green background, white icon)
          <button
            onClick={stopRecording}
            className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Square className="text-white fill-current" size={28} />
          </button>
        )}

        {/* Right: Send Button */}
        <button
          onClick={isReviewing ? handleSendInReview : handleSendWhileRecording}
          className="p-3 bg-gray-100 text-blue-800/80 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <Send size={20} className={!isReviewing ? "ml-0.5" : ""} />
        </button>
      </div>

      {/* Hidden audio player for preview */}
      {isReviewing && audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
        />
      )}
    </div>
  );
};

export default AudioRecorder;
