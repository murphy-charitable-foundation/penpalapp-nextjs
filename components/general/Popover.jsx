"use client";

import { useState, useRef, useEffect } from "react";

export default function Popover({
  triggerContent,
  popoverContent,
  position,
  bgColor,
  textColor,
  borderColor,
  shadow,
  width,
  padding,
  rounded,
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
          className={`absolute z-50 ${width} ${bgColor} ${rounded} ${shadow} border ${borderColor} ${padding} ${textColor} ${hoverEffect} ${getPositionClasses()} transition-all duration-200`}
        >
          {popoverContent}
        </div>
      )}
    </div>
  );
} 