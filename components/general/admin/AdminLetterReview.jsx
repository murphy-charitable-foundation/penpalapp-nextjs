"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "../../general/Button";
import {
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";

export default function AdminLetterReview({
  letter,
  onApprove,
  onReject,   // opens AdminRejectModal (parent)
  onRevert,   // clears review status
  onClose,
}) {
  const [isExiting, setIsExiting] = useState(false);

  if (!letter) return null;

  // Normalize status
  const status =
    letter.status === "sent" || letter.status === "approved"
      ? "approved"
      : letter.status === "rejected"
      ? "rejected"
      : "pending_review";

  const headerColor =
    status === "approved"
      ? "bg-green-600"
      : status === "rejected"
      ? "bg-red-600"
      : "bg-primary";

  const sentAt = letter.lastMessageDate
    ? new Date(letter.lastMessageDate.seconds * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const exitAndClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`
        fixed inset-0 z-[10000] mt-4 flex justify-center bg-gray-100
        transition-all duration-300
        ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
      `}
    >
      <div className="w-full max-w-lg mx-auto bg-white flex flex-col h-full rounded-lg shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className={`flex items-center px-4 py-3 text-white ${headerColor}`}>
          <button
            onClick={exitAndClose}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold mx-auto">
            {letter.name}
          </h2>
          <div className="w-9" />
        </div>

        {/* LETTER CONTENT — VISIBLE */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Image
                src={letter.profileImage || "/usericon.png"}
                alt="sender"
                width={36}
                height={36}
                className="rounded-full"
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

        {/* REJECTED STATUS BANNER */}
        {status === "rejected" && (
          <div className="relative mx-6 mb-4 rounded-lg bg-red-50 p-4">
            <AlertTriangle className="absolute top-3 right-3 h-5 w-5 text-red-500" />

            <div className="flex gap-3">
              <div>
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
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-4">
              <Button
                btnText="Clear the review status"
                color="blue"
                onClick={() => onRevert(letter)}
              />
              <Button
                btnText="Edit"
                color="green"
                className="bg-white text-gray-900 border border-gray-400"
                onClick={onReject}
              />
            </div>
          </div>
        )}

        {/* APPROVED — CLEAR ONLY */}
        {status === "approved" && (
          <div className="mx-6 mb-4 flex justify-center">
            <Button
              btnText="Clear the review status"
              color="blue"
              onClick={() => onRevert(letter)}
            />
          </div>
        )}

        {/* ACTIONS — ONLY FOR PENDING REVIEW */}
        {status === "pending_review" && (
          <div className="px-6 py-4 border-t flex justify-center gap-4">
            <Button
              btnText="Approve"
              color="green"
              onClick={onApprove}
            />
            <Button
              btnText="Reject"
              color="red"
              onClick={onReject}
            />
          </div>
        )}
      </div>
    </div>
  );
}
