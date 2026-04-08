import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Custom hook for managing avatar upload state and logic
 * Handles file selection, cropping, deletion, and upload state
 */
export const useAvatarUpload = () => {
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);

  const [imageSrc, setImageSrc] = useState(null); // raw image fed into Cropper
  const [croppedUrl, setCroppedUrl] = useState(null); // final cropped data URL
  const [croppedBlob, setCroppedBlob] = useState(null); // final cropped blob
  const [showSheet, setShowSheet] = useState(false); // controls DOM mount
  const [sheetVisible, setSheetVisible] = useState(false); // controls CSS transition
  const [isCropping, setIsCropping] = useState(false); // cropper full-screen state
  const [showConfirm, setShowConfirm] = useState(false); // delete confirm dialog
  const [loading, setLoading] = useState(false); // upload in progress
  const [errorMsg, setErrorMsg] = useState(null); // upload error message

  const [errorDialog, setErrorDialog] = useState({
    isOpen: false,
    message: "",
  });

  // Guard against state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Bottom sheet open/close with slide animation
  const openSheet = useCallback(() => {
    setShowSheet(true);
    setTimeout(() => {
      if (isMountedRef.current) setSheetVisible(true);
    }, 10);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    setTimeout(() => {
      if (isMountedRef.current) setShowSheet(false);
    }, 300);
  }, []);

  // Handle file selected from input
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

      e.target.value = "";
    },
    [closeSheet],
  );

  // Trigger camera or gallery via hidden file input
  const handlePickImage = useCallback((useCamera) => {
    if (!fileInputRef.current) return;
    if (useCamera) {
      fileInputRef.current.setAttribute("capture", "environment");
    } else {
      fileInputRef.current.removeAttribute("capture");
    }
    fileInputRef.current.click();
  }, []);

  // Confirm crop and generate preview data URL and blob
  const handleCropConfirm = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
    setCroppedUrl(canvas.toDataURL("image/jpeg", 0.9));
    
    // Also convert to blob for form submissions
    canvas.toBlob((blob) => {
      if (isMountedRef.current) {
        setCroppedBlob(blob);
      }
    }, "image/jpeg", 0.9);
    
    setIsCropping(false);
  }, []);

  // Delete photo — close sheet first, then show confirm dialog
  const handleDeleteRequest = useCallback(() => {
    closeSheet();
    setTimeout(() => {
      if (isMountedRef.current) setShowConfirm(true);
    }, 350);
  }, [closeSheet]);

  const handleDeleteConfirm = useCallback(() => {
    setCroppedUrl(null);
    setCroppedBlob(null);
    setImageSrc(null);
    setShowConfirm(false);
  }, []);

  return {
    cropperRef,
    fileInputRef,
    isMountedRef,
    // State
    imageSrc,
    croppedUrl,
    croppedBlob,
    showSheet,
    sheetVisible,
    isCropping,
    showConfirm,
    loading,
    errorMsg,
    errorDialog,
    setImageSrc,
    setCroppedUrl,
    setCroppedBlob,
    setShowSheet,
    setSheetVisible,
    setIsCropping,
    setShowConfirm,
    setLoading,
    setErrorMsg,
    setErrorDialog,
    // Handlers
    openSheet,
    closeSheet,
    handleFileChange,
    handlePickImage,
    handleCropConfirm,
    handleDeleteRequest,
    handleDeleteConfirm,
  };
};
