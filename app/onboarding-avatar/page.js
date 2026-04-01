"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { ChevronLeft, Camera, ImageIcon, Smile, Trash2, X } from "lucide-react";
import { logButtonEvent } from "../utils/analytics";
import { saveAvatar } from "@/app/lib/avatarUtils";

// Cropper circular styles are defined in globals.css — no inline injection needed

export default function OnboardingAvatar() {
  const router = useRouter();
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);

  const [user, setUser] = useState(null);
  const [imageSrc, setImageSrc] = useState(null); // raw image fed into Cropper
  const [croppedUrl, setCroppedUrl] = useState(null); // final cropped data URL
  const [showSheet, setShowSheet] = useState(false); // controls DOM mount
  const [sheetVisible, setSheetVisible] = useState(false); // controls CSS transition
  const [isCropping, setIsCropping] = useState(false); // cropper full-screen state
  const [showConfirm, setShowConfirm] = useState(false); // delete confirm dialog
  const [loading, setLoading] = useState(false); // upload in progress
  const [errorMsg, setErrorMsg] = useState(null); // upload error message

  // ── Guard against state updates after unmount ────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ── Redirect to login if unauthenticated ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!isMountedRef.current) return;
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ── Bottom sheet open/close with slide animation ──────────────────────────────
  const openSheet = useCallback(() => {
    setShowSheet(true);
    // 10ms delay ensures the DOM has rendered before the CSS transition fires
    setTimeout(() => {
      if (isMountedRef.current) setSheetVisible(true);
    }, 10);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    // Wait for slide-out transition before unmounting the DOM node
    setTimeout(() => {
      if (isMountedRef.current) setShowSheet(false);
    }, 300);
  }, []);

  // ── Handle file selected from input ──────────────────────────────────────────
  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        if (!isMountedRef.current) return;
        setImageSrc(reader.result);
        setIsCropping(true);
        closeSheet();
      };
      reader.readAsDataURL(file);

      // Reset so the same file can be picked again
      e.target.value = "";
    },
    [closeSheet],
  );

  // ── Trigger camera or gallery via hidden file input ───────────────────────────
  const handlePickImage = useCallback((useCamera) => {
    if (!fileInputRef.current) return;
    if (useCamera) {
      fileInputRef.current.setAttribute("capture", "environment");
    } else {
      fileInputRef.current.removeAttribute("capture");
    }
    fileInputRef.current.click();
  }, []);

  // ── Confirm crop and generate preview data URL ────────────────────────────────
  const handleCropConfirm = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
    setCroppedUrl(canvas.toDataURL("image/jpeg", 0.9));
    setIsCropping(false);
  }, []);

  // ── Delete photo — close sheet first, then show confirm dialog ────────────────
  const handleDeleteRequest = useCallback(() => {
    closeSheet();
    setTimeout(() => {
      if (isMountedRef.current) setShowConfirm(true);
    }, 350);
  }, [closeSheet]);

  const handleDeleteConfirm = useCallback(() => {
    setCroppedUrl(null);
    setImageSrc(null);
    setShowConfirm(false);
  }, []);

  // ── Continue — upload to Firebase Storage then navigate ──────────────────────
  const handleContinue = useCallback(async () => {
    logButtonEvent("Continue clicked", "/onboarding-location");
    setErrorMsg(null);

    await saveAvatar({
      avatar: croppedUrl,
      setLoading,
      setStorageUrl: () => {}, // URL is persisted to Firestore inside saveAvatar
      onSuccess: () => {
        if (isMountedRef.current) router.push("/onboarding-location");
      },
      onError: (error) => {
        if (isMountedRef.current) {
          setErrorMsg("Failed to save avatar. Please try again.");
          console.error("Avatar upload error:", error);
        }
      },
    });
  }, [croppedUrl, router]);

  const handleSkip = useCallback(() => {
    logButtonEvent("Skip for now clicked", "/onboarding-location");
    router.push("/onboarding-location");
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto relative">
      {/* ── Loading overlay ───────────────────────────────────────────────────── */}
      {loading && (
        <div className="absolute inset-0 bg-white/70 z-[80] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#034792] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Back button ───────────────────────────────────────────────────────── */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 p-1 text-gray-700 z-10 active:scale-95 transition-transform"
        aria-label="Go back"
      >
        <ChevronLeft size={24} />
      </button>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center flex-1 pt-16 px-6">
        <h1 className="text-2xl font-bold text-[#034792] text-center mb-12">
          Add a profile avatar
        </h1>

        {/* Avatar circle — tap to open bottom sheet */}
        <div className="relative">
          <button
            onClick={openSheet}
            className="w-48 h-48 rounded-full overflow-hidden bg-[#4E802A] flex items-center justify-center focus:outline-none active:opacity-80 transition-opacity"
            aria-label="Select profile picture"
          >
            {croppedUrl ? (
              <img
                src={croppedUrl}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#4E802A] flex items-center justify-center">
                <Camera size={40} className="text-white/50" />
              </div>
            )}
          </button>

          {/* Edit badge — only shown when a photo is selected */}
          {croppedUrl && (
            <button
              onClick={openSheet}
              className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#034792] flex items-center justify-center shadow-md"
              aria-label="Edit photo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="white"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom buttons ────────────────────────────────────────────────────── */}
      <div className="pb-10 px-6 flex flex-col items-center gap-4">
        {/* Error message */}
        {errorMsg && (
          <p className="text-red-500 text-sm text-center">{errorMsg}</p>
        )}

        <button
          onClick={handleContinue}
          disabled={!croppedUrl || loading}
          className={`w-full max-w-xs py-3 rounded-full font-semibold text-sm transition-colors ${
            croppedUrl && !loading
              ? "bg-[#4E802A] text-white hover:bg-[#3d6621]"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "Uploading..." : "Continue"}
        </button>

        <button
          onClick={handleSkip}
          className="text-sm font-semibold text-gray-800 hover:underline"
        >
          Skip for now
        </button>
      </div>

      {/* ── Bottom sheet ──────────────────────────────────────────────────────── */}
      {showSheet && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop — fades in/out */}
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              sheetVisible ? "opacity-40" : "opacity-0"
            }`}
            onClick={closeSheet}
          />

          {/* Sheet panel — slides up from bottom
              Key fix: use inset-x-0 + mx-auto instead of left-1/2 + -translate-x-1/2
              to avoid stacking context issues inside a constrained parent */}
          <div
            className={`absolute bottom-0 inset-x-0 mx-auto w-full max-w-lg bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
              sheetVisible ? "translate-y-0" : "translate-y-full"
            }`}
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Smile size={18} className="text-gray-500" />
                </div>
                <span className="font-semibold text-gray-900">
                  Select Profile Picture
                </span>
              </div>
              <button
                onClick={closeSheet}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Options */}
            <div className="flex flex-col">
              <SheetOption
                icon={<Camera size={20} />}
                label="Take Photo"
                onClick={() => handlePickImage(true)}
              />
              <SheetOption
                icon={<ImageIcon size={20} />}
                label="Choose Photo"
                onClick={() => handlePickImage(false)}
              />
              <SheetOption
                icon={<Smile size={20} />}
                label="Use Avatar"
                onClick={() => {
                  // TODO: navigate to avatar picker
                  closeSheet();
                }}
              />
              {/* Delete Photo — only shown when a photo exists */}
              {croppedUrl && (
                <SheetOption
                  icon={<Trash2 size={20} className="text-red-500" />}
                  label="Delete Photo"
                  onClick={handleDeleteRequest}
                  danger
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm dialog ─────────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h2 className="font-semibold text-gray-900 text-lg mb-2">
              Delete Photo?
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to remove your profile photo?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-full border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 rounded-full bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cropper full-screen modal ─────────────────────────────────────────── */}
      {isCropping && imageSrc && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setIsCropping(false)}
              className="text-white text-sm"
            >
              Cancel
            </button>
            <span className="text-white font-semibold">Move and Scale</span>
            <button
              onClick={handleCropConfirm}
              className="font-bold text-sm text-[#4E802A]"
            >
              Choose
            </button>
          </div>

          <div className="flex-1">
            <Cropper
              ref={cropperRef}
              src={imageSrc}
              style={{ height: "100%", width: "100%" }}
              aspectRatio={1}
              viewMode={1}
              guides={false}
              background={false}
              responsive
              autoCropArea={1}
              checkOrientation={false}
            />
          </div>
        </div>
      )}

      {/* Hidden file input — shared by Take Photo and Choose Photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ── Sheet option row component ────────────────────────────────────────────────
function SheetOption({ icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-200 last:border-0"
    >
      <span
        className={`font-medium ${danger ? "text-red-500" : "text-gray-700"}`}
      >
        {label}
      </span>
      <div className="text-gray-400">{icon}</div>
    </button>
  );
}
