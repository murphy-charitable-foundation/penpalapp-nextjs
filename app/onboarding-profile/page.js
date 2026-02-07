"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import Image from "next/image";
import LoadingSpinner from "@/components/loading/LoadingSpinner";
import CountrySelect from "@/components/boarding-profile/CountrySelect";
import { BackButton } from "@/components/general/BackButton";
import { saveAvatar, confirmDeleteAvatar } from "@/app/utils/avatarUtils";
import AvatarCropper from "@/components/general/AvatarCropper";
import AvatarMenu from "@/components/avatar/AvatarMenu";
import Modal from "@/components/general/Dialog";
import Button from "@/components/general/Button";

export default function OnboardingProfile() {
  const [storageUrl, setStorageUrl] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const [showMenu, setShowMenu] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [country, setCountry] = useState(null);
  const [mode, setMode] = useState(null);
  const avatarRef = useRef();
  const [step, setStep] = useState(0);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInfo, setConfirmInfo] = useState("");

  const [loading, setLoading] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!isMountedRef.current) return;

      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        router.push("/login");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const fetchUserData = async () => {
      if (!auth.currentUser) return;

      try {
        const uid = auth.currentUser.uid;
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (cancelled) return;

        if (docSnap.exists()) {
          const userData = docSnap.data();

          if (userData.avatar) {
            setAvatar(userData.avatar);
          }
          if (userData.country) {
            setCountry(userData.country);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    if (user) {
      fetchUserData();
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleGetAvatar = useCallback((type) => {
    setMode(type);
    setTimeout(() => {
      avatarRef.current?.pickPicture();
    }, 50);
  }, []);

  const handleSaveAvatar = useCallback(async () => {
    if (!isMountedRef.current) return;

    await saveAvatar({
      avatar,
      setLoading,
      setStorageUrl,
      onSuccess: (url) => {
        if (isMountedRef.current) {
          setStep(1);
        }
      },
      onError: (error) => {
        console.error("Avatar save error:", error);
        if (isMountedRef.current) {
          setAlertInfo("Failed to save avatar. Please try again.");
          setAlertOpen(true);
        }
      },
    });
  }, [avatar]);

  const onImageDelete = useCallback(() => {
    confirmDeleteAvatar({
      setConfirmOpen,
      setConfirmInfo,
    });
  }, []);

  const handleSaveCountry = useCallback(async () => {
    if (!country) {
      setAlertInfo("Please select your country!");
      setAlertOpen(true);
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "users", uid), { country: country });

      if (isMountedRef.current) {
        setAlertInfo("Your location has been saved!");
        setAlertOpen(true);
        router.push("/discovery");
      }
    } catch (e) {
      if (isMountedRef.current) {
        setAlertInfo(
          `Failed to save location: ${e?.message || "Unknown error"}`,
        );
        setAlertOpen(true);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [country, router]);

  const handleToList = useCallback(() => {
    router.push("/discovery");
  }, [router]);

  const handleConfirm = useCallback(() => {
    setConfirmOpen(false);
    setAvatar(null);
    setShowMenu(false);
  }, []);

  const handleCancel = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Modal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        title="Alert"
        content={
          <div>
            <p>{alertInfo}</p>
          </div>
        }
      />

      <Modal
        isOpen={confirmOpen}
        onClose={handleCancel}
        title="Confirm"
        width="default"
        closeOnOverlay={false}
        content={
          <div>
            <p className="mb-4">{confirmInfo}</p>
            <div className="flex justify-center gap-4">
              <Button btnText="Cancel" color="gray" onClick={handleCancel} />
              <Button btnText="Confirm" color="red" onClick={handleConfirm} />
            </div>
          </div>
        }
      />

      <div className="p-6 h-full flex flex-col flex-1">
        <div className="flex justify-between items-center">
          <BackButton />
        </div>

        <h3 className="text-[#034792] font-[700] text-3xl w-full text-center pt-12 pb-5">
          {step === 0 ? "Add a profile avatar" : "Where are you located?"}
        </h3>

        <div className="flex-1 flex flex-col items-center justify-center">
          {step === 0 ? (
            <div
              className="w-48 h-48 rounded-full bg-[#4E802A] flex items-center justify-center relative overflow-hidden cursor-pointer"
              onClick={() => setShowMenu(true)}
            >
              {!avatar ? (
                <Image
                  src="/blackcameraicon.svg"
                  alt="camera"
                  width={35}
                  height={35}
                />
              ) : (
                <>
                  <Image
                    src={avatar}
                    alt="avatar"
                    fill
                    className="object-cover"
                  />
                  <div className="w-10 h-10 rounded-full bg-blue-900 absolute bottom-1 right-2 text-white flex items-center justify-center z-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                      />
                    </svg>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="m-auto p-5 text-gray-900 w-full">
              <div className="py-3 text-sm">Country</div>
              <CountrySelect onChange={(value) => setCountry(value)} />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center w-full py-6">
          {step === 0 ? (
            <button
              className={`w-[60%] p-2 font-semibold rounded-2xl transition-colors ${
                !!avatar
                  ? "bg-blue-900 text-white hover:bg-blue-800"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!avatar}
              onClick={handleSaveAvatar}
            >
              Continue
            </button>
          ) : (
            <button
              className={`w-[60%] p-2 font-semibold rounded-2xl transition-colors ${
                !!country
                  ? "bg-blue-900 text-white hover:bg-blue-800"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              onClick={handleSaveCountry}
              disabled={!country}
            >
              Continue
            </button>
          )}
          <span
            className="py-6 font-semibold text-gray-900 cursor-pointer hover:text-blue-900 transition-colors"
            onClick={handleToList}
          >
            Skip for now
          </span>
        </div>

        <AvatarMenu
          show={showMenu}
          onClose={() => setShowMenu(false)}
          onCamera={() => handleGetAvatar("camera")}
          onGallery={() => handleGetAvatar("gallery")}
          onDelete={onImageDelete}
          avatar={avatar}
        />

        {mode && (
          <AvatarCropper
            type={mode}
            ref={avatarRef}
            onComplete={(croppedImage) => {
              setAvatar(croppedImage);
              setMode(null);
              setShowMenu(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
