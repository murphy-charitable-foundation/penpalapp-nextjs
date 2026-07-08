import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "@firebase/storage";
import { storage } from "../firebaseConfig";
import { compressMedia } from "./compressMedia";

export const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes == null) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

export const getAllowedMediaOrigins = () => {
  try {
    const env =
      typeof process !== "undefined"
        ? process.env.NEXT_PUBLIC_ALLOWED_MEDIA_ORIGINS
        : undefined;

    if (env && env.length) {
      return env.split(",").map((s) => s.trim()).filter(Boolean);
    }
  } catch (error) {
    // Ignore and use the default origin below.
  }

  return ["https://firebasestorage.googleapis.com"];
};

export const isAllowedMediaUrl = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return getAllowedMediaOrigins().includes(parsed.origin);
  } catch (error) {
    return false;
  }
};

export const createAttachmentFromFile = (file, mediaType) => ({
  id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  name: file.name,
  size: file.size,
  mediaType,
  file,
  url: null,
  previewUrl: URL.createObjectURL(file),
  uploadStatus: "pending",
  progress: 0,
});

export const revokeAttachmentPreview = (attachment) => {
  if (attachment?.previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
};

export const revokeAttachmentPreviews = (attachments) => {
  attachments.forEach(revokeAttachmentPreview);
};

export const getFileNameWithType = (name, mimeType) => {
  const baseName = name?.replace(/\.[^/.]+$/, "") || `attachment_${Date.now()}`;
  const typeBase = (mimeType || "").split(";")[0];
  const ext = typeBase.includes("/") ? typeBase.split("/")[1] : "bin";
  return `${baseName}.${ext}`;
};

export const getAttachmentStoragePath = ({ conversationId, messageId, fileName }) => {
  const safeFileName = fileName
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  if (!conversationId || !messageId) {
    return null;
  }

  return `conversations/${conversationId}/${messageId}/${Date.now()}_${safeFileName}`;
};

export const extractStoragePathFromDownloadUrl = (url) => {
  try {
    const parsed = new URL(url);
    const marker = "/o/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(parsed.pathname.substring(idx + marker.length));
  } catch (error) {
    return null;
  }
};

export const deleteAttachmentStorageObject = async (attachment) => {
  const storagePath =
    attachment?.storagePath ||
    (attachment?.url ? extractStoragePathFromDownloadUrl(attachment.url) : null);

  if (!storagePath) return;

  await deleteObject(storageRef(storage, storagePath));
};

export const normalizeMessageAttachments = (message) => {
  const normalized = [];

  if (Array.isArray(message.attachments) && message.attachments.length > 0) {
    message.attachments.forEach((att, index) => {
      normalized.push({
        id: att.id || `${message.id}-att-${index}`,
        name: att.file_name || att.name || `Attachment ${index + 1}`,
        size: att.size || 0,
        mediaType: att.media_type || att.mediaType || "image",
        url: att.url,
      });
    });
  }

  if (normalized.length === 0 && message.media_url) {
    normalized.push({
      id: `${message.id}-legacy`,
      name:
        message.media_type === "image"
          ? "Image"
          : message.media_type === "video"
          ? "Video"
          : "Audio",
      size: 0,
      mediaType: message.media_type,
      url: message.media_url,
    });
  }

  return normalized;
};

export const getCompletedAttachmentsForSave = (attachments) =>
  attachments
    .filter((attachment) => attachment.uploadStatus === "done" && attachment.url)
    .map((attachment) => ({
      url: attachment.url,
      media_type: attachment.mediaType,
      file_name: attachment.name,
      size: attachment.size,
    }));

export const legacyAttachmentFromMedia = ({ mediaUrl, mediaType }) => ({
  id: `legacy_${Date.now()}`,
  name:
    mediaType === "image" ? "Photo" : mediaType === "video" ? "Video" : "Audio",
  size: 0,
  mediaType,
  url: mediaUrl,
});

export const uploadAttachmentFile = async ({
  attachment,
  conversationId,
  messageId,
  onUpdate,
  onComplete,
}) => {
  if (!attachment || !conversationId || !messageId) {
    onUpdate?.(attachment?.id, { uploadStatus: "error" });
    return;
  }

  let fileToUpload = attachment.file;

  try {
    onUpdate?.(attachment.id, { uploadStatus: "compressing", progress: 0 });

    const compressedMedia = await compressMedia(
      attachment.file,
      (compressionProgress) => {
        const progress = Math.round(
          Math.max(0, Math.min(1, compressionProgress)) * 40,
        );

        onUpdate?.(attachment.id, {
          uploadStatus: "compressing",
          progress,
        });
      },
    );

    if (compressedMedia instanceof File) {
      fileToUpload = compressedMedia;
    } else {
      fileToUpload = new File(
        [compressedMedia],
        getFileNameWithType(
          attachment.name,
          compressedMedia.type || attachment.file.type,
        ),
        { type: compressedMedia.type || attachment.file.type },
      );
    }

    onUpdate?.(attachment.id, {
      file: fileToUpload,
      name: fileToUpload.name,
      size: fileToUpload.size,
    });
  } catch (error) {
    console.error("❌ attachment compression error:", error);
    onUpdate?.(attachment.id, { uploadStatus: "error" });
    return;
  }

  const storagePath = getAttachmentStoragePath({
    conversationId,
    messageId,
    fileName: fileToUpload.name,
  });

  if (!storagePath) {
    onUpdate?.(attachment.id, { uploadStatus: "error" });
    return;
  }

  const task = uploadBytesResumable(storageRef(storage, storagePath), fileToUpload);

  task.on(
    "state_changed",
    (snapshot) => {
      const uploadProgress = snapshot.totalBytes
        ? snapshot.bytesTransferred / snapshot.totalBytes
        : 0;
      const progress = Math.round(40 + uploadProgress * 60);
      onUpdate?.(attachment.id, { progress, uploadStatus: "uploading" });
    },
    (error) => {
      console.error("❌ uploadAttachment error:", error);
      onUpdate?.(attachment.id, { uploadStatus: "error" });
    },
    async () => {
      try {
        const url = await getDownloadURL(task.snapshot.ref);
        onUpdate?.(attachment.id, {
          url,
          uploadStatus: "done",
          progress: 100,
          size: fileToUpload.size,
          storagePath,
        });
        await onComplete?.();
      } catch (error) {
        console.error("❌ uploadAttachment download URL error:", error);
        onUpdate?.(attachment.id, { uploadStatus: "error" });
      }
    },
  );
};
