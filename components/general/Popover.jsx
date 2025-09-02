"use client";

import { useState, useRef, useEffect } from "react";

const sizes = {
  default: "w-48",
  small: "w-32",
  large: "w-72",
  xs: "w-24",
};

export default function Popover({
  triggerContent,
  popoverContent,
  position = "bottom",
  size = "default",
  hoverEffect,
  trigger = "click", // 'click' or 'hover'
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

    if (trigger === "click") {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [trigger]);

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

  const handleTrigger = () => {
    if (trigger === "click") {
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === "hover") {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === "hover") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={handleTrigger}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer">
        {triggerContent}
      </div>
      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute z-50 ${
            sizes[size]
          } bg-white rounded-xl shadow-xl border border-gray-200 p-4 text-gray-800 ${hoverEffect} ${getPositionClasses()} transition-all duration-200`}
          onMouseEnter={trigger === "hover" ? handleMouseEnter : undefined}
          onMouseLeave={trigger === "hover" ? handleMouseLeave : undefined}>
          {popoverContent}
        </div>
      )}
    </div>
  );
}
