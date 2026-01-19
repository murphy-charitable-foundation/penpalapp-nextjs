"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "../../general/Button";
import { ChevronLeft, CheckCircle, MailX } from "lucide-react";

export default function AdminLetterReview({
  letter,
  onApprove,
  onReject,        // opens reject flow (parent)
  onRejectSuccess, // parent calls this AFTER rejection is saved
  onClose,
}) {
  const [view, setView] = useState("review");
  // "review" | "approved" | "rejected"
  const [isExiting, setIsExiting] = useState(false);

  if (!letter) return null;

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
        fixed inset-0 z-[10000] flex justify-center bg-black/30
        transition-all duration-300
        ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
      `}
    >
      <div className="w-full max-w-lg mx-auto bg-white flex flex-col rounded-lg shadow-xl">

        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary text-white">
          <button
            onClick={exitAndClose}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold">
            {view === "review" ? letter.name : "Status"}
          </h2>
          <div className="w-6" />
        </div>

        {/* REVIEW VIEW */}
        {view === "review" && (
          <>
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

            <div className="px-6 py-4 border-t flex justify-center gap-4">
              <Button
                btnText="Approve"
                color="green"
                onClick={async () => {
                  await onApprove();
                  setView("approved");
                }}
              />
              <Button
                btnText="Reject"
                color="red"
                onClick={onReject} // parent opens AdminRejectModal
              />
            </div>
          </>
        )}

        {/* APPROVED SUCCESS VIEW */}
        {view === "approved" && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <CheckCircle className="w-14 h-14 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              Letter Approved
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              The letter has been approved and sent.
            </p>

            <Button
              btnText="Go to letters"
              className="mt-6"
              onClick={exitAndClose}
            />
          </div>
        )}

        {/* REJECTED SUCCESS VIEW */}
        {view === "rejected" && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <MailX className="w-14 h-14 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              Rejection Feedback Sent
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              The user has received your feedback.
            </p>

            <Button
              btnText="Go to letters"
              className="mt-6"
              onClick={exitAndClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}
