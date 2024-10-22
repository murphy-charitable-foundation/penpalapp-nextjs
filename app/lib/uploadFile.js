import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { updateDoc, doc } from "firebase/firestore";
import { useRouter } from "next/router";
import { storage } from "../firebaseConfig";

// Reusable upload function
const uploadFile = async (
  file,
  path,
  onUploadProgress,
  onComplete,
  onError
) => {
  if (!file || !path) return;

  console.log(path)

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      if (onUploadProgress) onUploadProgress(progress);
    },
    (error) => {
      console.error("Upload error:", error);
      if (onError) onError(error);
    },
    async () => {
      try {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        if (onComplete) onComplete(url);
      } catch (error) {
        console.error("Error getting download URL:", error);
        if (onError) onError(error);
      }
    }
  );
};

export { uploadFile };
