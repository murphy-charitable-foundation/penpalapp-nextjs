"use client";

import { CheckCircle } from "lucide-react";

export default function ApproveSuccessModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[400] bg-white flex flex-col items-center justify-center p-6">

      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-2xl text-gray-400"
      >
        ✕
      </button>

      <CheckCircle className="w-16 h-16 text-primary mb-6" />

      <h2 className="text-2xl font-semibold text-secondary mb-3">
        Letter Approved
      </h2>

      <p className="text-gray-600 text-center max-w-xs mb-8">
        The letter has been approved and sent.
      </p>

      <button
        onClick={onClose}
        className="bg-primary text-white px-6 py-3 rounded-full w-full max-w-xs text-lg"
      >
        Back to moderation
      </button>
    </div>
  );
}
