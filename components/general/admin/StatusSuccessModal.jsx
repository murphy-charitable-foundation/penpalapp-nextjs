"use client";

import Image from "next/image";
import Button from "../../general/Button";

export default function StatusSuccessModal({
  title,
  description,
  primaryButtonText,
  onClose = () => {},
  onRevert = () => {},
  type = "sent",
}) {
  const isRejected = type === "rejected";

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center bg-gray-100">
      <div className="w-full max-w-lg h-full bg-white shadow-xl overflow-hidden">
        <div className="w-full h-full flex items-center justify-center px-6">
          <div className="w-full text-center">
            {/* ICON */}
            <div className="flex justify-center mb-8">
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center ${
                  isRejected ? "bg-red-50" : "bg-green-50"
                }`}
              >
                <Image
                  src="/letter-sent-success.png"
                  alt="Success"
                  width={104}
                  height={104}
                />
              </div>
            </div>

            {/* TITLE */}
            <h2
              className={`text-3xl font-semibold mb-4 ${
                isRejected ? "text-red-500" : "text-dark-green"
              }`}
            >
              {title}
            </h2>

            {/* DESCRIPTION */}
            <p className="text-gray-600 mb-12 whitespace-pre-line leading-relaxed text-lg">
              {description}
            </p>

            {/* ACTIONS */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-[320px]">
                <Button
                  btnText={primaryButtonText}
                  color={isRejected ? "red" : "green"}
                  rounded="rounded-full"
                  onClick={onClose}
                />
              </div>

              <div className="w-[320px]">
                <Button
                  btnText="Revert to review"
                  color="gray"
                  rounded="rounded-full"
                  onClick={onRevert}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}