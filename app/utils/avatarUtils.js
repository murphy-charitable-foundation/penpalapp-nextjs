// src/lib/avatarUtils.js

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  list,
} from "@firebase/storage";
import { updateDoc, doc } from "firebase/firestore";
import { auth, storage, db } from "@/app/firebaseConfig";
import { logError } from "./analytics";

export const uploadProfilePicture = async (
  uid,
  file,
  onProgress = () => {},
  onError = () => {},
) => {
  if (!file) return null;

  return new Promise((resolve) => {
    try {
      const storageRef = ref(storage, `users/${uid}/profile-image`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          try {
            onProgress(progress);
          } catch (e) {
            // ignore progress handler errors
          }
        },
        (error) => {
          try {
            onError(error);
          } catch (e) {
            // ignore
          }
          logError(error, { description: "Profile upload failed" });
          resolve(null);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            if (url) {
              try {
                await updateDoc(doc(db, "users", uid), { photo_uri: url });
                resolve(url);
              } catch (firestoreError) {
                logError(firestoreError, {
                  description: "Failed to update Firestore after profile upload",
                });
                try {
                  onError(firestoreError);
                } catch (e) {
                  // ignore
                }
                resolve(null);
              }
            } else {
              resolve(null);
            }
          } catch (e) {
            try {
              onError(e);
            } catch (er) {
              // ignore
            }
            logError(e, { description: "Getting download URL failed" });
            resolve(null);
          }
        },
      );
    } catch (e) {
      try {
        onError(e);
      } catch (er) {
        // ignore
      }
      resolve(null);
    }
  });
};

export const getUserPfp = async (uid) => {
  if (!uid) {
    return null;
  }

  try {
    const userFolderRef = ref(storage, `users/${uid}`);
    const result = await list(userFolderRef, { maxResults: 10 });
    const profileImageRef = result.items.find(
      (item) => item.name === "profile-image",
    );

    if (!profileImageRef) {
      return null;
    }

    return await getDownloadURL(profileImageRef);
  } catch (error) {
    logError(error, {
      description: "Error fetching user profile",
      userId: uid,
    });

    return null;
  }
};

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
    const url = await uploadProfilePicture(uid, avatarBlob, () => {}, (error) => {
      setLoading(false);
      onError(error);
    });

    if (!url) {
      setLoading(false);
      onError?.(new Error("Upload returned empty URL"));
      return;
    }

    try {
      setStorageUrl?.(url);
      onSuccess(url);
    } catch (e) {
      onError?.(new Error("Save Error!"));
    } finally {
      setLoading(false);
    }
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