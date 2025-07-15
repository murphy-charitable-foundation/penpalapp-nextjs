"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";


export function BackButton() {
  const router = useRouter();

  const handleClick = () => {
    router.back();
  };

  return (
    <button
      onClick={handleClick}
      className="fixed top-6 left-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors z-50 rounded-full p-2"
    >
      <ChevronLeft className="h-8 w-8 text-black stroke-[2]" />
    </button>
  );
}