// src/lib/avatarUtils.js

import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/app/firebaseConfig";
import { uploadFile } from "@/app/utils/uploadFile";

export const base64ToBlob = (base64, type = "image/jpeg") => {
  try {
    const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;

    const byteCharacters =
      typeof atob === "function"
        ? atob(base64Data)
        : Buffer.from(base64Data, "base64").toString("binary");
    const byteArrays = [];

    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }

    return new Blob([new Uint8Array(byteArrays)], { type });
  } catch (error) {
    console.error("base64ToBlob failed:", error);
    throw new Error("Invalid base64 string");
  }
};

export const saveAvatar = async ({
  avatar,
  setLoading,
  setStorageUrl,
  onSuccess = () => {},
  onError = () => {},
}) => {
  if (!avatar) {
    onError(new Error("Please select an avatar!"));
    return;
  }

  const uid = auth.currentUser?.uid;
  if (!uid) {
    onError?.(new Error("Not authenticated"));
    return;
  }

  setLoading(true);
  let avatarBlob;
  try {
    avatarBlob = base64ToBlob(avatar);
  } catch (error) {
    setLoading(false);
    onError?.(error);
    return;
  }

    try {
    uploadFile(
      avatarBlob,
      `user-profiles/${uid}/profile-image`,
      () => {}, // optional progress callback
     (error) => {
        setLoading(false);
        onError(new Error("Upload error"));
      },
      async (url) => {
        if (!url) {
          setLoading(false);
          onError?.(new Error("Upload returned empty URL"));
          return;
        }
        try {
          await updateDoc(doc(db, "users", uid), { photo_uri: url });
          setStorageUrl?.(url);
          onSuccess(url);
        } catch (e) {
          onError?.(new Error("Save Error!"));
        } finally {
          setLoading(false);
        }
      },
    );
  } catch (error) {
    setLoading(false);
    onError?.(error);
  }
};

export const confirmDeleteAvatar = async ({
  setConfirmOpen,
  setConfirmInfo,
}) => {
  setConfirmInfo(
    "Are you sure you want to delete the current profile picture?",
  );
  setConfirmOpen(true);
};