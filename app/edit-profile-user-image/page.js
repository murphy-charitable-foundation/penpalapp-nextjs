"use client";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebaseConfig";
import EditProfileImage from "@/components/edit-profile-image";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { uploadFile } from "../lib/uploadFile";
import Webcam from "react-webcam"; // Added for webcam

export default function EditProfileUserImage() {
  const [image, setImage] = useState("");
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [storageUrl, setStorageUrl] = useState(null);
  const [user, setUser] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // State to control webcam display
  const [showWebcam, setShowWebcam] = useState(false);

  const cropperRef = useRef();
  const webcamRef = useRef(null); // Added for webcam
  const fileInputRef = useRef(null); // Added for file upload
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      console.log(auth);
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setNewProfileImage(userData.photo_uri || "/murphylogo.png");
          setPreviewURL(userData.photo_uri || "/murphylogo.png");
        }
      }
    };
    fetchUserData();
  }, [auth.currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // User is signed out
        setUser(null);
        router.push("/login"); // Redirect to login page
      }
    });
    return () => unsubscribe();
  }, [router]);

  const onUploadComplete = (url) => {
    console.log("Upload complete. File available at:", url);
    setStorageUrl(url);
  };

  const handleCrop = () => {
    if (
      cropperRef.current &&
      typeof cropperRef.current?.cropper?.getCroppedCanvas === "function"
    ) {
      const canvas = cropperRef.current.cropper.getCroppedCanvas();
      canvas.toBlob((blob) => {
        setCroppedImage(blob);
      });
    }
  };

  // This function is used for drag-and-drop as well as file selection
  const handleDrop = (acceptedFiles) => {
    // acceptedFiles can be a FileList from input
    const file = acceptedFiles[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  // File input change handler for user-selected file
  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleDrop(files);
    }
  };

  // Capture image from webcam
  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImage(imageSrc);
        setPreviewURL(imageSrc);
      }
      setShowWebcam(false);
    }
  };

  const saveImage = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return; // Make sure uid is available

    // If cropping wasn't done, convert the base64 image to Blob
    const fileToUpload = croppedImage || dataURLtoBlob(image);
    if (!fileToUpload) return;

    uploadFile(
      fileToUpload,
      `profile/${uid}/profile-image`,
      () => {},
      (error) => console.error("Upload error:", error),
      async (url) => {
        setStorageUrl(url);
        console.log("Image Url:" + url);
        if (url) {
          await updateDoc(doc(db, "users", uid), { photo_uri: url });
          router.push("/profile");
        }
      }
    );
  };

  // Helper to convert base64 image to Blob
  function dataURLtoBlob(dataURL) {
    if (!dataURL?.includes("data:image")) return null;
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-lg mx-auto p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button onClick={() => window.history.back()}>
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="ml-4 text-xl font-bold text-gray-800">
              Edit image
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <EditProfileImage
            image={image}
            newProfileImage={newProfileImage}
            previewURL={previewURL}
            handleDrop={handleDrop}
            handleCrop={handleCrop}
            cropperRef={cropperRef}
          />
          <i>Click to edit or drop a file above</i>

          {/* Button to open file input for uploading image from computer */}
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded"
          >
            Upload from Computer
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {/* Button to toggle webcam */}
          {!showWebcam && (
            <button
              onClick={() => setShowWebcam(true)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Open Webcam
            </button>
          )}

          {/* Display webcam if toggled */}
          {showWebcam && (
            <div className="mt-4">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 1280,
                  height: 720,
                  facingMode: "user",
                }}
                className="border border-gray-300"
              />
              <div className="flex justify-center mt-2 space-x-2">
                <button
                  onClick={capturePhoto}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Capture
                </button>
                <button
                  onClick={() => setShowWebcam(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <button
            className="w-[80%] mx-auto mt-[100px] p-2 bg-[#4E802A] text-white font-semibold rounded-[100px]"
            onClick={saveImage}
          >
            Save New Profile Picture
          </button>
        </div>
      </div>
    </div>
  );
}
