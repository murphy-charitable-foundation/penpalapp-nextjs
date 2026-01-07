"use client";
import Image from "next/image";
import Button from "../../general/Button";
import { ChevronLeft } from "lucide-react";

export default function AdminLetterReview({
  letter,
  onApprove,
  onReject,
  onClose,
}) {
  if (!letter) return null;

  const sentAt = letter.lastMessageDate
    ? new Date(letter.lastMessageDate.seconds * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="fixed inset-0 z-[10000] flex justify-center bg-black/30">
      <div className="w-full max-w-lg mx-auto bg-white flex flex-col rounded-lg shadow-xl">

        {/* TOP NAV */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary text-white shadow">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <h2 className="text-lg font-semibold">{letter.name || "Letter"}</h2>
          <div className="w-6" />
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Image
                src={letter.profileImage || "/usericon.png"}
                alt="sender"
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
              <div>
                <div className="font-semibold text-gray-900">
                  {letter.name}
                </div>
                <div className="text-sm text-gray-500">
                  To {letter.recipientName}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">{sentAt}</div>
          </div>

          <p className="text-gray-700 whitespace-pre-wrap">
            {letter.lastMessage}
          </p>
        </div>

        {/* ACTION BAR */}
        <div className="px-6 py-4 border-t bg-white">
          <div className="flex gap-4">
            <Button
              btnText="Approve"
              onClick={onApprove}
              color="green"
            />
            <Button
              btnText="Reject"
              onClick={onReject}
              color="white"
              className="hover:bg-gray"
            />
          </div>
        </div>


      </div>
    </div>
  );
}
