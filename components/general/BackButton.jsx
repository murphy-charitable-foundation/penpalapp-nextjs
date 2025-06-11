"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton({ title }) {
  const router = useRouter();

  const handleClick = () => {
    router.back();
  };

  return (
    <div className="w-full flex items-center justify-center space-x-4 mt-6">
      <button
        onClick={handleClick}
        className="absolute left-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full p-2"
      >
        <ChevronLeft className="h-10 w-10 text-black-900" />
      </button>
      {/* Optional Title */}
      {title && <span className="font-semibold">{title}</span>}
    </div>
  );
}
