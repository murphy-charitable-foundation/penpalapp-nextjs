"use client";

import { useState, useRef, useEffect } from "react";

const sizes = {
  default: 'w-48 h-48',
  small: 'w-24 h-24',
  large: 'w-72 h-72',
  xs: 'w-12 h-12',
};

export default function Popover({
  triggerContent,
  popoverContent,
  position,
  size,
  hoverEffect,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {triggerContent}
      </div>
      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute z-50 ${sizes[size]} bg-white rounded-xl shadow-xl border border border-gray-200 p-4 text-gray-800 ${hoverEffect} ${getPositionClasses()} transition-all duration-200 text-center`}
        >
          {popoverContent}
        </div>
      )}
    </div>
  );
} 