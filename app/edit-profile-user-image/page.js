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
  const [storageUrl, setStorageUrl] = useState(null);
  const [user, setUser] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);


  const [isSaving, setIsSaving] = useState(false);

  const cropperRef = useRef();
  const router = useRouter();

  usePageAnalytics("/edit-profile-user-image");

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
    setIsSaving(false);

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

        setHasUnsavedChanges(true); // Mark that there are unsaved changes

      });
    }
  };

  const handleDrop = (acceptedFiles) => {
    setImage(URL.createObjectURL(acceptedFiles[0]));
    setHasUnsavedChanges(true); // Mark that there are unsaved changes after dropping a new image
  };

  const saveImage = async () => {
    setIsSaving(true);

    const uid = auth.currentUser?.uid;

    if (!uid) return; // Make sure uid is available

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
        setStorageUrl(url);
        console.log("Image Url:" + url);
        if (url) {
          await updateDoc(doc(db, "users", uid), { photo_uri: url });

          setHasUnsavedChanges(false); // Reset unsaved changes flag because changes are saved

          router.push("/profile");
        }
      }
    );
    logButtonEvent("Save Profile Picture clicked!", "/edit-profile-user-image");
  };

  return (
    <div>
      {isSaving ? (
        <LoadingSpinner></LoadingSpinner>
      ) : (
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-lg mx-auto p-6">
            <div className="flex flex-col justify-between items-center">
              <div className="block">
                <div
                  onClickCapture={(e) => {
                    if (hasUnsavedChanges) {
                      const confirmLeave = window.confirm(
                        "You have unsaved changes. Are you sure you want to leave?"
                      );

                      if (!confirmLeave) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }
                  }}
                >
                  <BackButton />
                </div>
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
      )}
    </div>
  );
}
