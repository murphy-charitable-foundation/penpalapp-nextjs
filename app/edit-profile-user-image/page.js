"use client";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebaseConfig";
import EditProfileImage from "@/components/edit-profile-image";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { uploadFile } from "../lib/uploadFile";

export default function EditProfileUserImage() {
  const [image, setImage] = useState("");
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [storageUrl, setStorageUrl] = useState(null);
  const [user, setUser] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const cropperRef = useRef();
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
          // setImage(userData.photo_uri || '/murphylogo.png');
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

    // Cleanup subscription on unmount
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

  const handleDrop = (acceptedFiles) => {
    setImage(URL.createObjectURL(acceptedFiles[0]));
  };


  const saveImage = async () => {
    const uid = auth.currentUser?.uid;
  
    if (!uid) return;  // Make sure uid is available
  
    uploadFile(
      croppedImage,
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

            <h1 className="ml-4 text-xl font-bold text-gray-800">Edit image</h1>
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
          <i>Click to edit</i>
          <button
            className="w-[80%] mx-auto mt-[100px] p-2 bg-[#4E802A] text-white font-semibold  rounded-[100px]"
            onClick={saveImage}
          >
            Save New Profile Picture
          </button>
        </div>
      </div>
    </div>
  );
}
