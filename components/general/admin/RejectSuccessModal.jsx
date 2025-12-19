"use client";

import Image from "next/image";
import Button from "../../general/Button";

export default function RejectSuccessModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-xl px-6 py-8 text-center">

        {/* ICON */}
        <div className="flex justify-center mb-4">
          <Image
            src="/rejection-success.png"
            alt="Rejection sent"
            width={104}
            height={104}
          />
        </div>

        {/* TITLE */}
        <h2 className="text-lg font-semibold text-primary mb-2">
          Rejection Feedback
        </h2>

        {/* BODY TEXT */}
        <p className="text-sm text-gray-600 mb-6">
          We sent the feedback to the user.
          <br />
          Thanks for your feedback.
        </p>

        {/* CTA */}
        <div className="flex justify-center">
          <Button
            btnText="Go to letters"
            onClick={onClose}
            color="green"
            size="small"
          />
        </div>

      </div>
    </div>
  );
}
