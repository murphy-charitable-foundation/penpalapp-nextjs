"use client";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebaseConfig";
import EditProfileImage from "../../components/edit-profile-image";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { uploadFile } from "../lib/uploadFile";
import Button from "../../components/general/Button";
import BottomNavBar from "../../components/bottom-nav-bar";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import { PageHeader } from "../../components/general/PageHeader";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
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
      if (!currentUser) {
        router.push("/login"); // Redirect to login page
      }
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

    uploadFile(
      croppedImage,
      `profile/${uid}/profile-image`,
      () => {},
      (error) => {
        logError(error, {
          description: "Upload error: ",
        });
        setIsSaving(false);
      },
      async (url) => {
        console.log("Image Url:" + url);
        if (url) {
          await updateDoc(doc(db, "users", uid), { photo_uri: url });
          router.push("/profile");
        }
      },
    );
    logButtonEvent("Save Profile Picture clicked!", "/edit-profile-user-image");
  };

  return (
    <PageBackground className="bg-gray-100 h-screen overflow-hidden flex flex-col">
      {/* Loading overlay */}
      {isSaving && <LoadingSpinner />}

      <div className="flex-1 min-h-0 flex justify-center">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="min-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* ===== HEADER ===== */}
          <PageHeader title="Edit image" image={false} />

          {/* ===== SINGLE SCROLLER ===== */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6 flex flex-col items-center gap-6">
            <EditProfileImage
              image={image}
              newProfileImage={newProfileImage}
              previewURL={previewURL}
              handleDrop={handleDrop}
              handleCrop={handleCrop}
              cropperRef={cropperRef}
            />

            <i className="text-sm text-gray-500">Click to edit</i>

            <Button
              btnType="button"
              btnText="Save New Profile Picture"
              color="green"
              onClick={saveImage}
            />
          </div>

          {/* ===== NAVBAR ===== */}
          <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
            <BottomNavBar />
          </div>
        </PageContainer>
      </div>
    </PageBackground>
  );
}
