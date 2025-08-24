"use client";

import { useEffect, useState, useRef } from "react";
import Button from "./Button";

const sizes = {
  default: "w-72 max-w-sm",
  small: "w-48 max-w-sm",
  large: "w-full max-w-sm",
  xs: "w-12 max-w-sm",
  closeDialog: "w-[345px] max-w-sm",
};

export default function Dialog({
  isOpen,
  onClose,
  title,
  content,
  width = "default",
  closeOnOverlay = true,
  showCloseButton = true,
  // New props for close confirmation dialog
  isCloseDialog = false,
  subtitle,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryAction,
  onSecondaryAction,
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

  // Close Dialog Layout
  if (isCloseDialog) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
        <div className="bg-gray-100 p-6 rounded-2xl shadow-lg w-[345px] h-[245px] mx-auto">
          <h2 className="text-xl font-semibold mb-1 text-black leading-tight">
            {title}
          </h2>
          {subtitle && <p className="text-gray-600 mb-6 text-sm">{subtitle}</p>}
          <div className="flex space-x-3">
            {/* Primary Button - Green */}
            <button
              onClick={onPrimaryAction}
              className="flex-1 py-3 px-4 rounded-2xl text-white hover:opacity-90 transition-colors"
              style={{ backgroundColor: "#4E802A" }}>
              {primaryButtonText}
            </button>
            {/* Secondary Button - Grey with green text */}
            <button
              onClick={onSecondaryAction}
              className="flex-1 py-3 px-4 rounded-2xl bg-gray-200 hover:bg-gray-300 transition-colors"
              style={{ color: "#4E802A" }}>
              {secondaryButtonText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default Modal Layout
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center backdrop-blur-sm">
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity z-[1001]`}
        onClick={() => closeOnOverlay && onClose()}
      />

      <div
        ref={dialogRef}
        className={`relative ${sizes[width]} bg-white rounded-xl shadow-xl p-6 text-gray-800 border border-gray-200 transform transition-all z-[1002]`}>
        {showCloseButton && (
          <div className="absolute top-1 right-1 text-xl">
            <Button
              onClick={onClose}
              btnText="✕"
              color="transparent"
              textColor="black"
              size="xxs"
            />
          </div>
        )}
        {title && (
          <h2
            className={`text-xl text-center font-semibold mt-6 mb-4 text-dark-green`}>
            {title}
          </h2>
        )}
        <div className="mt-4 text-center">{content}</div>
      </div>
    </div>
  );
}
