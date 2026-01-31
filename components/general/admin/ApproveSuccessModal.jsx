"use client";

import Image from "next/image";
import Button from "../../general/Button";

export default function ApproveSuccessView({
  onClose,
  onRevert,
}) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center bg-gray-100">
      <div className="w-full max-w-lg h-full bg-white shadow-xl overflow-hidden">
        <div className="w-full h-full flex items-center justify-center px-6">
          <div className="w-full text-center">

            <div className="flex justify-center mb-6">
              <Image
                src="/rejection-success.png"
                alt="Letter approved"
                width={104}
                height={104}
              />
            </div>

            <h2 className="text-2xl font-semibold text-dark-green mb-3">
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
                color="gray"
                size="small"
                onClick={onRevert}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
