"use client";

export default function ApproveSuccessModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[400] bg-white flex flex-col items-center justify-center p-6">

      {/* Close button (X top-right) */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-2xl text-gray-400"
      >
        ✕
      </button>

      {/* Emoji Icon */}
      <div className="text-7xl mb-6">✅</div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-green-700 mb-3">
        Letter Approved
      </h2>

      {/* Message */}
      <p className="text-gray-600 text-center max-w-xs mb-8">
        The letter has been approved and sent to the user.
      </p>

      {/* Button */}
      <button
        onClick={onClose}
        className="bg-green-600 text-white px-6 py-3 rounded-full w-full max-w-xs text-lg"
      >
        Go to letters
      </button>

    </div>
  );
}
