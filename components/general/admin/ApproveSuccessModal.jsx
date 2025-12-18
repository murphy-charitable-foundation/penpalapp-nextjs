"use client";
import Image from "next/image";

export default function ApproveSuccessModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg mx-auto bg-white rounded-lg shadow-xl p-8 text-center">

        <div className="flex justify-center mb-4">
          <Image
            src="/lettericon.png"
            alt="Letter approved"
            width={104}
            height={104}
          />
        </div>

        <h2 className="text-2xl font-semibold text-secondary mb-3">
          Letter Approved
        </h2>

        <p className="text-gray-600 mb-8">
          The letter has been approved and sent.
        </p>

        <button
          onClick={onClose}
          className="bg-primary text-white px-6 py-3 rounded-full w-full max-w-xs mx-auto text-lg"
        >
          Back to moderation
        </button>
      </div>
    </div>
  );
}