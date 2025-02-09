"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import BottomNavBar from "../../components/bottom-nav-bar";
import { File, X, Video, Play, Pause, Volume2, VolumeX, Settings } from "lucide-react";
import Compressor from 'compressorjs';

export default function WriteLetter() {
  const [letterContent, setLetterContent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const auth = getAuth();
  const storage = getStorage();
  const fileInputRef = useRef(null);
  const router = useRouter();
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRefs = useRef({});
  const [videoControls, setVideoControls] = useState({});
  const videoRefs = useRef({});
  const [compressionSettings, setCompressionSettings] = useState({
    image: { 
      quality: 0.6, 
      maxWidth: 1920, 
      maxHeight: 1080,
      resize: true
    },
    video: { quality: 'medium', bitrate: '1000k' },
    audio: { bitrate: '128k' }
  });
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const ffmpegRef = useRef(null);
  const [isCompressionSettingsOpen, setIsCompressionSettingsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Only fetch users when authenticated
        fetchUsers();
      } else {
        setUsers([]); // Clear users if not authenticated
      }
    });

    async function fetchUsers() {
      try {
        const usersCollectionRef = collection(db, "users");
        const snapshot = await getDocs(usersCollectionRef);
        const usersList = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(user => user.id !== auth.currentUser?.uid); // Exclude current user
        
        console.log("Fetched users count:", usersList.length);
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpeg = createFFmpeg({ 
        log: true,
        progress: ({ ratio }) => {
          setCompressionProgress(Math.round(ratio * 100));
        }
      });
      await ffmpeg.load();
      ffmpegRef.current = ffmpeg;
    };
    loadFFmpeg();
  }, []);

  const handleFileIconClick = () => {
    fileInputRef.current.click();
  };

  const compressFile = async (file) => {
    setIsCompressing(true);
    try {
      if (file.type.startsWith('image/')) {
        return await compressImage(file);
      } else if (file.type.startsWith('video/')) {
        return await compressVideo(file);
      } else if (file.type.startsWith('audio/')) {
        return await compressAudio(file);
      }
      return {
        originalFile: file,
        compressedBlob: file,
        isCompressed: false
      };
    } finally {
      setIsCompressing(false);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      new Compressor(file, {
        quality: compressionSettings.image.quality,
        maxWidth: compressionSettings.image.maxWidth,
        maxHeight: compressionSettings.image.maxHeight,
        success(compressedBlob) {
          resolve({
            originalFile: file,
            compressedBlob,
            isCompressed: true,
            compressionRatio: ((compressedBlob.size / file.size) * 100).toFixed(2)
          });
        },
        error(err) {
          console.error('Image compression error:', err);
          resolve({
            originalFile: file,
            compressedBlob: file,
            isCompressed: false
          });
        }
      });
    });
  };

  const compressVideo = async (file) => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) throw new Error('FFmpeg not loaded');

    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = 'output.mp4';

    ffmpeg.FS('writeFile', inputName, await fetchFile(file));

    // Apply compression based on quality setting
    const compressionPresets = {
      high: { crf: '18', preset: 'slow' },
      medium: { crf: '23', preset: 'medium' },
      low: { crf: '28', preset: 'fast' }
    };
    const preset = compressionPresets[compressionSettings.video.quality];

    await ffmpeg.run(
      '-i', inputName,
      '-c:v', 'libx264',
      '-crf', preset.crf,
      '-preset', preset.preset,
      '-c:a', 'aac',
      '-b:a', compressionSettings.video.bitrate,
      outputName
    );

    const compressedData = ffmpeg.FS('readFile', outputName);
    const compressedBlob = new Blob([compressedData.buffer], { type: 'video/mp4' });

    // Cleanup
    ffmpeg.FS('unlink', inputName);
    ffmpeg.FS('unlink', outputName);

    return {
      originalFile: file,
      compressedBlob,
      isCompressed: true,
      compressionRatio: ((compressedBlob.size / file.size) * 100).toFixed(2)
    };
  };

  const compressAudio = async (file) => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) throw new Error('FFmpeg not loaded');

    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = 'output.mp3';

    ffmpeg.FS('writeFile', inputName, await fetchFile(file));

    await ffmpeg.run(
      '-i', inputName,
      '-c:a', 'libmp3lame',
      '-b:a', compressionSettings.audio.bitrate,
      outputName
    );

    const compressedData = ffmpeg.FS('readFile', outputName);
    const compressedBlob = new Blob([compressedData.buffer], { type: 'audio/mp3' });

    // Cleanup
    ffmpeg.FS('unlink', inputName);
    ffmpeg.FS('unlink', outputName);

    return {
      originalFile: file,
      compressedBlob,
      isCompressed: true,
      compressionRatio: ((compressedBlob.size / file.size) * 100).toFixed(2)
    };
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    
    try {
      const processedFiles = await Promise.all(files.map(async (file) => {
        const processed = await compressFile(file);
        return {
          file: processed.compressedBlob,
          type: file.type.startsWith('audio/') ? 'audio' : 
                file.type.startsWith('video/') ? 'video' : 'other',
          url: URL.createObjectURL(processed.compressedBlob),
          originalSize: processed.originalFile.size,
          compressedSize: processed.compressedBlob.size,
          name: file.name
        };
      }));
  
      setAttachments(prev => [...prev, ...processedFiles]);
    } catch (error) {
      console.error('File processing error:', error);
      alert('Error processing files. Please try again.');
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file) => {
    const userId = auth.currentUser.uid;
    const storageRef = ref(storage, `attachments/${userId}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSendLetter = async () => {
    const contentString = editor.document
      .map(block => block.content?.map(c => c.text).join('') || '')
      .join('\n')
      .trim();

    if (!contentString || !selectedUser) {
      alert("Please fill in the letter content and select a recipient.");
      return;
    }

    if (!auth.currentUser) {
      alert("Sender not identified, please log in.");
      return;
    }

    setIsSending(true);

    try {
      const uploadedAttachments = await Promise.all(attachments.map(uploadFile));

      const letterData = {
        content: contentString,
        recipientId: selectedUser.id,
        senderId: auth.currentUser.uid,
        timestamp: new Date(),
        attachments: uploadedAttachments,
      };

      await addDoc(collection(db, "letters"), letterData);
      alert("Letter sent successfully!");
      editor.replaceBlocks(editor.document, [
        { type: "paragraph", content: "" }
      ]);
      setSelectedUser(null);
      setAttachments([]);
      setIsSending(false);
    } catch (error) {
      console.error("Error sending letter: ", error);
      
      if (error.code === 'permission-denied') {
        alert("Your account is currently locked. Please contact support.");
      } else if (error.code === 'quota-exceeded') {
        alert("You've reached your daily letter limit. Please try again tomorrow.");
      } else if (error.code === 'invalid-argument') {
        alert("Invalid letter format. Please check your content and try again.");
      } else {
        Sentry.captureException(error);
        alert("Failed to send the letter. Our team has been notified.");
      }

      setIsSending(false);
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(false);
    console.log("Selected user:", user);
  };

  const toggleAudioPlayback = (url) => {
    if (playingAudio === url) {
      audioRefs.current[url].pause();
      setPlayingAudio(null);
    } else {
      if (playingAudio) {
        audioRefs.current[playingAudio].pause();
      }
      audioRefs.current[url].play();
      setPlayingAudio(url);
    }
  };

  const toggleVideoPlayback = (url) => {
    const videoElement = videoRefs.current[url];
    if (!videoElement) return;

    if (videoElement.paused) {
      videoElement.play();
      setVideoControls(prev => ({
        ...prev,
        [url]: { ...prev[url], isPlaying: true }
      }));
    } else {
      videoElement.pause();
      setVideoControls(prev => ({
        ...prev,
        [url]: { ...prev[url], isPlaying: false }
      }));
    }
  };

  const handleVideoTimeUpdate = (url) => {
    const video = videoRefs.current[url];
    if (!video) return;

    setVideoControls(prev => ({
      ...prev,
      [url]: {
        ...prev[url],
        currentTime: video.currentTime,
        duration: video.duration
      }
    }));
  };

  const handleVideoVolumeChange = (url, value) => {
    const video = videoRefs.current[url];
    if (!video) return;

    video.volume = value[0];
    setVideoControls(prev => ({
      ...prev,
      [url]: { ...prev[url], volume: value[0] }
    }));
  };

  const CompressionSettingsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Image Compression Settings</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-gray-900">
                Quality ({Math.round(compressionSettings.image.quality * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={compressionSettings.image.quality * 100}
                onChange={(e) => setCompressionSettings(prev => ({
                  ...prev,
                  image: { ...prev.image, quality: Number(e.target.value) / 100 }
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block text-gray-700">
                Max Width ({compressionSettings.image.maxWidth}px)
              </label>
              <input
                type="range"
                min="320"
                max="3840"
                step="160"
                value={compressionSettings.image.maxWidth}
                onChange={(e) => setCompressionSettings(prev => ({
                  ...prev,
                  image: { ...prev.image, maxWidth: Number(e.target.value) }
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block text-gray-700">
                Max Height ({compressionSettings.image.maxHeight}px)
              </label>
              <input
                type="range"
                min="240"
                max="2160"
                step="160"
                value={compressionSettings.image.maxHeight}
                onChange={(e) => setCompressionSettings(prev => ({
                  ...prev,
                  image: { ...prev.image, maxHeight: Number(e.target.value) }
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="resize"
                checked={compressionSettings.image.resize}
                onChange={(e) => setCompressionSettings(prev => ({
                  ...prev,
                  image: { ...prev.image, resize: e.target.checked }
                }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="resize" className="text-sm text-gray-700 ">
                Resize large images
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
  
        {/* Recipient Info */}
        <div className="flex items-center space-x-3 p-4 bg-white rounded-t-lg border-b border-gray-300">
          {selectedUser ? (
            <>
              <img
                src={selectedUser.photoURL || "/usericon.png"}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h2 className="font-bold text-black">
                  {selectedUser.firstName} Palermo
                </h2>
                <p className="text-sm text-gray-500">{selectedUser.country}</p>
              </div>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsModalOpen(!isModalOpen)}
                className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Select a Recipient
              </button>
              {isModalOpen && (
                <div className="absolute left-0 mt-2 bg-white p-6 rounded-lg shadow-xl max-w-md w-full z-10">
                  <h3 className="font-semibold text-xl text-gray-800 mb-4">
                    Select a Recipient
                  </h3>
                  <ul className="max-h-60 overflow-auto mb-4 text-gray-700">
                    {users.map((user) => (
                      <li
                        key={user.id}
                        onClick={() => selectUser(user)}
                        className="p-3 hover:bg-blue-100 cursor-pointer rounded-md"
                      >
                        {user.firstName} - {user.country}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="mt-2 p-3 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-150"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
  
        {/* Text Area */}
        <textarea
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          value={letterContent}
          onChange={(e) => setLetterContent(e.target.value)}
          rows="10"
        ></textarea>
  
        <div className="space-x-2 flex p-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleFileIconClick}
              className="flex items-center px-4 py-2 border bg-blue-500 border-gray-300 rounded-lg hover:bg-blue-600"
            >
              <File className="mr-2 h-4 w-4" />
              Attach Files
            </button>
            <button
              onClick={() => setIsCompressionSettingsOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="h-4 w-4 text-gray-700" />
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            multiple
          />
          <button
            onClick={handleSendLetter}
            disabled={isSending}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4l8 8-8 8-8-8 8-8z"
              ></path>
            </svg>
          </button>
          <button
            onClick={() => {
              setLetterContent("");
              setAttachments([]);
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"
              ></path>
            </svg>
          </button>
        </div>
  
        {/* Display selected attachments */}
        {attachments.length > 0 && (
          <div className="h-60 p-4 border-t border-gray-200 overflow-y-auto">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex flex-col bg-gray-900 rounded-md mb-4 overflow-hidden"
              >
                {attachment.type === 'video' ? (
                  <div className="w-full">
                    <div className="relative">
                      <video
                        ref={el => { if (el) videoRefs.current[attachment.url] = el; }}
                        src={attachment.url}
                        className="w-full h-[200px] object-contain bg-black"
                        onTimeUpdate={() => handleVideoTimeUpdate(attachment.url)}
                        onLoadedMetadata={() => {
                          setVideoControls(prev => ({
                            ...prev,
                            [attachment.url]: {
                              isPlaying: false,
                              currentTime: 0,
                              duration: videoRefs.current[attachment.url].duration,
                              volume: 1
                            }
                          }));
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3">
                        <div className="flex items-center justify-between w-full gap-4">
                          <button 
                            onClick={() => toggleVideoPlayback(attachment.url)}
                            className="text-white hover:text-gray-200 p-2"
                          >
                            {videoControls[attachment.url]?.isPlaying ? 
                              <Pause className="h-5 w-5" /> : 
                              <Play className="h-5 w-5" />
                            }
                          </button>

                          <div className="flex items-center gap-3 flex-1">
                            <div className="text-white text-xs">
                              {Math.floor(videoControls[attachment.url]?.currentTime || 0)}s
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max={videoControls[attachment.url]?.duration || 100}
                              value={videoControls[attachment.url]?.currentTime || 0}
                              onChange={(e) => {
                                const video = videoRefs.current[attachment.url];
                                if (video) {
                                  video.currentTime = e.target.value;
                                }
                              }}
                              className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-white text-xs">
                              {Math.floor(videoControls[attachment.url]?.duration || 0)}s
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-white" />
                            <input 
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={videoControls[attachment.url]?.volume || 1}
                              onChange={(e) => handleVideoVolumeChange(attachment.url, [parseFloat(e.target.value)])}
                              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center">
                      {attachment.type === 'audio' ? (
                        <button
                          className="p-1 hover:bg-gray-200 rounded"
                          onClick={() => toggleAudioPlayback(attachment.url)}
                        >
                          {playingAudio === attachment.url ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <File className="h-4 w-4 mr-2" />
                      )}
                      <span className="text-sm truncate">{attachment.file.name}</span>
                    </div>
                    <button
                      className="p-1 hover:bg-gray-200 rounded"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {attachment.type === 'audio' && (
                      <audio
                        ref={el => { if (el) audioRefs.current[attachment.url] = el; }}
                        src={attachment.url}
                        onEnded={() => setPlayingAudio(null)}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNavBar />
      {isCompressing && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${compressionProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Compressing: {compressionProgress}%
          </p>
        </div>
      )}
      <CompressionSettingsModal
        isOpen={isCompressionSettingsOpen}
        onClose={() => setIsCompressionSettingsOpen(false)}
      />
    </div>
  );
}