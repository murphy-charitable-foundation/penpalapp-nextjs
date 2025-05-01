"use client";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { uploadFile } from "../lib/uploadFile";

import Image from 'next/image';
import { useConfirm } from '@/components/ConfirmProvider';
import { useLoading } from '@/components/LoadingProvider';
import { useAlert } from '@/components/AlertProvider';
import CountrySelect from '@/components/general/CountrySelect';
import EditProfileImage from "@/components/edit-profile-image";


export default function AddProfile() {
  const [storageUrl, setStorageUrl] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  ///////////////////////
  const [showMenu, setShowMenu] = useState(false);
  const { confirm } = useConfirm();
  const { setLoading } = useLoading();
  const { showAlert } = useAlert();
  const [avatar, setAvatar] = useState(null)
  const [country, setCountry] = useState(null)
  const [mode, setMode] = useState(null) // 'camera' | 'gallery'
  const avatarRef = useRef()
  const [step, setStep] = useState(0)
  const [image, setImage] = useState("");
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const cropperRef = useRef();
  
  const handleCrop = () => {
    if (
      cropperRef.current &&
      typeof cropperRef.current?.cropper?.getCroppedCanvas === "function"
    ) {
      const canvas = cropperRef.current.cropper.getCroppedCanvas();
      canvas.toBlob((blob) => {
        setCroppedImage(blob);
      });
    }
  };

  const handleDrop = (acceptedFiles) => {
    setImage(URL.createObjectURL(acceptedFiles[0]));
  };



  useEffect(() => {
    const fetchUserData = async () => {
      console.log(auth);
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
        }
      }
    };
    fetchUserData();
  }, [auth.currentUser]);

  useEffect(() => {
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

  const handleSaveImage = async () => {
    const uid = auth.currentUser?.uid;
  
    if (!uid) return;  // Make sure uid is available
    if (!image) return;  // Make sure uid is available
    setLoading(true, 'Saving your avatar, please wait...');
    uploadFile(
      croppedImage,
      `profile/${uid}/profile-image`,
      () => {},
      (error) => {
        setLoading(false);
        console.error("Upload error:", error)
      },
      async (url) => {
        setStorageUrl(url);
        console.log("Image Url:" + url);
        if (url) {
          await updateDoc(doc(db, "users", uid), { photo_uri: url });
          setStep(1);
        }
        setLoading(false);
      }
    );
  };


  const handleSaveCountry = async()=>{
    if(!country){
      showAlert('Please select your country!', 'error')
      return
    }
    const uid = auth.currentUser?.uid;
    console.log(uid, 'uid')
    if (!uid) return;  // Make sure uid is available
    setLoading(true, 'Saving your location, please wait...');
    await updateDoc(doc(db, "users", uid), { country: country });
    setLoading(false)
    showAlert('Your location has been saved!')
    router.push("/discovery");
    //go next page
  }

  const handleToList = () => {
    router.push("/discovery");
  }

  const base64ToBlob =(base64, type = 'image/jpeg') => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteArrays = [];
  
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
  
    return new Blob([new Uint8Array(byteArrays)], { type });
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <div className="p-6 h-full flex flex-col flex-1">
        <div className="flex justify-between items-center">
          <button onClick={() => window.history.back()}>
            <svg
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
        
        <h3 className="text-[#034792] font-[700] text-3xl w-full text-center pt-12 pb-5 ">
          {step===0?('Add a profile avatar'):('Where are you located?')}
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center ">
          {
            step===0?
            (
            <div className={`flex items-center justify-center relative ${!image?'rounded-full bg-[#4E802A]':''}`}
          >
              <EditProfileImage
                image={image}
                newProfileImage={newProfileImage}
                previewURL={previewURL}
                handleDrop={handleDrop}
                handleCrop={handleCrop}
                cropperRef={cropperRef}
              />
              <div className="w-10 h-10 rounded-full bg-blue-900 absolute bottom-1 right-2 text-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
              </div>

            </div>):
            (
              <div className="m-auto p-5 text-gray-900">
                <div className="py-3 text-sm">Country</div>
                <CountrySelect onChange={(value) => setCountry(value)} />
              </div>
            )
          }
        </div>

        <div className="flex flex-col items-center justify-center w-full py-6">
          {step===0?
          (<button
            className={`w-[60%] p-2  font-semibold rounded-2xl ${
              !!image ? 'bg-blue-900 text-white' : 'bg-gray-300 text-gray-500'}`}
              disabled={!image}
            onClick={handleSaveImage}
          >
            Continue
          </button>):
          (<button
            className={`w-[60%] p-2  font-semibold rounded-2xl ${
              !!country ? 'bg-blue-900 text-white' : 'bg-gray-300 text-gray-500'}`}
            onClick={handleSaveCountry}
            disabled={!country}
          >
            Continue
          </button>
          )}
          <span className="py-6 font-semibold text-gray-900 cursor-pointer" onClick={handleToList}>Skip for now</span>
        </div>

      </div>
    </div>
  );
}
