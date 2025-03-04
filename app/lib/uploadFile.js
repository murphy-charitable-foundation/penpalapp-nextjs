import { ref, uploadBytesResumable, getDownloadURL } from "@firebase/storage";
import { storage } from "../firebaseConfig";

/**
 * Utility file upload function to Firebase storage.
 * @param {File} file - The file to be uploaded.
 * @param {string} path - Firebase storage path where the file will be stored.
 * @param {function} onProgress - Callback for upload progress.
 * @param {function} onError - Callback for handling errors.
 * @param {function} onSuccess - Callback for handling successful upload.
 */
const uploadFile = async (file, path, onProgress, onError, onSuccess) => {
  if (!file) return;

  const storageRef = ref(storage, path);

  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    },
    (error) => {
      console.error("Upload error:", error);
      onError(error);
    },
    async () => {
      try {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        if (onSuccess) onSuccess(url);
      } catch (error) {
        console.error("Error getting download URL:", error.message); // Log error message
        if (onError) onError(error);
      }
    }
  );
};

export { uploadFile };
