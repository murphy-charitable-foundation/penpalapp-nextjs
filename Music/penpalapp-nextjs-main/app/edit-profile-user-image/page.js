"use client";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebaseConfig";
import EditProfileImage from "@/components/edit-profile-image";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { uploadFile } from "../lib/uploadFile";

export default function EditProfileUserImage() {
  const [previewURL, setPreviewURL] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [user, setUser] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPreviewURL(docSnap.data().photo_uri || "/murphylogo.png");
        }
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const startCamera = async () => {
    setIsCameraOn(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const dataUrl = canvasRef.current.toDataURL("image/png");
      setPreviewURL(dataUrl);
      setIsCameraOn(false);

      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => setCroppedImage(blob));
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPreviewURL(URL.createObjectURL(file));
      setCroppedImage(file);
    }
  };

  const saveImage = async () => {
    setIsSaving(true);
    setSaved(false);
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    uploadFile(
      croppedImage,
      `profile/${uid}/profile-image`,
      () => {},
      (error) => {
        console.error("Upload error:", error);
        setIsSaving(false);
      },
      async (url) => {
        if (url) {
          await updateDoc(doc(db, "users", uid), { photo_uri: url });
          setIsSaving(false);
          setSaved(true);
        }
      }
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center p-6">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Edit Image</h1>
        <div className="flex flex-col items-center">
          {isCameraOn ? (
            <div className="relative">
              <div className="w-[250px] h-[250px] rounded-full overflow-hidden border-4 border-gray-300 shadow-md">
                <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
              </div>
            </div>
          ) : (
            <>
              {previewURL ? (
                <img
                  src={previewURL}
                  alt="Preview"
                  className="w-[250px] h-[250px] object-cover rounded-full border-4 border-gray-300 shadow-md"
                />
              ) : (
                <EditProfileImage previewURL={previewURL} />
              )}
            </>
          )}

          <button onClick={captureImage} className="mt-4 bg-red-500 text-white px-4 py-2 rounded-full">
            Capture
          </button>
          
          <canvas ref={canvasRef} width={300} height={300} className="hidden" />

          <div className="flex flex-col space-y-4 mt-4 w-full text-center">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md" onClick={startCamera}>
              Open Camera
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button className="px-4 py-2 bg-gray-500 text-white rounded-md" onClick={() => fileInputRef.current.click()}>
              Upload from Memory
            </button>
            {previewURL && (
              <button
                className={`px-4 py-2 rounded-md ${saved ? 'bg-green-700' : 'bg-green-500'} text-white flex items-center justify-center`}
                onClick={saveImage}
                disabled={isSaving}
              >
                {isSaving ? (
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                ) : saved ? "Saved" : "Save Image"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
