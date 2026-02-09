"use client";

import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebaseConfig";
import EditProfileImage from "../../components/edit-profile-image";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { uploadFile } from "../lib/uploadFile";
import Button from "../../components/general/Button";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import { logButtonEvent, logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";
import Dialog from "../../components/general/Dialog";
import { PageHeader } from "../../components/general/PageHeader";

export default function EditProfileUserImage() {
  const [image, setImage] = useState("");
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);
  const [hasUnsavedImage, setHasUnsavedImage] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const pendingNavRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  const cropperRef = useRef();
  const router = useRouter();

  usePageAnalytics("/edit-profile-user-image");

  useEffect(() => {
    const fetchUserData = async () => {
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
    setIsSaving(false);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const attemptNavigateWithGuard = (navigate) => {
    if (!hasUnsavedImage) {
      navigate();
      return;
    }

    pendingNavRef.current = navigate;
    setShowLeaveDialog(true);
  };

  const handleCrop = () => {
    if (
      cropperRef.current &&
      typeof cropperRef.current?.cropper?.getCroppedCanvas === "function"
    ) {
      const canvas = cropperRef.current.cropper.getCroppedCanvas();
      canvas.toBlob((blob) => {
        setCroppedImage(blob);
        setHasUnsavedImage(true);
      });
    }
  };

  const handleDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setHasUnsavedImage(true);

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setImage(url);
  };

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const saveImage = async () => {
    setIsSaving(true);

    const uid = auth.currentUser?.uid;
    if (!uid) return;

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
        if (url) {
          await updateDoc(doc(db, "users", uid), { photo_uri: url });
          setHasUnsavedImage(false);
          router.push("/profile");
        }
      }
    );

    logButtonEvent(
      "Save Profile Picture clicked!",
      "/edit-profile-user-image"
    );
  };

  return (
    <div>
      {isSaving ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-lg mx-auto p-6">
            <PageHeader
              title="Edit image"
              image={false}
              onBack={() =>
                attemptNavigateWithGuard(() =>
                router.push(`/profile-view/${auth.currentUser?.uid}`)
              )
              }
            />

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

      <Dialog
        isOpen={showLeaveDialog}
        onClose={() => {
          setShowLeaveDialog(false);
          pendingNavRef.current = null;
        }}
        variant="confirmation"
        title="Unsaved photo changes"
        content="You have unsaved changes to your profile photo. Are you sure you want to leave?"
        buttons={[
          {
            text: "Cancel",
            variant: "secondary",
            onClick: () => {
              setShowLeaveDialog(false);
              pendingNavRef.current = null;
            },
          },
          {
            text: "Leave",
            variant: "primary",
            onClick: () => {
              setShowLeaveDialog(false);
              pendingNavRef.current?.();
              pendingNavRef.current = null;
            },
          },
        ]}
      />
    </div>
  );
}
