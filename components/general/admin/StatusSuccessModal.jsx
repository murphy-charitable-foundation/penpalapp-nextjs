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
    <div className="h-full bg-white">
      <div className="flex h-full items-center justify-center px-6">
        <div className="w-full text-center">
          <div className="flex justify-center mb-8">
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center ${
                isRejected ? "bg-red-50" : "bg-green-50"
              }`}
            >
              <Image
                src="/letter-sent-success.png"
                alt="Success"
                width={92}
                height={92}
              />
            </div>
          </div>

          <h2
            className={`text-3xl font-semibold mb-4 ${
              isRejected ? "text-red-500" : "text-dark-green"
            }`}
          >
            {title}
          </h2>

          <p className="text-gray-600 mb-10 whitespace-pre-line leading-relaxed text-lg">
            {description}
          </p>

          <div className="flex flex-col items-center gap-4">
            <Button
              btnText={primaryButtonText}
              color={isRejected ? "red" : "green"}
              rounded="rounded-full"
              size="small"
              onClick={onClose}
            />

            <Button
              btnText="Revert review"
              color="grayBlue"
              rounded="rounded-full"
              size="small"
              onClick={onRevert}
            />
          </div>
        </div>
      </div>
    </div>
  );
}