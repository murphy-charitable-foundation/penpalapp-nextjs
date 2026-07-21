import {
  deleteObject,
  getDownloadURL,
  getMetadata,
  ref as storageRef,
  uploadBytesResumable,
} from "@firebase/storage";
import { storage } from "../firebaseConfig";
import { compressMedia } from "./compressMedia";

const attachmentResolutionCache = new Map();

const getAttachmentCacheEntry = (objectPath) => {
  let entry = attachmentResolutionCache.get(objectPath);

  if (!entry) {
    entry = {};
    attachmentResolutionCache.set(objectPath, entry);
  }

  return entry;
};

const loadAttachmentMetadata = (entry, objectRef) => {
  if (entry.metadata !== undefined) {
    return Promise.resolve(entry.metadata);
  }

  if (entry.metadataRequest) return entry.metadataRequest;

  const request = getMetadata(objectRef)
    .then((metadata) => {
      entry.metadata = {
        size: metadata.size ?? null,
        contentType: metadata.contentType || "",
      };
      return entry.metadata;
    })
    .catch(() => null)
    .finally(() => {
      if (entry.metadataRequest === request) {
        entry.metadataRequest = null;
      }
    });

  entry.metadataRequest = request;
  return request;
};

const loadAttachmentDownloadUrl = (entry, objectRef) => {
  if (entry.downloadUrl !== undefined) {
    return Promise.resolve(entry.downloadUrl);
  }

  if (entry.downloadUrlRequest) return entry.downloadUrlRequest;

  const request = getDownloadURL(objectRef)
    .then((downloadUrl) => {
      entry.downloadUrl = downloadUrl;
      return downloadUrl;
    })
    .catch(() => null)
    .finally(() => {
      if (entry.downloadUrlRequest === request) {
        entry.downloadUrlRequest = null;
      }
    });

  entry.downloadUrlRequest = request;
  return request;
};

const loadAttachmentBlob = (entry, downloadUrl) => {
  if (entry.blob !== undefined) {
    return Promise.resolve(entry.blob);
  }

  if (entry.blobRequest) return entry.blobRequest;
  if (!isAllowedMediaUrl(downloadUrl)) return Promise.resolve(null);

  const request = fetch(downloadUrl, {
    credentials: "omit",
    mode: "cors",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Attachment download failed with ${response.status}`);
      }

      return response.blob();
    })
    .then((blob) => {
      entry.blob = blob;

      if (entry.metadata === undefined) {
        entry.metadata = {
          size: blob.size,
          contentType: blob.type || "",
        };
      }

      return blob;
    })
    .catch(() => null)
    .finally(() => {
      if (entry.blobRequest === request) {
        entry.blobRequest = null;
      }
    });

  entry.blobRequest = request;
  return request;
};

const getAttachmentBlobUrl = (entry, blob) => {
  if (entry.blobUrl) return entry.blobUrl;
  if (
    !blob ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return null;
  }

  entry.blobUrl = URL.createObjectURL(blob);
  return entry.blobUrl;
};

const revokeAttachmentBlobUrl = (entry) => {
  if (
    !entry?.blobUrl ||
    typeof URL === "undefined" ||
    typeof URL.revokeObjectURL !== "function"
  ) {
    return;
  }

  URL.revokeObjectURL(entry.blobUrl);
  entry.blobUrl = null;
};

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

    if (env?.length) {
      return env.split(",").map((value) => value.trim()).filter(Boolean);
    }
  } catch (error) {
    // Use the Firebase Storage origin below.
  }

  return ["https://firebasestorage.googleapis.com"];
};

export const isAllowedMediaUrl = (downloadUrl) => {
  if (!downloadUrl) return false;

  try {
    return getAllowedMediaOrigins().includes(new URL(downloadUrl).origin);
  } catch (error) {
    return false;
  }
};

export const sanitizeFileName = (fileName = "") =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const isValidStoredFileName = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  sanitizeFileName(value) === value;

export const getAttachmentFileNames = (attachments) => {
  if (!Array.isArray(attachments)) return [];

  return [...new Set(attachments.filter(isValidStoredFileName))];
};

export const getMessageAttachmentFileNames = (message = {}) =>
  getAttachmentFileNames(message.attachments);

export const getMessageAttachmentObjectPath = ({
  conversationId,
  messageId,
  fileName,
}) => {
  if (!conversationId || !messageId || !isValidStoredFileName(fileName)) {
    return null;
  }

  return `conversations/${conversationId}/messages/${messageId}/${fileName}`;
};

export const getMediaKind = (contentType = "", fileName = "") => {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";

  const extension = fileName.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"].includes(extension)) {
    return "image";
  }

  if (["mp4", "mov", "webm", "m4v"].includes(extension)) {
    return "video";
  }

  if (["mp3", "m4a", "aac", "wav", "ogg", "opus"].includes(extension)) {
    return "audio";
  }

  return "file";
};

export const createAttachmentFromFile = (file, mediaKind) => ({
  clientKey: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  fileName: sanitizeFileName(file.name),
  byteSize: file.size,
  mediaKind,
  file,
  status: "pending",
  progress: 0,
});

const getFileNameWithType = (fileName, mimeType) => {
  const baseName = fileName?.replace(/\.[^/.]+$/, "") || "attachment";
  const typeBase = (mimeType || "").split(";")[0];
  const extension = typeBase.includes("/") ? typeBase.split("/")[1] : "bin";
  return `${sanitizeFileName(baseName)}.${extension}`;
};

const createResolvedAttachment = ({
  fileName,
  metadata,
  downloadUrl = null,
}) => {
  const contentType = metadata?.contentType || "";

  return {
    fileName,
    byteSize: metadata?.size ?? null,
    contentType,
    mediaKind: getMediaKind(contentType, fileName),
    downloadUrl,
  };
};

export const getCachedMessageAttachments = ({
  conversationId,
  messageId,
  fileNames,
  includeDownloadUrls = true,
}) =>
  getAttachmentFileNames(fileNames).map((fileName) => {
    const objectPath = getMessageAttachmentObjectPath({
      conversationId,
      messageId,
      fileName,
    });
    const entry = objectPath
      ? attachmentResolutionCache.get(objectPath)
      : null;

    return createResolvedAttachment({
      fileName,
      metadata: entry?.metadata,
      downloadUrl: includeDownloadUrls ? entry?.downloadUrl || null : null,
    });
  });

export const resolveMessageAttachment = async ({
  conversationId,
  messageId,
  fileName,
  includeDownloadUrl = true,
}) => {
  const objectPath = getMessageAttachmentObjectPath({
    conversationId,
    messageId,
    fileName,
  });

  if (!objectPath) return null;

  const objectRef = storageRef(storage, objectPath);
  const cacheEntry = getAttachmentCacheEntry(objectPath);
  const [metadata, downloadUrl] = await Promise.all([
    loadAttachmentMetadata(cacheEntry, objectRef),
    includeDownloadUrl
      ? loadAttachmentDownloadUrl(cacheEntry, objectRef)
      : Promise.resolve(null),
  ]);

  return createResolvedAttachment({
    fileName,
    downloadUrl,
    metadata,
  });
};

export const resolveMessageAttachmentPreview = async ({
  conversationId,
  messageId,
  fileName,
}) => {
  const objectPath = getMessageAttachmentObjectPath({
    conversationId,
    messageId,
    fileName,
  });

  if (!objectPath) return null;

  const objectRef = storageRef(storage, objectPath);
  const cacheEntry = getAttachmentCacheEntry(objectPath);
  const [metadata, downloadUrl] = await Promise.all([
    loadAttachmentMetadata(cacheEntry, objectRef),
    loadAttachmentDownloadUrl(cacheEntry, objectRef),
  ]);
  const blob = await loadAttachmentBlob(cacheEntry, downloadUrl);
  const blobUrl = getAttachmentBlobUrl(cacheEntry, blob);

  if (blobUrl) {
    return createResolvedAttachment({
      fileName,
      metadata: metadata || cacheEntry.metadata,
      downloadUrl: blobUrl,
    });
  }

  return createResolvedAttachment({
    fileName,
    metadata: metadata || cacheEntry.metadata,
    downloadUrl,
  });
};

export const resolveMessageAttachments = async ({
  conversationId,
  messageId,
  fileNames,
  includeDownloadUrls = true,
}) => {
  const resolved = await Promise.all(
    getAttachmentFileNames(fileNames).map((fileName) =>
      resolveMessageAttachment({
        conversationId,
        messageId,
        fileName,
        includeDownloadUrl: includeDownloadUrls,
      }),
    ),
  );

  return resolved.filter(Boolean);
};

const createAttachmentQueue = (messageId, attachments) =>
  attachments.map(({ fileName, byteSize, mediaKind }) => ({
    clientKey: `stored-${messageId}-${fileName}`,
    fileName,
    byteSize,
    mediaKind,
    status: "done",
    progress: 100,
  }));

export const restoreAttachmentQueue = async ({
  conversationId,
  messageId,
  fileNames,
}) => {
  const resolved = await resolveMessageAttachments({
    conversationId,
    messageId,
    fileNames,
    includeDownloadUrls: false,
  });

  return createAttachmentQueue(messageId, resolved);
};

export const getCachedAttachmentQueue = ({
  conversationId,
  messageId,
  fileNames,
}) =>
  createAttachmentQueue(
    messageId,
    getCachedMessageAttachments({
      conversationId,
      messageId,
      fileNames,
      includeDownloadUrls: false,
    }),
  );

export const deleteMessageAttachment = async ({
  conversationId,
  messageId,
  fileName,
}) => {
  const objectPath = getMessageAttachmentObjectPath({
    conversationId,
    messageId,
    fileName,
  });

  if (!objectPath) return;

  await deleteObject(storageRef(storage, objectPath));
  revokeAttachmentBlobUrl(attachmentResolutionCache.get(objectPath));
  attachmentResolutionCache.delete(objectPath);
};

export const getCompletedAttachmentFileNamesForSave = (attachments = []) => {
  const fileNames = attachments
    .filter(
      (attachment) =>
        attachment?.status === "done" &&
        isValidStoredFileName(attachment.fileName),
    )
    .map((attachment) => attachment.fileName);
  const uniqueFileNames = [...new Set(fileNames)];

  return uniqueFileNames.length > 0 ? uniqueFileNames : null;
};

export const uploadAttachmentFile = async ({
  attachment,
  conversationId,
  messageId,
  onUpdate,
  onComplete,
  onDuplicate,
}) => {
  if (!attachment?.clientKey || !attachment.file || !conversationId || !messageId) {
    onUpdate?.(attachment?.clientKey, { status: "error" });
    return;
  }

  let fileToUpload = attachment.file;

  try {
    onUpdate?.(attachment.clientKey, { status: "compressing", progress: 0 });

    const compressedMedia = await compressMedia(
      attachment.file,
      (compressionProgress) => {
        const progress = Math.round(
          Math.max(0, Math.min(1, compressionProgress)) * 40,
        );

        onUpdate?.(attachment.clientKey, {
          status: "compressing",
          progress,
        });
      },
    );

    if (compressedMedia instanceof File) {
      fileToUpload = new File(
        [compressedMedia],
        sanitizeFileName(compressedMedia.name),
        { type: compressedMedia.type || attachment.file.type },
      );
    } else {
      fileToUpload = new File(
        [compressedMedia],
        getFileNameWithType(
          attachment.fileName,
          compressedMedia.type || attachment.file.type,
        ),
        { type: compressedMedia.type || attachment.file.type },
      );
    }

    onUpdate?.(attachment.clientKey, {
      file: fileToUpload,
      fileName: fileToUpload.name,
      byteSize: fileToUpload.size,
      mediaKind: getMediaKind(fileToUpload.type, fileToUpload.name),
    });
  } catch (error) {
    console.error("Attachment compression failed:", error);
    onUpdate?.(attachment.clientKey, { status: "error" });
    return;
  }

  const fileName = sanitizeFileName(fileToUpload.name);
  const objectPath = getMessageAttachmentObjectPath({
    conversationId,
    messageId,
    fileName,
  });

  if (!objectPath) {
    onUpdate?.(attachment.clientKey, { status: "error" });
    return;
  }

  const objectRef = storageRef(storage, objectPath);

  try {
    await getMetadata(objectRef);
    onDuplicate?.(fileName);
    return;
  } catch (error) {
    if (error?.code !== "storage/object-not-found") {
      console.error("Attachment existence check failed:", error);
      onUpdate?.(attachment.clientKey, { status: "error" });
      return;
    }
  }

  const uploadMetadata = fileToUpload.type
    ? { contentType: fileToUpload.type }
    : undefined;
  const task = uploadBytesResumable(objectRef, fileToUpload, uploadMetadata);

  task.on(
    "state_changed",
    (snapshot) => {
      const uploadProgress = snapshot.totalBytes
        ? snapshot.bytesTransferred / snapshot.totalBytes
        : 0;
      const progress = Math.round(40 + uploadProgress * 60);
      onUpdate?.(attachment.clientKey, { progress, status: "uploading" });
    },
    (error) => {
      console.error("Attachment upload failed:", error);
      onUpdate?.(attachment.clientKey, { status: "error" });
    },
    async () => {
      const cacheEntry = getAttachmentCacheEntry(objectPath);
      revokeAttachmentBlobUrl(cacheEntry);
      cacheEntry.blob = fileToUpload;
      cacheEntry.metadata = {
        size: fileToUpload.size,
        contentType: fileToUpload.type || "",
      };

      onUpdate?.(attachment.clientKey, {
        fileName,
        file: null,
        status: "done",
        progress: 100,
        byteSize: fileToUpload.size,
        mediaKind: getMediaKind(fileToUpload.type, fileName),
      });

      try {
        await onComplete?.(fileName);
      } catch (error) {
        console.error("Attachment completion handler failed:", error);
      }
    },
  );
};
