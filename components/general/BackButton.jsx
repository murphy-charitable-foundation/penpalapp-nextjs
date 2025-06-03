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
      className="fixed top-6 left-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors z-50 rounded-full p-2 bg-gray-100"
    >
      <ChevronLeft className="h-5 w-5 text-gray-700" />
    </button>
  );
}