"use client";

import Image from "next/image";
import Button from "../../general/Button";

export default function ApproveSuccessView({
  onClose,
  onRevert,
}) {
  return (
    <div className="w-full flex justify-center py-16">
      <div className="w-full max-w-lg mx-auto text-center">

        <div className="flex justify-center mb-6">
          <Image
            src="/sent-letter.png"
            alt="Letter approved"
            width={104}
            height={104}
          />
        </div>

        <h2 className="text-2xl font-semibold text-secondary mb-3">
          Letter Approved
        </h2>

        <p className="text-gray-600 mb-10">
          The letter has been approved and sent.
        </p>

        <div className="flex flex-col items-center gap-4">
          <Button
            btnText="Back to letters"
            color="green"
            onClick={onClose}
          />

          <Button
            btnText="Revert to pending review"
            color="transparent"
            size="small"
            onClick={onRevert}
          />
        </div>

      </div>
    </div>
  );
}
