// src/lib/avatarUtils.js

import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/app/firebaseConfig'; 
import { uploadFile } from '@/app/lib/uploadFile'; 

export const base64ToBlob = (base64, type = 'image/jpeg') => {
  try {
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }

    return new Blob([new Uint8Array(byteArrays)], { type });
  } catch (error) {
    console.error('base64ToBlob failed:', error);
    throw new Error('Invalid base64 string');
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
    alert('Please select an avatar!');
    return;
  }

  const uid = auth.currentUser?.uid;
  if (!uid) return;

  setLoading(true);

  uploadFile(
    base64ToBlob(avatar),
    `profile/${uid}/profile-image`,
    () => {}, // optional progress callback
    (error) => {
      console.error('Upload error:', error);
      setLoading(false);
      alert('Upload error:' + error);
      onError(error);
    },
    async (url) => {
      if (url) {
        await updateDoc(doc(db, 'users', uid), { photo_uri: url });
        setStorageUrl(url);
        setLoading(false);
        onSuccess(url);
      }
    }
  );
};

export const confirmDeleteAvatar = async ({ setConfirmOpen, setConfirmInfo }) => {
  setConfirmInfo('Are you sure you want to delete the current profile picture?');
  setConfirmOpen(true);
};
