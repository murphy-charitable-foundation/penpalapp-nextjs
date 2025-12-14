"use client";

export default function RejectSuccessModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-white z-[400] flex flex-col">

      {/* Close button */}
      <div className="flex justify-end p-4">
        <button onClick={onClose} className="text-2xl font-light">✕</button>
      </div>

      {/* Centered Content */}
      <div className="flex flex-col items-center justify-center flex-1 px-8 text-center">

        {/* Emoji Icon */}
        <div className="text-[70px] mb-6">📩</div>

        <h2 className="text-2xl font-semibold text-green-700 mb-3">
          Rejection Feedback
        </h2>

        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          We sent the feedback to the user.  
          <br />
          Thanks for your feedback.
        </p>

        {/* Button */}
        <button
          className="w-full max-w-xs py-3 bg-green-700 text-white rounded-full text-md font-medium"
          onClick={onClose}
        >
          Go to letters
        </button>
      </div>

    </div>
  );
}
