"use client";

import { CheckCircleIcon } from "@heroicons/react/24/solid";

export default function ApproveSuccessModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[999] flex justify-center bg-black/30">
      <div className="w-full max-w-lg mx-auto bg-white rounded-lg shadow-xl flex flex-col p-6">

        {/* ICON */}
        <div className="flex justify-center mb-4">
          <CheckCircleIcon className="h-16 w-16 text-primary" />
        </div>

        {/* TITLE */}
        <h2 className="text-xl font-semibold text-center mb-2">
          Letter Approved
        </h2>

        {/* MESSAGE */}
        <p className="text-gray-600 text-center mb-6">
          The letter has been approved and sent to the user.
        </p>

        {/* ACTION */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-primary text-white rounded-md font-medium"
        >
          Back to moderation
        </button>

      </div>
    </div>
  );
}
