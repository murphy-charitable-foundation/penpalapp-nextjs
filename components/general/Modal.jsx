"use client";

import { useEffect, useRef } from "react";
import Button from "./Button";

const sizes = {
  default: 'w-72 max-w-sm',
  small: 'w-48 max-w-sm',
  large: 'w-full max-w-sm',
  xs: 'w-12 max-w-sm',
};


export default function Dialog({
  isOpen,
  onClose,
  title,
  content,
  width = "default",
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
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity z-[1001]`}
        onClick={() => closeOnOverlay && onClose()}
      />
      <div
        ref={dialogRef}
        className={`relative ${sizes[width]} bg-white rounded-xl shadow-xl p-6 text-gray-800 border border-gray-200 transform transition-all z-[1002]`}
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
          <h2 className={`text-lg font-semibold mb-4 text-green-800`}>{title}</h2>
        )}
        <div>{content}</div>
      </div>
    </div>
  );
} 