import { ref, uploadBytesResumable, getDownloadURL } from "@firebase/storage";
import { storage, db } from "../firebaseConfig";
import { updateDoc, doc } from "firebase/firestore";
import { logError } from "./analytics";

/**
 * Uploads a profile picture for a user and updates their Firestore `photo_uri`.
 * @param {string} uid
 * @param {File|Blob} file
 * @param {(progress:number)=>void} onProgress
 * @param {(error:Error)=>void} onError
 * @returns {Promise<string|null>} download URL or null
 */
export const uploadProfilePicture = async (uid, file, onProgress = () => {}, onError = () => {}) => {
  if (!file) return null;

  return new Promise((resolve) => {
    try {
      const storageRef = ref(storage, `profile/${uid}/profile-image`);
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
            resolve(url || null);
            if (url) {
              try {
                await updateDoc(doc(db, "users", uid), { photo_uri: url });
              } catch (firestoreError) {
                logError(firestoreError, {
                  description: "Failed to update Firestore after profile upload",
                });
                try {
                  onError(firestoreError);
                } catch (e) {
                  // ignore
                }
              }
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
        }
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
  const path = `profile/${uid}/profile-image`;
  try {
    const photoRef = ref(storage, path);
    const downloaded = await getDownloadURL(photoRef);
    return downloaded;
  } catch (error) {
    if (error?.code === "storage/object-not-found") {
      return null;
    }
    logError(error, {
      description: "Error fetching user profile:",
    });
    return null;
  }
};
