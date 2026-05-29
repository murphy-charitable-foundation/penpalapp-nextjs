"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton({
  onBack,
  fallbackHref = "/",
  size = "sm",
  className = "",
}) {
  const router = useRouter();

  const handleClick = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (window.history.length > 1) {  
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-full p-2
        hover:bg-black/5 transition ${className}`}
      aria-label="Go back"
    >
      <ChevronLeft
        className={
          size === "xs"
            ? "h-4 w-4"
            : size === "sm"
            ? "h-5 w-5"
            : "h-6 w-6"
        }
      />
    </button>
  );
}
