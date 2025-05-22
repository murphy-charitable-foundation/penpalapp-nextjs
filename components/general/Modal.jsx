"use client";

import { useEffect, useRef } from "react";
import  Button  from "./Button";

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
          <h2 className={`text-xl text-center font-semibold mt-6 mb-4 text-[#4E802A]`}>{title}</h2>
        )}
        <div className="mt-4 text-center">{content}</div>
      </div>
    </div>
  );
} 