"use client";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebaseConfig";
import EditProfileImage from "../../components/edit-profile-image";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { uploadFile } from "../lib/uploadFile";
import Button from "../../components/general/Button";
import { BackButton } from "../../components/general/BackButton";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import { logButtonEvent, logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";

export default function EditProfileUserImage() {
  const [image, setImage] = useState("");
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const cropperRef = useRef();
  const router = useRouter();

  usePageAnalytics("/edit-profile-user-image");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (!docSnap.exists()) return;
      const userData = docSnap.data();
      setNewProfileImage(userData.photo_uri || "/murphylogo.png");
      setPreviewURL(userData.photo_uri || "/murphylogo.png");
    };
    fetchUserData();
  }, [auth.currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  const handleCrop = () => {
    if (cropperRef.current?.cropper?.getCroppedCanvas) {
      cropperRef.current.cropper.getCroppedCanvas().toBlob((blob) => {
        setCroppedImage(blob);
      });
    }
  };

  const handleDrop = (acceptedFiles) => {
    setImage(URL.createObjectURL(acceptedFiles[0]));
  };

  const saveImage = async () => {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      logError(new Error("No user uid found"), {
        description: "Save image error",
      });
      return;
    }

    if (!croppedImage) {
      alert("请先裁剪图片");
      return;
    }

    setIsSaving(true);

    try {
      uploadFile(
        croppedImage,
        `profile/${uid}/profile-image`,
        () => {},
        (error) => {
          logError(error, { description: "Upload error" });
          setIsSaving(false);
        },
        async (url) => {
          try {
            if (url) {
              await updateDoc(doc(db, "users", uid), { photo_uri: url });
              router.push("/profile");
            }
          } catch (error) {
            logError(error, { description: "Firestore update error" });
          } finally {
            setIsSaving(false);
          }
        },
      );
    } catch (error) {
      logError(error, { description: "Unexpected upload error" });
      setIsSaving(false);
    }

    logButtonEvent("Save Profile Picture clicked!", "/edit-profile-user-image");
  };

  if (isSaving) return <LoadingSpinner />;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-lg mx-auto p-6">
        <div className="flex flex-col justify-between items-center">
          <div className="block">
            <BackButton />
            <h1 className="ml-4 text-xl text-center font-bold text-gray-800">
              Edit image
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center gap-6 mt-6">
          <EditProfileImage
            image={image}
            newProfileImage={newProfileImage}
            previewURL={previewURL}
            handleDrop={handleDrop}
            handleCrop={handleCrop}
            cropperRef={cropperRef}
          />
          <i>Click to edit</i>
          <Button
            btnType="button"
            btnText="Save New Profile Picture"
            color="green"
            onClick={saveImage}
          />
        </div>
      </div>
    </div>
  );
}
