"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Film,
  Image as ImageIcon,
  LoaderCircle,
  Paperclip,
  Play,
  X,
} from "lucide-react";
import {
  formatFileSize,
  getAttachmentFileNames,
  getCachedMessageAttachments,
  isAllowedMediaUrl,
  resolveMessageAttachmentPreview,
  resolveMessageAttachments,
} from "../../../app/utils/attachments";

const AttachmentIcon = ({ mediaKind }) => {
  if (mediaKind === "image") {
    return <ImageIcon size={18} className="text-emerald-700" />;
  }

  if (mediaKind === "video") {
    return <Film size={18} className="text-emerald-700" />;
  }

  if (mediaKind === "audio") {
    return <Play size={18} className="text-emerald-700" />;
  }

  return <Paperclip size={18} className="text-emerald-700" />;
};

export const AttachmentViewer = ({ attachment, isOpen = true, onClose }) => {
  const mediaRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      mediaRef.current?.pause?.();
    }
  }, [isOpen]);

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm px-4 py-6 ${
        isOpen ? "visible" : "invisible pointer-events-none"
      }`}
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow hover:bg-gray-100"
          aria-label="Close attachment"
          title="Close attachment"
        >
          <X size={20} />
        </button>

        <div className="p-4">
          {attachment.mediaKind === "image" ? (
            <div className="relative h-[70vh] w-full overflow-hidden rounded-lg bg-slate-900">
              <Image
                src={attachment.downloadUrl}
                alt={attachment.fileName}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain"
                unoptimized
              />
            </div>
          ) : attachment.mediaKind === "video" ? (
            <video
              ref={mediaRef}
              src={attachment.downloadUrl}
              controls
              className="h-[70vh] w-full rounded-lg bg-black"
            />
          ) : (
            <div className="rounded-lg bg-slate-100 p-6">
              <audio
                ref={mediaRef}
                src={attachment.downloadUrl}
                controls
                className="w-full"
              />
            </div>
          )}

          <div className="mt-3 text-sm text-slate-600">
            {attachment.fileName}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MessageAttachments({
  conversationId,
  messageId,
  fileNames,
  className = "mt-3",
}) {
  const storedFileNames = useMemo(
    () => getAttachmentFileNames(fileNames),
    [fileNames],
  );
  const [attachments, setAttachments] = useState([]);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [openingFileName, setOpeningFileName] = useState(null);
  const previewRequestRef = useRef(0);
  const previewCacheRef = useRef(new Map());

  useEffect(() => {
    let cancelled = false;

    setAttachments(
      getCachedMessageAttachments({
        conversationId,
        messageId,
        fileNames: storedFileNames,
      }),
    );
    setSelectedAttachment(null);
    setIsViewerOpen(false);
    setOpeningFileName(null);
    previewCacheRef.current.clear();

    if (!conversationId || !messageId || storedFileNames.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    resolveMessageAttachments({
      conversationId,
      messageId,
      fileNames: storedFileNames,
    }).then((resolved) => {
      if (!cancelled) {
        setAttachments(resolved);
      }
    });

    return () => {
      cancelled = true;
      previewRequestRef.current += 1;
    };
  }, [conversationId, messageId, storedFileNames]);

  if (storedFileNames.length === 0) return null;

  const handleOpen = async (attachment) => {
    if (attachment.mediaKind === "file") {
      if (!isAllowedMediaUrl(attachment.downloadUrl)) return;

      window.open(attachment.downloadUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const cachedPreview = previewCacheRef.current.get(attachment.fileName);

    if (cachedPreview) {
      setSelectedAttachment(cachedPreview);
      setIsViewerOpen(true);
      return;
    }

    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    setOpeningFileName(attachment.fileName);

    let previewAttachment = null;

    try {
      previewAttachment = await resolveMessageAttachmentPreview({
        conversationId,
        messageId,
        fileName: attachment.fileName,
      });
    } catch (error) {
      console.error("Failed to open attachment preview:", error);
    } finally {
      if (previewRequestRef.current === requestId) {
        setOpeningFileName(null);
      }
    }

    if (
      previewRequestRef.current !== requestId ||
      !previewAttachment?.downloadUrl
    ) {
      return;
    }

    previewCacheRef.current.set(attachment.fileName, previewAttachment);
    setSelectedAttachment(previewAttachment);
    setIsViewerOpen(true);
  };

  return (
    <>
      <div className={`${className} space-y-2`}>
        {attachments.map((attachment) => {
          const isOpening = openingFileName === attachment.fileName;
          const canOpen =
            attachment.mediaKind === "file"
              ? isAllowedMediaUrl(attachment.downloadUrl)
              : Boolean(conversationId && messageId && attachment.fileName);

          return (
            <button
              key={attachment.fileName}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleOpen(attachment);
              }}
              disabled={!canOpen || isOpening}
              className="flex w-full items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-left transition-colors hover:bg-emerald-100 disabled:cursor-default disabled:opacity-70"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                {isOpening ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin text-emerald-700"
                  />
                ) : (
                  <AttachmentIcon mediaKind={attachment.mediaKind} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-emerald-900">
                  {attachment.fileName}
                </div>
                {attachment.byteSize != null && (
                  <div className="text-xs text-emerald-700">
                    {formatFileSize(attachment.byteSize)}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedAttachment && (
        <AttachmentViewer
          attachment={selectedAttachment}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </>
  );
}
