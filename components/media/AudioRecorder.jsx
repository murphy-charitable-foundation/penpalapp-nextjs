import React, { useState, useRef, useEffect } from "react";
import {
  Square,
  Loader2,
  Lock,
  Trash2,
  Play,
  Pause,
  Send,
} from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "@firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

import { storage, auth } from "../../app/firebaseConfig";
import useBeforeUnloadWarning from "./useBeforeUnloadWarning";
import {
  createAudioRecorder,
  createRecordingBlob,
  disposeAudioRecorder,
  getAudioRecordingError,
  getVoiceFileName,
} from "./audioRecording";

/**
 * Audio Recording and Upload Component
 * @param {Function} onUploadSuccess - Callback upon successful upload: (url) => void
 * @param {Function} onRequireLogin - (Optional) Triggered when an unauthorized user clicks
 * @param {Function} onRecordingComplete - Callback when recording is completed: ({ blob, fileName }) => void
 */
const AudioRecorder = ({ onUploadSuccess, onRequireLogin, onRecordingComplete }) => {
  // --- State Management ---
  const [status, setStatus] = useState("idle"); // 'idle' | 'requesting' | 'recording' | 'review' | 'uploading'
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // User State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Refs
  const mediaRecorderRef = useRef(null);
  const mountedRef = useRef(false);
  const startingRef = useRef(false);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const audioUrlRef = useRef(null);
  const sendAfterStopRef = useRef(false);
  const cancelNextRecordingRef = useRef(false);

  // Keep the elapsed time available to the recorder's onstop callback.
  const timeRef = useRef(0);

  // --- 1. Listen for Login Status ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useBeforeUnloadWarning(status === "recording" || status === "uploading");

  // --- 2. Utility Functions ---
  const formatTime = (seconds) => {
    const total = Math.floor(seconds);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercent = () => {
    const maxTime = status === "recording" ? 900 : duration;
    if (maxTime === 0) return 0;
    return Math.min((time / maxTime) * 100, 100);
  };

  // --- 3. Recording Logic ---
  const startRecording = async () => {
    if (authLoading || startingRef.current || mediaRecorderRef.current) return;
    if (!user) {
      if (onRequireLogin) onRequireLogin();
      else alert("Please log in to use voice features");
      return;
    }

    startingRef.current = true;
    setStatus("requesting");
    try {
      const mediaRecorder = await createAudioRecorder();
      if (!mountedRef.current) {
        disposeAudioRecorder(mediaRecorder);
        return;
      }

      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];
      sendAfterStopRef.current = false;
      cancelNextRecordingRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        if (timerRef.current) clearInterval(timerRef.current);
        if (!mountedRef.current) return;
        if (cancelNextRecordingRef.current) {
          cancelNextRecordingRef.current = false;
          setStatus("idle");
          return;
        }

        let blob;
        try {
          blob = createRecordingBlob(chunks, mediaRecorder.mimeType);
        } catch (error) {
          setStatus("idle");
          alert(getAudioRecordingError(error));
          return;
        }
        const url = URL.createObjectURL(blob);
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = url;

        setAudioBlob(blob);
        setAudioUrl(url);
        setDuration(timeRef.current);

        const fileName = getVoiceFileName(blob);
        if (sendAfterStopRef.current) {
          if (onRecordingComplete) {
            onRecordingComplete({ blob, fileName });
            handleDelete();
          } else {
            handleUploadToFirebase(blob, user.uid);
          }
        } else {
          setStatus("review");
          setTime(0);
        }
      };

      mediaRecorder.onerror = (event) => {
        disposeAudioRecorder(mediaRecorder);
        mediaRecorderRef.current = null;
        if (timerRef.current) clearInterval(timerRef.current);
        if (!mountedRef.current) return;
        setStatus("idle");
        console.warn("Audio recording failed:", event.error);
        alert(getAudioRecordingError(event.error));
      };

      mediaRecorder.start();
      setStatus("recording");
      setTime(0);
      timeRef.current = 0;

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTime((t) => {
          const next = t + 1;
          timeRef.current = next;
          if (next >= 900) {
            stopRecording();
            return next;
          }
          return next;
        });
      }, 1000);
    } catch (error) {
      disposeAudioRecorder(mediaRecorderRef.current);
      mediaRecorderRef.current = null;
      if (!mountedRef.current) return;
      setStatus("idle");
      console.warn("Audio recording could not start:", error);
      alert(getAudioRecordingError(error));
    } finally {
      startingRef.current = false;
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleDelete = () => {
    if (status === "recording") {
      cancelNextRecordingRef.current = true;
      stopRecording();
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
    }

    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;

    setStatus("idle");
    setAudioBlob(null);
    setAudioUrl(null);
    setTime(0);
    timeRef.current = 0;
    setDuration(0);
    setIsPlaying(false);
  };

  const handleSendWhileRecording = () => {
    sendAfterStopRef.current = true;
    stopRecording();
  };

  const handleSendInReview = () => {
    if (audioBlob && user) {
      const fileName = getVoiceFileName(audioBlob);
      if (onRecordingComplete) {
        onRecordingComplete({ blob: audioBlob, fileName });
        handleDelete();
      } else {
        handleUploadToFirebase(audioBlob, user.uid);
      }
    }
  };

  // --- 4. Preview Playback Logic ---
  const togglePlayPreview = () => {
    if (!audioPlayerRef.current) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play().catch((error) => {
        console.error("Playback failed:", error);
        setIsPlaying(false);
      });
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
      const fileName = getVoiceFileName(blob);
      const storagePath = `users/${uid}/voice_messages/${fileName}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Upload failed:", error);
          setStatus("review");
          alert("Upload failed, please try again");
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            if (onUploadSuccess) onUploadSuccess(downloadURL);
            handleDelete();
          } catch (error) {
            console.error("Failed to get download URL:", error);
            setStatus("review");
            alert("Upload failed, please try again");
          }
        },
      );
    } catch (error) {
      console.error("Processing error:", error);
      setStatus("review");
    }
  };

  useEffect(() => {
    const player = audioPlayerRef.current;
    return () => player?.pause();
  }, [audioUrl]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      disposeAudioRecorder(mediaRecorderRef.current);
      mediaRecorderRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    };
  }, []);

  // --- Render Section ---

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

  if (status === "idle" || status === "requesting") {
    const isLoggedOut = !user && !authLoading;
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative bg-green-100 text-green-800 px-4 py-2 rounded-xl text-xs text-center max-w-[200px] shadow-sm">
          {status === "requesting"
            ? "Starting microphone…"
            : "Tap to record a voice message. The maximum length is 15 minutes."}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-green-100"></div>
        </div>

        <button
          onClick={startRecording}
          disabled={authLoading || status === "requesting"}
          className={`w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center border border-gray-100 transition-transform hover:scale-105 active:scale-95 ${
            isLoggedOut ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {status === "requesting" ? (
            <Loader2 className="animate-spin text-green-700" size={24} />
          ) : isLoggedOut ? (
            <Lock className="text-gray-400" size={24} />
          ) : (
            <div className="w-8 h-8 bg-red-500 rounded-full shadow-sm" />
          )}
        </button>
      </div>
    );
  }

  const isReviewing = status === "review";
  const maxDurationText = "15:00";
  const currentFormattedTime = formatTime(time);

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col gap-4">
      <div className="flex flex-col gap-1">
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

      <div className="flex items-center justify-between px-4">
        <button
          onClick={handleDelete}
          className="p-3 bg-gray-100 text-red-800/70 rounded-xl hover:bg-red-100 transition-colors"
        >
          <Trash2 size={20} />
        </button>

        {isReviewing ? (
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
          <button
            onClick={stopRecording}
            className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Square className="text-white fill-current" size={28} />
          </button>
        )}

        <button
          onClick={isReviewing ? handleSendInReview : handleSendWhileRecording}
          className="p-3 bg-gray-100 text-blue-800/80 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <Send size={20} className={!isReviewing ? "ml-0.5" : ""} />
        </button>
      </div>

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
