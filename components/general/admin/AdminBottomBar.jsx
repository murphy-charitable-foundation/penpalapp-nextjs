"use client";

import { FaCheckCircle, FaEnvelope, FaCog } from "react-icons/fa";

export default function AdminBottomBar({ active = "moderation", pendingCount = 0 }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#EAF0F3] border-t shadow-md flex justify-around py-3 z-[500]">
      
      {/* Moderation */}
      <button className="relative flex flex-col items-center text-gray-700">
        <FaCheckCircle
          className={`h-5 w-5 ${active === "moderation" ? "text-blue-700" : "text-gray-500"}`}
        />
        {pendingCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5">
            {pendingCount}
          </span>
        )}
        <span className="text-xs mt-1">Moderation</span>
      </button>

      {/* Letters */}
      <button className="flex flex-col items-center text-gray-700">
        <FaEnvelope
          className={`h-5 w-5 ${active === "letters" ? "text-blue-700" : "text-gray-500"}`}
        />
        <span className="text-xs mt-1">Letters</span>
      </button>

      {/* Settings */}
      <button className="flex flex-col items-center text-gray-700">
        <FaCog
          className={`h-5 w-5 ${active === "settings" ? "text-blue-700" : "text-gray-500"}`}
        />
        <span className="text-xs mt-1">Settings</span>
      </button>
    </nav>
  );
}
