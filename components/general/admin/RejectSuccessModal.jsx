"use client";

import Image from "next/image";
import Button from "../../general/Button";

export default function RejectSuccessModal({
  onClose,
  onRevert,
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-gray-100">
      <div className="w-full max-w-lg h-full bg-white shadow-xl overflow-hidden">
        <div className="w-full h-full flex items-center justify-center px-6">
          <div className="w-full text-center">

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
            <p className="text-sm text-gray-600 mb-10">
              We sent the feedback to the user.
              <br />
              Thanks for your feedback.
            </p>

            {/* CTAs — same pattern as ApproveSuccess */}
            <div className="flex flex-col items-center gap-4">
              <Button
                btnText="Go to letters"
                onClick={onClose}
                color="green"
                size="small"
              />

              <Button
                btnText="Revert to pending review"
                onClick={onRevert}
                color="transparent"
                size="small"
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
