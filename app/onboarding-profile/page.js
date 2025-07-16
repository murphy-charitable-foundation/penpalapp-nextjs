"use client";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { uploadFile } from "../lib/uploadFile";

import Image from 'next/image';
import { useConfirm } from '@/components/ConfirmProvider';
import LoadingSpinner from '@/components/loading/LoadingSpinner';
import CountrySelect from '@/components/general/CountrySelect';
import EditProfileImage from "@/components/edit-profile-image";
import { AnimatePresence, motion } from 'framer-motion';
import compressImage from "@/components/general/compress-image";

import { saveAvatar, base64ToBlob, confirmDeleteAvatar } from '@/app/utils/avatarUtils';
import AvatarCropper from '@/components/general/AvatarCropper';


export default function OnboardingProfile() {
  const [storageUrl, setStorageUrl] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  ///////////////////////
  const [showMenu, setShowMenu] = useState(false);
  const { confirm } = useConfirm();

  const [avatar, setAvatar] = useState(null)
  const [country, setCountry] = useState(null)
  const [mode, setMode] = useState(null) // 'camera' | 'gallery'
  const avatarRef = useRef()
  const [step, setStep] = useState(0)
  const [image, setImage] = useState("");
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);

  const [loading, setLoading] = useState(false)
  const cropperRef = useRef();

  const handleCrop = () => {
    if (
      cropperRef.current &&
      typeof cropperRef.current?.cropper?.getCroppedCanvas === "function"
    ) {
      const canvas = cropperRef.current.cropper.getCroppedCanvas();

      canvas.toBlob(async (originalBlob) => {
        console.log('Original size:', originalBlob.size, 'bytes');
        const compressedBlob = await compressImage(originalBlob, {
          quality: 0.8,
        });

        console.log('Compressed size:', compressedBlob.size, 'bytes');

        setCroppedImage(compressedBlob);
      }, 'image/jpeg', 0.95);

    }

    // if (
    //   cropperRef.current &&
    //   typeof cropperRef.current?.cropper?.getCroppedCanvas === "function"
    // ) {
    //   const canvas = cropperRef.current.cropper.getCroppedCanvas();
    //   canvas.toBlob((blob) => {
    //     setCroppedImage(blob);
    //   });
    // }
  }



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

  // const handleSaveImage = async () => {
  //   const uid = auth.currentUser?.uid;

  //   if (!uid) return;  // Make sure uid is available
  //   if (!image) return;  // Make sure uid is available
  //   setLoading(true);
  //   uploadFile(
  //     croppedImage,
  //     `profile/${uid}/profile-image`,
  //     () => {},
  //     (error) => {
  //       setLoading(false);
  //       console.error("Upload error:", error)
  //     },
  //     async (url) => {
  //       setStorageUrl(url);
  //       console.log("Image Url:" + url);
  //       if (url) {
  //         await updateDoc(doc(db, "users", uid), { photo_uri: url });
  //         setStep(1);
  //       }
  //       setLoading(false);
  //     }
  //   );
  // };

  // const handleSaveAvatar = async () => {

  //   if(!avatar){
  //     alert('Please select an avatar!')
  //     return
  //   }

  //   const uid = auth.currentUser?.uid;
  //   if (!uid) {return;}  // Make sure uid is available

  //   //setLoading(true, 'Saving your avatar, please wait...');
  //   setLoading(true);
  //   uploadFile(
  //     base64ToBlob(avatar),
  //     `profile/${uid}/profile-image`,
  //     () => {},
  //     (error) => {
  //       console.error("Upload error:", error)
  //       setLoading(false)
  //       alert("Upload error:" + error)
  //     },
  //     async (url) => {
  //       setStorageUrl(url);
  //       if (url) {
  //         await updateDoc(doc(db, "users", uid), { photo_uri: url });
  //         //console.log(url, 'url')
  //         setLoading(false)
  //         setStep(1)
  //         //showAlert('Your avatar has been saved!')
  //       }
  //     }
  //   );
  // };


  // const onImageDelete = async () => {
  //   const ok = await confirm('Are you sure you want to delete the current profile picture?');
  //   if (ok) {
  //     setAvatar(null);
  //     setShowMenu(false)
  //   } else {
  //     console.log('no');
  //   }
  // }


  // const base64ToBlob =(base64, type = 'image/jpeg') => {
  //   const byteCharacters = atob(base64.split(',')[1]);
  //   const byteArrays = [];

  //   for (let i = 0; i < byteCharacters.length; i++) {
  //     byteArrays.push(byteCharacters.charCodeAt(i));
  //   }

  //   return new Blob([new Uint8Array(byteArrays)], { type });
  // }

  const handleGetAvatar = (type) => {
    setMode(type)
    setTimeout(() => {
      avatarRef.current?.pickPicture()

    }, 50)
  }
  const handleSaveAvatar = async () => {
    await saveAvatar({
      avatar,
      setLoading,
      setStorageUrl,
      onSuccess: (url) => {
        setStep(1);
        // showAlert("Your avatar has been saved!");
      },
      onError: (error) => {
        console.log("Custom error handler:", error);
      },
    });
  };

  const onImageDelete = () => {
    confirmDeleteAvatar({
      confirm,
      setAvatar,
      setShowMenu,
    });
  };



  const handleSaveCountry = async () => {
    if (!country) {
      alert('Please select your country!')
      return
    }
    const uid = auth.currentUser?.uid;
    console.log(uid, 'uid')
    if (!uid) return;  // Make sure uid is available
    setLoading(true);
    await updateDoc(doc(db, "users", uid), { country: country });
    setLoading(false)
    alert('Your location has been saved!')
    router.push("/discovery");
    //go next page
  }

  const handleToList = () => {
    router.push("/discovery");
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {loading && <LoadingSpinner />}
      {!loading && <div className="p-6 h-full flex flex-col flex-1">
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
          {step === 0 ? ('Add a profile avatar') : ('Where are you located?')}
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center ">
          {
            step === 0 ?
              (<div className="w-48 h-48 rounded-full bg-[#4E802A] flex items-center justify-center relative"
                onClick={() => setShowMenu(true)}
              >
                {!avatar ? (<Image
                  src="/blackcameraicon.svg"
                  alt="camera"
                  width={35}
                  height={35}
                />) :
                  (<>
                    <Image
                      src={avatar}
                      alt="avatar"
                      width={300}
                      height={300}
                      className="object-cover rounded-full"
                    /><div className="w-10 h-10 rounded-full bg-blue-900 absolute bottom-1 right-2 text-white flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                      </svg>
                    </div></>
                  )}
              </div>) :
              (
                <div className="m-auto p-5 text-gray-900">
                  <div className="py-3 text-sm">Country</div>
                  <CountrySelect onChange={(value) => setCountry(value)} />
                </div>
              )
          }
        </div>

        <div className="flex flex-col items-center justify-center w-full py-6">
          {step === 0 ?
            (<button
              className={`w-[60%] p-2  font-semibold rounded-2xl ${!!avatar ? 'bg-blue-900 text-white' : 'bg-gray-300 text-gray-500'}`}
              disabled={!avatar}
              onClick={handleSaveAvatar}
            >
              Continue
            </button>) :
            (<button
              className={`w-[60%] p-2  font-semibold rounded-2xl ${!!country ? 'bg-blue-900 text-white' : 'bg-gray-300 text-gray-500'}`}
              onClick={handleSaveCountry}
              disabled={!country}
            >
              Continue
            </button>
            )}
          <span className="py-6 font-semibold text-gray-900 cursor-pointer" onClick={handleToList}>Skip for now</span>
        </div>

        <AnimatePresence>
          {showMenu && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/40 z-40"
                onClick={() => setShowMenu(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              <motion.div
                className="fixed bottom-0 left-0 right-0 bg-gray-100 rounded-t-xl z-50 py-5 px-3 text-gray-900"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 pb-6 flex items-center justify-between gap-3 font-semibold ">
                  <span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </span>
                  <span className="flex-1">Select Profile Picture</span>
                  <span onClick={() => setShowMenu(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </span>
                </div>
                <div className="rounded-xl w-full p-3 bg-white text-lg">
                  <div className="border-b flex items-center justify-between py-3"
                    onClick={() => handleGetAvatar('camera')}
                  >
                    <span  >Take Photo</span>
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                    </span>
                  </div>
                  <div className="border-b flex items-center justify-between py-3"
                    onClick={() => handleGetAvatar('gallery')}
                  >
                    <span>Choose Photo</span>
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </span>
                  </div>
                  {!!avatar && (<div className=" flex items-center justify-between py-3 text-red-500"
                    onClick={onImageDelete}
                  >
                    <span>Delete Photo</span>
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </span>
                  </div>)}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {mode && (
          <AvatarCropper
            type={mode}
            ref={avatarRef}
            onComplete={(croppedImage) => {
              setAvatar(croppedImage)
              setMode(null)
              setShowMenu(false)
            }}
          />
        )}

      </div>}
    </div>
  );
}
