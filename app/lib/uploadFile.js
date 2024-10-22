import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { updateDoc, doc } from "firebase/firestore";
import { useRouter } from "next/router";
import { storage } from "../firebaseConfig";
import { StorageReference } from "@firebase/storage";
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
  console.log("Storage initialized:", storage);

  const storageRef = ref(storage, `profile/love`);

  console.log('made it here')
  const uploadTask = uploadBytesResumable(storageRef, file);

  console.log("didnt make it hre")

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      if (onUploadProgress) onUploadProgress(progress);
    },
    (error) => {
      console.error("Upload error:", error.message); // Log the error message
      if (onError) onError(error);
    },
    async () => {
      try {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        if (onComplete) onComplete(url);
      } catch (error) {
        console.error("Error getting download URL:", error.message); // Log error message
        if (onError) onError(error);
      }
    }
  );  
};

export { uploadFile };
