"use client";

import { useEffect, useRef } from "react";
import Button from "./Button";

export default function Dialog({
  isOpen,
  onClose,
  title,
  content,
  bgColor = "bg-white",
  textColor = "text-gray-800",
  titleColor = "text-green-800",
  overlayColor = "bg-black bg-opacity-50",
  borderColor = "border border-gray-200",
  shadow = "shadow-xl",
  width = "max-w-sm w-full",
  padding = "p-6",
  rounded = "rounded-xl",
  closeOnOverlay = true,
  showCloseButton = true,
}) {
  // Add debugging
  console.log("Dialog render:", { isOpen, title });

  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div
        className={`fixed inset-0 ${overlayColor} transition-opacity z-[1001]`}
        onClick={() => closeOnOverlay && onClose()}
      />
      <div
        ref={dialogRef}
        className={`relative ${width} ${bgColor} ${rounded} ${shadow} ${padding} ${textColor} ${borderColor} transform transition-all z-[1002]`}
      >
        {showCloseButton && (
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
          >
            ✕
          </button>
        )}
        {title && (
          <h2 className={`text-lg font-semibold mb-4 ${titleColor}`}>{title}</h2>
        )}
        <div>{content}</div>
      </div>
    </div>
  );
} 