"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Button from "../Button";
import LoadingSpinner from "../../loading/LoadingSpinner";
import {
  ChevronLeft,
  AlertTriangle,
  Film,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Play,
} from "lucide-react";

export default function AdminMessageReview({
  message,
  attachments = [],
  onApprove,
  onReject,
  onRevert,
  onClose,
  isSubmitting = false,
}) {

  const [attachmentViewer, setAttachmentViewer] = useState(null);

  useEffect(() => {
    if (!attachmentViewer) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setAttachmentViewer(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [attachmentViewer]);

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


  const getAllowedOrigins = () => {
    try {
      const env = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_ALLOWED_MEDIA_ORIGINS : undefined;
      if (env && env.length) {
        return env.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } catch (e) {
      // ignore and fallback
    }

    // Default fallback to common Firebase storage origin
    return ["https://firebasestorage.googleapis.com"];
  };

  const isAllowedMediaUrl = (url) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const origin = parsed.origin;
      const allowed = getAllowedOrigins();
      return allowed.includes(origin);
    } catch (e) {
      return false;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0 || bytes == null) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getAttachmentIcon = (mediaType) => {
    if (mediaType === "image") return <ImageIcon size={18} className="text-emerald-700" />;
    if (mediaType === "video") return <Film size={18} className="text-emerald-700" />;
    if (mediaType === "audio") return <Play size={18} className="text-emerald-700" />;
    return <Paperclip size={18} className="text-emerald-700" />;
  };
  const handleOpenAttachment = (attachment) => {
    const source = attachment?.url || attachment?.previewUrl;
    if (!source) return;

    // If attachment has a remote URL, ensure it's from an allowed origin
    if (attachment?.url && !isAllowedMediaUrl(attachment.url)) {
      console.warn("Blocked attachment from disallowed origin:", attachment.url);
      return;
    }

    setAttachmentViewer({
      ...attachment,
      source,
      mediaType: attachment.media_type || "file",
      name: attachment.file_name || "Attachment",
    });
  };

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
                  {message.lastMessage}
                </p>

                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((attachment, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenAttachment(attachment);
                        }}
                        className="w-full flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-left hover:bg-emerald-100 transition-colors"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
                          {getAttachmentIcon(attachment.media_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-emerald-900 truncate">
                            {attachment.file_name}
                          </div>
                          <div className="text-xs text-emerald-700">
                            {formatFileSize(attachment.size)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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

          {attachmentViewer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm px-4 py-6">
              <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <button
                  onClick={() => setAttachmentViewer(null)}
                  className="absolute top-4 right-4 z-10 rounded-full bg-white p-2 text-gray-700 shadow hover:bg-gray-100"
                >
                  ✕
                </button>
                <div className="p-4">
                  {attachmentViewer.mediaType === "image" ? (
                    <img
                      src={attachmentViewer.source}
                      alt={attachmentViewer.name}
                      className="w-full h-[70vh] object-contain rounded-2xl bg-slate-900"
                    />
                  ) : attachmentViewer.mediaType === "video" ? (
                    <video
                      src={attachmentViewer.source}
                      controls
                      className="w-full h-[70vh] rounded-2xl bg-black"
                    />
                  ) : (
                    <div className="rounded-2xl bg-slate-100 p-6">
                      <audio
                        src={attachmentViewer.source}
                        controls
                        className="w-full"
                      />
                    </div>
                  )}
                  <div className="mt-3 text-sm text-slate-600">
                    {attachmentViewer.name}
                  </div>
                </div>
              </div>
            </div>
          )}

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
