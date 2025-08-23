"use client";

import { useState, useRef, useEffect } from "react";

const sizes = {
  default: "w-48 h-48",
  small: "w-24 h-24",
  large: "w-72 h-72",
  xs: "w-12 h-12",
  dialog: "w-[345px] h-[245px]", // Added for dialog size
};

export default function Popover({
  // Existing props for dropdown-style popovers
  triggerContent,
  popoverContent,
  position,
  size = "default",
  hoverEffect,

  // New props for dialog/modal functionality
  isOpen,
  onClose,
  title,
  message,
  primaryButton,
  secondaryButton,
  type = "dropdown", // 'dropdown' or 'dialog'
  showBackdrop = false,
  backdropBlur = false,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  // Use internal state for dropdown, external state for dialog
  const dropdownOpen = type === "dropdown" ? isDropdownOpen : false;
  const dialogOpen = type === "dialog" ? isOpen : false;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        type === "dropdown" &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [type]);

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full mb-2";
      case "right":
        return "left-full ml-2";
      case "left":
        return "right-full mr-2";
      default:
        return "top-full mt-2";
    }
  };

  const handleDropdownToggle = () => {
    if (type === "dropdown") {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  // Render dropdown-style popover
  if (type === "dropdown") {
    return (
      <div className="relative inline-block">
        <div
          ref={triggerRef}
          onClick={handleDropdownToggle}
          className="cursor-pointer">
          {triggerContent}
        </div>
        {dropdownOpen && (
          <div
            ref={popoverRef}
            className={`absolute z-50 ${
              sizes[size]
            } bg-white rounded-xl shadow-xl border border-gray-200 p-4 text-gray-800 ${hoverEffect} ${getPositionClasses()} transition-all duration-200 text-center`}>
            {popoverContent}
          </div>
        )}
      </div>
    );
  }

  // Render dialog/modal-style popover
  if (type === "dialog" && dialogOpen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          showBackdrop
            ? `bg-black bg-opacity-30 ${backdropBlur ? "backdrop-blur-sm" : ""}`
            : ""
        }`}>
        <div
          className={`bg-gray-100 p-6 rounded-2xl shadow-lg ${sizes[size]} mx-auto`}>
          {title && (
            <h2 className="text-xl font-semibold mb-1 text-black leading-tight">
              {title}
            </h2>
          )}
          {message && <p className="text-gray-600 mb-6 text-sm">{message}</p>}

          {/* Custom content */}
          {popoverContent && <div className="mb-6">{popoverContent}</div>}

          {/* Buttons */}
          {(primaryButton || secondaryButton) && (
            <div className="flex space-x-3">
              {primaryButton && (
                <button
                  onClick={primaryButton.onClick}
                  className={`flex-1 ${
                    primaryButton.className ||
                    "bg-[#4E802A] text-white py-3 px-4 rounded-2xl hover:bg-opacity-90 transition-colors"
                  }`}>
                  {primaryButton.text}
                </button>
              )}
              {secondaryButton && (
                <button
                  onClick={secondaryButton.onClick}
                  className={`flex-1 ${
                    secondaryButton.className ||
                    "bg-gray-200 text-[#4E802A] py-3 px-4 rounded-2xl hover:bg-gray-300 transition-colors"
                  }`}>
                  {secondaryButton.text}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
