"use client";

import { useEffect, useRef } from "react";

export default function Dialog({
  isOpen,
  onClose,
  title,
  content,
  bgColor,
  textColor,
  titleColor,
  overlayColor,
  borderColor,
  shadow,
  width,
  padding,
  rounded,
  closeOnOverlay = true,
  showCloseButton = true,
}) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`fixed inset-0 ${overlayColor} transition-opacity`}
        onClick={() => closeOnOverlay && onClose()}
      />
      <div
        ref={dialogRef}
        className={`relative ${width} ${bgColor} ${rounded} ${shadow} ${padding} ${textColor} ${borderColor} transform transition-all`}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
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