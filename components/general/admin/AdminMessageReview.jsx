"use client";

import Image from "next/image";
import Button from "../Button";
import LoadingSpinner from "../../loading/LoadingSpinner";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import MessageAttachments from "../message/MessageAttachments";

export default function AdminMessageReview({
  message,
  onApprove,
  onReject,
  onRevert,
  onClose,
  isSubmitting = false,
}) {
  if (!message) return null;

  const status =
    message.status === "approved"
      ? "approved"
      : message.status === "rejected"
        ? "rejected"
        : "pending_review";

  const headerColor =
    status === "approved"
      ? "bg-dark-green"
      : status === "rejected"
        ? "bg-red-600"
        : "bg-primary";

  const sentAt = message.lastMessageDate
    ? typeof message.lastMessageDate.toDate === "function"
      ? message.lastMessageDate.toDate().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date(message.lastMessageDate.seconds * 1000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
    : "";


  return (
    <div className="h-full bg-gray-100">
      <div className="relative h-full bg-white flex flex-col overflow-hidden">
        {isSubmitting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
            <LoadingSpinner />
          </div>
        )}

        <div
          className={`flex h-full flex-col transition-opacity duration-200 ${
            isSubmitting ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <div
            className={`flex items-center px-4 h-16 ${
              headerColor === "bg-white" || headerColor === "bg-gray-50"
                ? "text-black"
                : "text-white"
            } ${headerColor}`}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <h2 className="flex-1 text-center text-lg font-semibold truncate">
              {message.name}
            </h2>

            <div className="w-10 h-10" />
          </div>

          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 flex flex-col">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Image
                    src={message.profileImage || "/usericon.png"}
                    alt="sender"
                    width={44}
                    height={44}
                    className="rounded-full object-cover"
                  />

                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {message.name}
                    </div>

                    <div className="text-sm text-gray-500 truncate">
                      To {message.recipientName || "recipient"}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500 whitespace-nowrap ml-3">
                  {sentAt}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>

                <MessageAttachments
                  conversationId={message.conversationId}
                  messageId={message.id}
                  fileNames={message.attachments}
                  className="mt-4"
                />
              </div>
            </div>

            {status === "rejected" && (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                  <div>
                    <h4 className="font-semibold text-red-700">
                      Your message was disapproved.
                    </h4>

                    {message.rejection_reason && (
                      <p className="text-sm text-red-700 mt-1">
                        {message.rejection_reason}
                      </p>
                    )}

                    {message.rejection_feedback && (
                      <p className="text-sm text-red-700 mt-1">
                        {message.rejection_feedback}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-center gap-3 mt-4">
                  <Button
                    btnText="Clear status"
                    color="blue"
                    size="small"
                    onClick={() => onRevert(message)}
                    disabled={isSubmitting}
                  />

                  <Button
                    btnText="Edit"
                    color="green"
                    size="small"
                    onClick={onReject}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            <div className="flex-grow" />
          </div>

          <div className="shrink-0 bg-white border-t px-6 py-4">
            {status === "approved" && (
              <div className="flex justify-center">
                <Button
                  btnText="Clear status"
                  color="blue"
                  size="small"
                  onClick={() => onRevert(message)}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {status === "pending_review" && (
              <div className="flex justify-center gap-4">
                <Button
                  btnText="Approve"
                  color="green"
                  size="small"
                  onClick={onApprove}
                  disabled={isSubmitting}
                />

                <Button
                  btnText="Reject"
                  color="red"
                  size="small"
                  onClick={onReject}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
