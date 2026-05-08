"use client";

import Image from "next/image";
import Button from "../../general/Button";
import { ChevronLeft, AlertTriangle } from "lucide-react";

export default function AdminLetterReview({
  letter,
  onApprove,
  onReject,
  onRevert,
  onClose,
}) {
  if (!letter) return null;

  const status =
    letter.status === "sent"
      ? "sent"
      : letter.status === "rejected"
      ? "rejected"
      : "pending_review";

  const headerColor =
    status === "sent"
      ? "bg-dark-green"
      : status === "rejected"
      ? "bg-red-600"
      : "bg-primary";

  const sentAt = letter.lastMessageDate
    ? typeof letter.lastMessageDate.toDate === "function"
      ? letter.lastMessageDate.toDate().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date(letter.lastMessageDate.seconds * 1000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
    : "";

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center bg-gray-100">
      <div className="w-full max-w-lg bg-white flex flex-col h-full shadow-xl overflow-hidden">
        <div className={`flex items-center px-4 h-14 text-white ${headerColor}`}>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <h2 className="flex-1 text-center text-lg font-semibold truncate">
            {letter.name}
          </h2>

          <div className="w-10 h-10" />
        </div>

        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-0 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <Image
                src={letter.profileImage || "/usericon.png"}
                alt="sender"
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {letter.name}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  To {letter.recipientName}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 whitespace-nowrap ml-3">
              {sentAt}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {letter.lastMessage}
            </p>
          </div>

          <div className="flex-grow" />

          <div className="mt-8">
            <div
              className={`relative rounded-lg bg-red-50 p-4 transition-opacity duration-150 ${
                status === "rejected"
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <AlertTriangle className="absolute top-3 right-3 h-5 w-5 text-red-500" />

              <h4 className="font-semibold text-red-700">
                Your letter was disapproved.
              </h4>

              {letter.rejection_reason && (
                <p className="text-sm text-red-700 mt-1">
                  {letter.rejection_reason}
                </p>
              )}

              {letter.rejection_feedback && (
                <p className="text-sm text-red-700 mt-1">
                  {letter.rejection_feedback}
                </p>
              )}

              <div className="flex justify-center gap-3 mt-4">
                <Button
                  btnText="Clear status"
                  color="blue"
                  onClick={() => onRevert(letter)}
                />
                <Button btnText="Edit" color="green" onClick={onReject} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border-t px-6 py-4">
          {status === "sent" && (
            <div className="flex justify-center">
              <Button
                btnText="Clear status"
                color="blue"
                onClick={() => onRevert(letter)}
              />
            </div>
          )}

          {status === "pending_review" && (
            <div className="flex justify-center gap-4">
              <Button btnText="Approve" color="green" onClick={onApprove} />
              <Button btnText="Reject" color="red" onClick={onReject} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}