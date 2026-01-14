"use client";
import Image from "next/image";
import Button from "../../general/Button";
import { AlertTriangle, ChevronLeft } from "lucide-react";

export default function AdminLetterReview({
  letter,
  onApprove,
  onReject,
  onClose,
  onRevert,
  setShowReject,
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

        <div className="flex items-center justify-between px-4 py-3 bg-primary text-white shadow">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-6 w-6 stroke-[2]" />
          </button>
          <h2 className="text-lg font-semibold">{letter.name || "Letter"}</h2>
          <div className="w-6" />
        </div>

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
                <div className="font-semibold text-gray-900">{letter.name}</div>
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

        {letter.status === "pending_review" && (
          <div className="px-6 py-4 border-t bg-white flex justify-center gap-4">
            <Button
              btnText="Approve"
              onClick={onApprove}
              color="green"
            />
            <Button
              btnText="Reject"
              onClick={onReject}
              color="red"
            />
          </div>
        )}

        {letter.status === "rejected" && (
          <div className="relative mx-6 mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
            <AlertTriangle className="absolute top-4 right-4 h-5 w-5 text-red-400" />

            <h3 className="font-semibold text-red-600 mb-1">
              Your letter was disapproved
            </h3>

            {letter.rejection_reason && (
              <p className="text-sm text-gray-800 mb-1">
                <span className="font-medium">Reason:</span>{" "}
                {letter.rejection_reason}
              </p>
            )}

            {letter.rejection_feedback && (
              <p className="text-sm text-gray-800 mb-4">
                {letter.rejection_feedback}
              </p>
            )}

            <div className="flex justify-center gap-4">
              <Button
                btnText="Clear review status"
                onClick={onRevert}
                color="blue"
              />
              <button
                onClick={() => {
                  onClose();
                  setShowReject(true);
                }}
                className="px-12 py-3 rounded-full border-2 border-green-700 text-green-700 font-bold hover:bg-green-50 transition"
              >
                Edit
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
