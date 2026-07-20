"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useUser } from "../../../contexts/UserContext";
import {
  fetchRecipients,
  fetchDraft,
  sendNotification,
} from "../../utils/conversationsFunctions";
import { getUserPfp } from "../../utils/avatarUtils";

import {
  createAttachmentFromFile,
  deleteAttachmentStorageObject,
  formatFileSize,
  getCompletedAttachmentsForSave,
  isAllowedMediaUrl,
  hydrateAttachmentUrls,
  normalizeMessageAttachments,
  normalizeDraftAttachments,
  revokeAttachmentPreview,
  revokeAttachmentPreviews,
  uploadAttachmentFile,
} from "../../utils/attachments";
import { formatTimestamp } from "../../utils/dateHelpers";
import ProfileImage from "../../../components/general/ProfileImage";
import { FaExclamationCircle } from "react-icons/fa";
import ReportPopup from "../../../components/general/message/ReportPopup";
import ConfirmReportPopup from "../../../components/general/message/ConfirmReportPopup";
import { useRouter } from "next/navigation";
import MessagesSkeleton from "../../../components/loading/MessagesSkeleton";
import Image from "next/image";
import Dialog from "../../../components/general/Dialog";
import { PageContainer } from "../../../components/general/PageContainer";
import { PageBackground } from "../../../components/general/PageBackground";
import {
  AlertTriangle,
  Film,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Trash2,
  Play,
} from "lucide-react";
import AudioRecorder from "../../../components/media/AudioRecorder";
import { logButtonEvent, logError } from "../../utils/analytics";
import { usePageAnalytics } from "../../useAnalytics";

export default function Page({ params }) {
  const { id } = params;

  const router = useRouter();
  const { user } = useUser();
  const messagesEndRef = useRef(null);
  const textAreaRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const messageContentRef = useRef("");
  const pendingAttachmentsRef = useRef([]);

  const [userRef, setUserRef] = useState(null);
  const [userLocation, setUserLocation] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const [messageContent, setMessageContent] = useState("");
  const [draft, setDraft] = useState(null);
  const [hasDraftContent, setHasDraftContent] = useState(false);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageOriginalContent, setEditingMessageOriginalContent] =
    useState("");

  const [allMessages, setAllMessages] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [recipientName, setRecipientName] = useState("");
  const [globalConversationReference, setGlobalConversationReference] = useState(null);
  const [messagesRef, setMessagesRef] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [isSendButtonDisabled, setIsSendButtonDisabled] = useState(false);
  const [isUpdatingFirebase, setIsUpdatingFirebase] = useState(false);

  const [showReportPopup, setShowReportPopup] = useState(false);
  const [showConfirmReportPopup, setShowConfirmReportPopup] = useState(false);
  const [reportContent, setReportContent] = useState(null);
  const [reportSender, setReportSender] = useState(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [queuedAttachmentDeletes, setQueuedAttachmentDeletes] = useState([]);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const [showAttachmentDeleteDialog, setShowAttachmentDeleteDialog] = useState(false);
  const [attachmentViewer, setAttachmentViewer] = useState(null);

  const [draftTimer, setDraftTimer] = useState(null);

  useEffect(() => {
    messageContentRef.current = messageContent;
  }, [messageContent]);

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: instant ? "auto" : "smooth",
      block: "end",
    });
  };

  const getAttachmentIcon = (mediaType) => {
    if (mediaType === "image") return <ImageIcon size={18} className="text-emerald-700" />;
    if (mediaType === "video") return <Film size={18} className="text-emerald-700" />;
    if (mediaType === "audio") return <Play size={18} className="text-emerald-700" />;
    return <Paperclip size={18} className="text-emerald-700" />;
  };

  const updateAttachment = (attachmentId, patch) => {
    setPendingAttachments((current) =>
      current.map((item) =>
        item.id === attachmentId ? { ...item, ...patch } : item,
      ),
    );
  };

  const removeAttachment = (attachmentId) => {
    setPendingAttachments((current) => {
      const removed = current.find((item) => item.id === attachmentId);
      revokeAttachmentPreview(removed);
      return current.filter((item) => item.id !== attachmentId);
    });
  };

  const uploadAttachment = async (attachment) => {
    if (!attachment || !user?.uid || !messagesRef) {
      updateAttachment(attachment.id, { uploadStatus: "error" });
      return;
    }

    const isEditingExistingMessage = Boolean(editingMessageId);
    let targetMessageId = editingMessageId;

    if (!isEditingExistingMessage) {
      let draftMessage;

      try {
        draftMessage = await saveDraft(messageContent);
      } catch (error) {
        updateAttachment(attachment.id, { uploadStatus: "error" });
        return;
      }

      if (!draftMessage?.id) {
        updateAttachment(attachment.id, { uploadStatus: "error" });
        return;
      }

      targetMessageId = draftMessage.id;
    }

    if (!targetMessageId) {
      updateAttachment(attachment.id, { uploadStatus: "error" });
      return;
    }

    await uploadAttachmentFile({
      attachment,
      conversationId: id,
      messageId: targetMessageId,
      onUpdate: updateAttachment,
      onComplete: () => {
        setPendingAttachments((current) => {
          pendingAttachmentsRef.current = current;
          if (!isEditingExistingMessage) {
            saveDraft(messageContentRef.current, current).catch((error) => {
              logError(error, {
                description: "Failed to save draft after attachment upload:",
              });
            });
          }
          return current;
        });
      },
    });
  };

  const handleAddAttachment = ({ file, mediaType }) => {
    const newAttachment = createAttachmentFromFile(file, mediaType);
    setPendingAttachments((current) => [...current, newAttachment]);
    setIsEditing(true);
    setHasDraftContent(true);
    uploadAttachment(newAttachment);
  };

  const handlePickImage = () => {
    if (!user?.uid) {
      handleRequireLogin();
      return;
    }
    imageInputRef.current?.click();
  };

  const handlePickVideo = () => {
    if (!user?.uid) {
      handleRequireLogin();
      return;
    }
    videoInputRef.current?.click();
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }
    handleAddAttachment({ file, mediaType: "image" });
  };

  const handleVideoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    if (!file.type.startsWith("video/")) {
      alert("Please select a valid video file.");
      return;
    }
    handleAddAttachment({ file, mediaType: "video" });
  };

  const handleRequestDeleteAttachment = (attachment) => {
    setAttachmentToDelete(attachment);
    setShowAttachmentDeleteDialog(true);
  };

  const handleConfirmDeleteAttachment = async () => {
    if (!attachmentToDelete) {
      setShowAttachmentDeleteDialog(false);
      return;
    }

    const att = attachmentToDelete;
    const remainingAttachments = pendingAttachments.filter(
      (item) => item.id !== att.id,
    );

    // Remove from pending UI immediately
    removeAttachment(att.id);

    try {
      if (editingMessageId) {
        setQueuedAttachmentDeletes((current) => [...current, att]);
        const hasContent = Boolean(messageContent.trim());
        setHasDraftContent(hasContent || remainingAttachments.length > 0);
      } else {
        await saveDraft(messageContent, remainingAttachments);
        await deleteAttachmentStorageObject(att);
      }
    } catch (error) {
      console.error("Error during attachment deletion:", error);
    } finally {
      setAttachmentToDelete(null);
      setShowAttachmentDeleteDialog(false);
    }
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
    });
  };

  const messageAttachments = normalizeMessageAttachments;

  const attachmentsToSave = (attachments = pendingAttachments) =>
    getCompletedAttachmentsForSave(attachments);

  const getMessageContentForSave = (content, attachments = pendingAttachments) => {
    const trimmedContent = (content ?? "").trim();
    return trimmedContent;
  };

  const hasUploadingAttachments = pendingAttachments.some(
    (attachment) => attachment.uploadStatus !== "done",
  );

  const clearPendingAttachments = () => {
    revokeAttachmentPreviews(pendingAttachments);
    setPendingAttachments([]);
  };

  const saveDraft = useCallback(
    async (content, draftAttachments = pendingAttachments) => {
      if (!user?.uid || !messagesRef || isSending) {
        return null;
      }

      setIsUpdatingFirebase(true);

      const messageUserRef = userRef || doc(db, "users", user.uid);
      const trimmedContent = getMessageContentForSave(content, draftAttachments);
      const currentTime = new Date();

      const baseDraftData = {
        sent_by: messageUserRef,
        content: trimmedContent,
        status: "draft",
        drafted_at: currentTime,
        unread: true,
        attachments: attachmentsToSave(draftAttachments),
      };

      try {
        let existingDraft = draft;
        let savedDraft = null;

        if (!existingDraft?.id) {
          existingDraft = await fetchDraft(id, messageUserRef, false);

          if (existingDraft) {
            setDraft(existingDraft);
          }
        }

        if (existingDraft?.id) {
          const draftDocRef = doc(messagesRef, existingDraft.id);

          const updateData = {
            ...baseDraftData,
            drafted_at: currentTime,
          };

          await updateDoc(draftDocRef, updateData);
          setDraft({ ...updateData, id: existingDraft.id });
          savedDraft = { ...updateData, id: existingDraft.id };
        } else {
          const newDraftRef = doc(messagesRef);
          const newDraftData = {
            ...baseDraftData,
            drafted_at: currentTime,
          };

          await setDoc(newDraftRef, newDraftData);
          setDraft({ ...newDraftData, id: newDraftRef.id });
          savedDraft = { ...newDraftData, id: newDraftRef.id };
        }

        const hasContent = Boolean(trimmedContent);
        const hasAnyLocalAttachments = draftAttachments.length > 0;
        setHasDraftContent(hasContent || hasAnyLocalAttachments);

        if (!hasContent && !hasAnyLocalAttachments && isEditing) {
          setIsEditing(false);
        }

        return savedDraft;
      } catch (error) {
        console.error("❌ saveDraft error:", error);

        if (error?.code === "permission-denied") {
          alert("Permission denied. Please check your access rights.");
        } else if (error?.code === "not-found") {
          setDraft(null);

          if (trimmedContent || attachmentsToSave(draftAttachments)?.length > 0) {
            try {
              const newDraftRef = doc(messagesRef);
              const newDraftData = {
                ...baseDraftData,
                drafted_at: currentTime,
              };

              await setDoc(newDraftRef, newDraftData);
              setDraft({ ...newDraftData, id: newDraftRef.id });
              const hasContent = Boolean(trimmedContent);
              const hasAnyLocalAttachments = draftAttachments.length > 0;
              setHasDraftContent(hasContent || hasAnyLocalAttachments);

              if (!hasContent && !hasAnyLocalAttachments && isEditing) {
                setIsEditing(false);
              }

              return { ...newDraftData, id: newDraftRef.id };
            } catch (retryError) {
              logError(retryError, {
                description: "Retry Error:",
              });
            }
          }
        }

        throw error;
      } finally {
        setIsUpdatingFirebase(false);
      }
    },
    [
      user?.uid,
      messagesRef,
      isSending,
      draft,
      userRef,
      isEditing,
      id,
      pendingAttachments,
    ]
  );

  const handleMessageChange = async (e) => {
    const newContent = e.target.value;

    setMessageContent(newContent);
    const trimmedContent = newContent.trim();

    if (draftTimer) {
      clearTimeout(draftTimer);
      setDraftTimer(null);
    }

    if (trimmedContent.length > 0) {
      setIsEditing(true);
      setHasDraftContent(true);

      if (!editingMessageId) {
        const timer = setTimeout(async () => {
          try {
            await saveDraft(newContent);
          } catch (error) {
            logError(error, {
              description: "Failed to auto-save draft:",
            });
          }
        }, 1000);

        setDraftTimer(timer);
      }
    } else {
      const hasAttachments = pendingAttachments.length > 0;
      setHasDraftContent(hasAttachments);
      setIsEditing(hasAttachments);

      if (!editingMessageId) {
        setIsSendButtonDisabled(true);

        try {
          await saveDraft(newContent);
          setIsSendButtonDisabled(false);
        } catch (error) {
          console.error("❌ Failed to save empty draft:", error);
          logError(error, {
            description: "Failed to save empty draft:",
          });

          setTimeout(() => {
            setIsSendButtonDisabled(false);
          }, 3000);
        }
      }
    }
  };

  const handleUpdateMessage = async () => {
    const nextContent = getMessageContentForSave(messageContent, pendingAttachments);
    const hasAttachments = attachmentsToSave(pendingAttachments)?.length > 0;

    if (!nextContent && !hasAttachments) {
      alert("Please enter a message");
      return;
    }

    if (isSending || !editingMessageId) {
      return;
    }

    setIsSending(true);

    try {
      if (!user?.uid || !messagesRef) {
        throw new Error("Missing required dependencies: user or messagesRef");
      }

      const currentTime = new Date();
      const messageRef = doc(messagesRef, editingMessageId);
      const updatedAttachments = attachmentsToSave(pendingAttachments);

      const updateData = {
        content: nextContent,
        attachments: updatedAttachments,
        created_at: currentTime,
      };

      await updateDoc(messageRef, updateData);

      if (queuedAttachmentDeletes.length > 0) {
        await Promise.allSettled(
          queuedAttachmentDeletes.map((attachment) =>
            deleteAttachmentStorageObject(attachment),
          ),
        );
      }

      const messageUserRef = userRef || doc(db, "users", user.uid);
      const existingDraft = await fetchDraft(id, messageUserRef, false);
      const restoredDraftAttachments = await hydrateAttachmentUrls(
        normalizeDraftAttachments(existingDraft?.attachments || []),
      );
      const hasRestoredDraftContent =
        Boolean(existingDraft?.content?.trim()) ||
        restoredDraftAttachments.length > 0;

      if (existingDraft && hasRestoredDraftContent) {
        setDraft(existingDraft);
        setMessageContent(existingDraft.content);
        setPendingAttachments(restoredDraftAttachments);
        setHasDraftContent(hasRestoredDraftContent);
        setIsEditing(true);
      } else {
        setMessageContent("");
        setDraft(null);
        setHasDraftContent(false);
        setIsEditing(false);
        clearPendingAttachments();
      }

      setEditingMessageId(null);
      setEditingMessageOriginalContent("");
      setQueuedAttachmentDeletes([]);
      setSelectedMessageId(null);

      setAllMessages((prev) => {
        return prev.map((msg) => {
          if (msg.id === editingMessageId) {
            return {
              ...msg,
              content: nextContent,
              attachments: updatedAttachments,
              created_at: currentTime,
            };
          }
          return msg;
        });
      });

      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    } catch (error) {
      console.error("❌ handleUpdateMessage error:", error);

      if (error?.code === "permission-denied") {
        alert(
          "Permission denied. Please check your access rights to this conversation.",
        );
      } else if (error?.code === "unauthenticated") {
        alert("You are not authenticated. Please log in again.");
      } else {
        alert("Failed to update message. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (editingMessageId) {
      return handleUpdateMessage();
    }

    const trimmedContent = getMessageContentForSave(messageContent, pendingAttachments);
    const hasAttachments = attachmentsToSave(pendingAttachments)?.length > 0;

    if (!trimmedContent && !hasAttachments) {
      alert("Please enter a message");
      return;
    }

    if (isSending) {
      return;
    }

    setIsSending(true);

    try {
      if (!user?.uid || !messagesRef) {
        throw new Error("Missing required dependencies: user or messagesRef");
      }

      const messageUserRef = userRef || doc(db, "users", user.uid);
      const currentTime = new Date();

      const messageData = {
        sent_by: messageUserRef,
        content: trimmedContent,
        status: "pending_review",
        created_at: currentTime,
        unread: true,
      };

      let messageRef;

      const attachments = attachmentsToSave();
      const messageDataWithAttachments = {
        ...messageData,
        attachments,
      };

      if (draft?.id) {
        messageRef = doc(messagesRef, draft.id);

        await updateDoc(messageRef, messageDataWithAttachments);
      } else {
        messageRef = doc(messagesRef);
        await setDoc(messageRef, messageDataWithAttachments);
      }
      
      if (globalConversationReference) {
        sendNotification(globalConversationReference, "").catch((error) => {
          console.error("Failed to send notification:", error);
        });
      }

      // Clear states
      setMessageContent("");
      setDraft(null);
      setHasDraftContent(false);
      setIsEditing(false);
      clearPendingAttachments();

      const messageWithId = {
        ...messageDataWithAttachments,
        id: messageRef.id,
        sent_by: { id: user.uid },
      };

      setAllMessages((prev) => [...prev, messageWithId]);

      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    } catch (error) {
      if (error?.code === "permission-denied") {
        alert(
          "Permission denied. Please check your access rights to this conversation.",
        );
      } else if (error?.code === "unauthenticated") {
        alert("You are not authenticated. Please log in again.");
      } else {
        alert("Failed to send message. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleRequireLogin = () => {
    const shouldLogin = window.confirm(
      "You must be logged in to send media. Go to login now?"
    );

    if (shouldLogin) {
      router.push("/login");
    }
  };

  const handleAudioRecordComplete = ({ blob, fileName }) => {
    const audioFile = new File(
      [blob],
      fileName || `voice_${Date.now()}.webm`,
      {
        type: blob?.type || "audio/webm",
      },
    );

    // TODO: record them at the desired bitrate from AudioRecorder instead of recording high-quality audio
    // and recompressing it in the following function. Maybe propagate a skipCompression argument?
    handleAddAttachment({ file: audioFile, mediaType: "audio" });
    setShowAudioRecorder(false);
  };

  const handleCloseMessage = async () => {
    if (isSendButtonDisabled || isUpdatingFirebase) {
      return;
    }

    const trimmedMessageContent = messageContent.trim();
    const hasAttachments = pendingAttachments.length > 0;

    if (editingMessageId) {
      if (trimmedMessageContent !== editingMessageOriginalContent.trim()) {
        setShowCloseDialog(true);
      } else {
        setMessageContent("");
        setEditingMessageId(null);
        setEditingMessageOriginalContent("");
        setQueuedAttachmentDeletes([]);
        setIsEditing(false);
        setHasDraftContent(false);
        setSelectedMessageId(null);
        clearPendingAttachments();
        router.push("/inbox");
      }
      return;
    }

    if (isEditing) {
      try {
        await saveDraft(messageContent);
      } catch (error) {
        logError(error, {
          description: "Failed to save state before close:",
        });
      }
    }

    if (trimmedMessageContent.length > 0 || hasAttachments) {
      setShowCloseDialog(true);
    } else {
      router.push("/inbox");
    }
  };

  const handleConfirmClose = async () => {
    setShowCloseDialog(false);

    if (editingMessageId) {
      setMessageContent("");
      setEditingMessageId(null);
      setEditingMessageOriginalContent("");
      setQueuedAttachmentDeletes([]);
      setIsEditing(false);
      setHasDraftContent(false);
      setSelectedMessageId(null);
    }

    clearPendingAttachments();
    router.push("/inbox");
  };

  const handleContinueEditing = () => {
    setShowCloseDialog(false);
    setIsEditing(true);

    setTimeout(() => {
      textAreaRef.current?.focus();
    }, 100);
  };

  // FIXED: Save draft before switching to edit mode
  const handleEditMessage = async (message) => {
    if (
      message.status !== "pending_review" ||
      message.sent_by?.id !== user?.uid
    ) {
      return;
    }

    if (messageContent.trim().length > 0 && !editingMessageId) {
      try {
        await saveDraft(messageContent);
      } catch (error) {
        console.error("❌ Failed to save draft before editing message:", error);

        const confirmSwitch = window.confirm(
          "Failed to save your draft. Do you want to continue editing this message? Your current draft may be lost.",
        );

        if (!confirmSwitch) {
          return;
        }
      }
    }

    setEditingMessageId(message.id);
    setEditingMessageOriginalContent(message.content);
    setMessageContent(message.content);
    const restoredAttachments = normalizeDraftAttachments(
      messageAttachments(message),
    );
    setPendingAttachments(restoredAttachments);
    setQueuedAttachmentDeletes([]);
    setIsEditing(true);
    setHasDraftContent(
      Boolean(message.content?.trim()) || restoredAttachments.length > 0,
    );
    setSelectedMessageId(null);

    setTimeout(() => {
      textAreaRef.current?.focus();
      if (textAreaRef.current) {
        const length = textAreaRef.current.value.length;
        textAreaRef.current.setSelectionRange(length, length);
      }
    }, 100);
  };

  const handleReplyClick = async () => {
    setIsEditing(true);

    // Preserve local unsent/in-flight attachment state instead of replacing
    // it with potentially stale draft data from Firestore.
    const hasLocalComposerState =
      Boolean(messageContent.trim()) || pendingAttachments.length > 0;

    if (hasLocalComposerState) {
      setHasDraftContent(true);

      setTimeout(() => {
        textAreaRef.current?.focus();
        if (textAreaRef.current) {
          const length = textAreaRef.current.value.length;
          textAreaRef.current.setSelectionRange(length, length);
        }
      }, 100);

      return;
    }

    if (!draft?.id) {
      try {
        const messageUserRef = userRef || doc(db, "users", user?.uid);
        const existingDraft = await fetchDraft(id, messageUserRef, false);

        if (existingDraft) {
          const hydratedDraftAttachments = await hydrateAttachmentUrls(
            normalizeDraftAttachments(existingDraft.attachments || []),
          );

          setDraft(existingDraft);
          setMessageContent(existingDraft.content || "");
          const restoredAttachments = hydratedDraftAttachments;
          setPendingAttachments(restoredAttachments);
          setHasDraftContent(
            Boolean(existingDraft.content?.trim()) || restoredAttachments.length > 0,
          );
        } else {
          setMessageContent("");
          setPendingAttachments([]);
          setHasDraftContent(false);
        }
      } catch (error) {
        console.error("❌ Error fetching draft:", error);
        setMessageContent("");
        setPendingAttachments([]);
        setHasDraftContent(false);
      }
    } else {
      setMessageContent(draft.content || "");
      const restoredAttachments = await hydrateAttachmentUrls(
        normalizeDraftAttachments(draft.attachments || []),
      );
      setPendingAttachments(restoredAttachments);
      setHasDraftContent(
        Boolean(draft.content?.trim()) || restoredAttachments.length > 0,
      );
    }

    setTimeout(() => {
      textAreaRef.current?.focus();
      if (textAreaRef.current) {
        const length = textAreaRef.current.value.length;
        textAreaRef.current.setSelectionRange(length, length);
      }
    }, 100);
  };

  usePageAnalytics(`/conversation/[id]`);

  useEffect(() => {
    const auth = getAuth();
    let redirectTimer = null;

    const clearSensitiveState = () => {
      setUserRef(null);
      setUserLocation("");
      setProfileImage("");

      setAllMessages([]);
      setRecipients([]);
      setRecipientName("");
      setMessagesRef(null);
      setGlobalConversationReference(null);

      setMessageContent("");
      setDraft(null);
      setHasDraftContent(false);
      clearPendingAttachments();

      setEditingMessageId(null);
      setEditingMessageOriginalContent("");

      setShowCloseDialog(false);
      setSelectedMessageId(null);
      setIsEditing(false);

      setIsSending(false);
      setIsSendButtonDisabled(true);
      setIsUpdatingFirebase(false);

      setShowReportPopup(false);
      setShowConfirmReportPopup(false);
      setReportContent(null);
      setReportSender(null);
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);

      if (!currentUser) {
        if (redirectTimer) {
          clearTimeout(redirectTimer);
        }

        clearSensitiveState();

        redirectTimer = setTimeout(() => {
          if (!auth.currentUser) {
            router.replace("/login");
          }
        }, 400);

        return;
      }

      if (redirectTimer) {
        clearTimeout(redirectTimer);
        redirectTimer = null;
      }

      const initializeData = async () => {
        try {
          const conversationRef = doc(db, "conversations", id);
          const conversationDoc = await getDoc(conversationRef);

          if (!conversationDoc.exists()) {
            console.error("❌ Conversation does not exist:", id);
            return;
          }

          const userDocRef = doc(db, "users", currentUser.uid);
          setUserRef(userDocRef);

          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();

            if (userData.location) {
              setUserLocation(userData.location);
            }

            try {
              const downloaded = await getUserPfp(currentUser.uid);
              setProfileImage(downloaded || "");
            } catch (error) {
              console.error("Failed to load profile image", error);
              setProfileImage("");
            }
          }

          const fetchedRecipients = await fetchRecipients(id);
          setRecipients(fetchedRecipients || []);

          if (fetchedRecipients?.length > 0) {
            const rn = `${fetchedRecipients[0].first_name} ${fetchedRecipients[0].last_name}`;
            setRecipientName(rn);
          }

          const lRef = collection(conversationRef, "messages");
          setMessagesRef(lRef);
          setGlobalConversationReference(conversationRef);

          const draftData = await fetchDraft(id, userDocRef, false);

          if (draftData && draftData.status === "draft") {
            const hydratedDraftAttachments = await hydrateAttachmentUrls(
              normalizeDraftAttachments(draftData.attachments || []),
            );

            setDraft(draftData);

            const draftContent = draftData.content || "";
            const hasContent = Boolean(draftContent.trim());
            const restoredAttachments = hydratedDraftAttachments;
            const hasAttachments = restoredAttachments.length > 0;

            setMessageContent(draftContent);
            setPendingAttachments(restoredAttachments);
            setHasDraftContent(hasContent || hasAttachments);

            if (hasContent || hasAttachments) {
              setIsEditing(true);
              setTimeout(() => {
                textAreaRef.current?.focus();
                const length = draftContent.length;
                textAreaRef.current?.setSelectionRange(length, length);
              }, 100);
            } else {
              setIsEditing(false);
            }
          } else {
            setMessageContent("");
            setDraft(null);
            setHasDraftContent(false);
          }

          if (fetchedRecipients?.length > 0) {
            const userRefDoc = doc(db, "users", currentUser.uid);

            const myMessagesQuery = query(
              lRef,
              where("sent_by", "==", userRefDoc),
              orderBy("created_at", "asc")
            );

            const sentMessagesQuery = query(
              lRef,
              where("status", "==", "approved"),
              orderBy("created_at", "asc")
            );

            const [mySnap, sentSnap] = await Promise.all([
              getDocs(myMessagesQuery),
              getDocs(sentMessagesQuery),
            ]);

            const all = [];

            const pushDocs = (snap) => {
              snap.forEach((docSnap) => {
                if (docSnap.data().status === "draft") {
                  return;
                }

                const msg = {
                  id: docSnap.id,
                  ...docSnap.data(),
                  created_at: docSnap.data().created_at?.toDate(),
                  drafted_at: docSnap.data().drafted_at?.toDate(),
                };

                if (msg.sent_by?.path) {
                  msg.sent_by = {
                    id: msg.sent_by.path.split("/")[1],
                  };
                }

                all.push(msg);
              });
            };

            pushDocs(mySnap);
            pushDocs(sentSnap);

            const unique = Array.from(
              new Map(all.map((m) => [m.id, m])).values()
            );

            const sortedMessages = unique.sort(
              (a, b) => a.created_at - b.created_at
            );

            const messagesWithSenderInfo = await Promise.all(
              sortedMessages.map(async (message) => {
                if (message.sent_by?.id !== currentUser.uid) {
                  const recipient = fetchedRecipients.find(
                    (r) => r.id === message.sent_by?.id
                  );

                  if (recipient) {
                    message.senderLocation = recipient.location || "";
                  }

                  if (message?.unread) {
                    await updateDoc(doc(lRef, message.id), {
                      unread: false,
                    });
                  }
                }

                const hydratedAttachments = await hydrateAttachmentUrls(
                  normalizeMessageAttachments(message),
                );

                return {
                  ...message,
                  attachments: hydratedAttachments,
                };
              })
            );

            setAllMessages(messagesWithSenderInfo);
          } else {
            setAllMessages([]);
          }
        } catch (error) {
          console.error("❌ INITIALIZATION ERROR:", error);
          logError(error, {
            description: "INITIALIZATION ERROR:",
          });
        } finally {
          setIsLoading(false);
          setIsSendButtonDisabled(false);
        }
      };

      await initializeData();
    });

    return () => {
      unsubscribe();

      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [id, router]);

  useEffect(() => {
    return () => {
      if (draftTimer) {
        clearTimeout(draftTimer);
      }
    };
  }, [draftTimer]);

  useEffect(() => {
    scrollToBottom();
  }, [allMessages, isEditing]);

  if (isLoading) {
    return <MessagesSkeleton />;
  }

  const selectMessage = (messageId) => {
    setSelectedMessageId(messageId === selectedMessageId ? null : messageId);
  };

  const truncateMessage = (message) => {
    if (message.length <= 30) {
      return message;
    }
    return `${message.substring(0, 30)}...`;
  };

  const getSenderLocation = (message) => {
    const isSenderUser =
      message.sent_by?.id === user?.uid ||
      message.sent_by?.path === `users/${user?.uid}`;

    if (isSenderUser) {
      return userLocation || "";
    }

    return message.senderLocation || recipients[0]?.location || "";
  };

  const canSendMessage = () => {
    return (
      (messageContent.trim().length > 0 || pendingAttachments.length > 0) &&
      !isSending &&
      !hasUploadingAttachments
    );
  };

  return (
    <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
      <PageContainer
        width="compactXS"
        padding="none"
        center={false}
        className="min-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        {/* ===== HEADER ===== */}
        <div className="bg-blue-100 p-4 flex items-center justify-between border-b min-h-[64px]">
          <button
            onClick={handleCloseMessage}
            className="text-gray-700 cursor-pointer hover:text-gray-900 pl-3"
            title="Close conversation"
          >
            X
          </button>

          {/* Keep header layout stable (no mount/unmount jumps) */}
          <div className="w-10 h-10 flex items-center justify-center">
            {isSendButtonDisabled || isUpdatingFirebase ? (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <button
                onClick={handleSendMessage}
                disabled={!isEditing || !canSendMessage()}
                className={`p-1 ${
                  !isEditing || !canSendMessage()
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-blue-200 rounded"
                }`}
                style={{ visibility: isEditing ? "visible" : "hidden" }}
              >
                <Image
                  src="/send-message-icon.png"
                  alt={editingMessageId ? "Update message" : "Send message"}
                  width={30}
                  height={30}
                  className="object-contain"
                  id="send-message"
                />
              </button>
            )}
          </div>
        </div>

        {/* ===== EDITING BANNER ===== */}
        {editingMessageId && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 min-h-[44px] flex items-center justify-between">
            <div className="flex items-center text-amber-800 text-sm min-w-0">
              <span className="mr-2 shrink-0" aria-hidden="true">
                ✏️
              </span>
              <span className="whitespace-nowrap truncate">
                Editing message
              </span>
            </div>

            <button
              onClick={async () => {
                const messageUserRef = userRef || doc(db, "users", user?.uid);

                try {
                  const existingDraft = await fetchDraft(id, messageUserRef, false);
                  const restoredDraftAttachments = await hydrateAttachmentUrls(
                    normalizeDraftAttachments(existingDraft?.attachments || []),
                  );
                  const hasRestoredDraftContent =
                    Boolean(existingDraft?.content?.trim()) ||
                    restoredDraftAttachments.length > 0;

                  if (existingDraft && hasRestoredDraftContent) {
                    setDraft(existingDraft);
                    setMessageContent(existingDraft.content);
                    setPendingAttachments(restoredDraftAttachments);
                    setQueuedAttachmentDeletes([]);
                    setHasDraftContent(hasRestoredDraftContent);
                    setIsEditing(true);
                  } else {
                    setMessageContent("");
                    setDraft(null);
                    clearPendingAttachments();
                    setQueuedAttachmentDeletes([]);
                    setHasDraftContent(false);
                    setIsEditing(false);
                  }
                } catch {
                  setMessageContent("");
                  setDraft(null);
                  clearPendingAttachments();
                  setQueuedAttachmentDeletes([]);
                  setHasDraftContent(false);
                  setIsEditing(false);
                }

                setEditingMessageId(null);
                setEditingMessageOriginalContent("");
                setSelectedMessageId(null);
              }}
              className="text-amber-600 hover:text-amber-800 text-sm underline shrink-0 whitespace-nowrap"
            >
              {/* Keep banner height consistent while editing */}
              Cancel
            </button>
          </div>
        )}

        {/* ===== MESSAGES ===== */}
        <div className="flex-1 overflow-y-auto bg-gray-100">
          {allMessages.map((message, index) => {
            const messageId = message.id;
            const isSelected = selectedMessageId === messageId;
            const isSenderUser = message.sent_by?.id === user?.uid;
            const location = getSenderLocation(message);

            return (
              <div key={messageId}>
                <div
                  className={`border-b border-gray-200 ${
                    isSelected ? "bg-white" : "bg-gray-50"
                  } ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <div
                    className="px-4 py-3"
                    onClick={() => selectMessage(messageId)}
                  >
                    <div className="flex items-center">
                      <div className="shrink-0">
                        <ProfileImage
                          photo_uri={
                            isSenderUser
                              ? profileImage
                              : recipients[0]?.pfp
                          }
                          name={isSenderUser ? "Me" : recipients[0]?.first_name}
                          size={12}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-bold text-black">
                            {isSenderUser
                              ? "Me"
                              : `${recipients[0]?.first_name} ${recipients[0]?.last_name}`}
                          </span>
                          {location && (
                            <span className="text-black ml-2 text-sm">
                              {location}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-800">
                          {isSelected ? "" : truncateMessage(message.content)}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="text-gray-500 text-sm">
                          {formatTimestamp(message.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="px-4 pb-3">
                      <div className="ml-16 relative">
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {message.content}
                        </p>

                        {messageAttachments(message).length > 0 && (
                          <div className="mt-3 space-y-2">
                            {messageAttachments(message)
                          .filter((attachment) => {
                            // Allow preview blobs (local File previews) or validated remote URLs
                            const src = attachment?.url || attachment?.previewUrl;
                            if (!src) return false;
                            // If this is a local preview (no remote url), allow it
                            if (attachment?.previewUrl && !attachment?.url) return true;
                            return isAllowedMediaUrl(src);
                          })
                          .map((attachment) => (
                              <button
                                key={attachment.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAttachment(attachment);
                                }}
                                className="w-full flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-left hover:bg-emerald-100 transition-colors"
                              >
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
                                  {getAttachmentIcon(attachment.mediaType)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold text-emerald-900 truncate">
                                    {attachment.name}
                                  </div>
                                  <div className="text-xs text-emerald-700">
                                    {formatFileSize(attachment.size)}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {message.media_url && isAllowedMediaUrl(message.media_url) ? (
                          <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                            {message.media_type === "image" ? (
                              <img
                                src={message.media_url}
                                alt="Shared media"
                                className="w-full h-auto object-cover"
                              />
                            ) : message.media_type === "video" ? (
                              <video
                                src={message.media_url}
                                controls
                                className="w-full h-auto max-h-[320px] bg-black"
                              />
                            ) : message.media_type === "audio" ? (
                              <div className="p-3">
                                <audio
                                  src={message.media_url}
                                  controls
                                  className="w-full"
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : message.media_url ? (
                          <div className="mt-3 p-3 text-sm text-gray-500">
                            Media from this source is not allowed.
                          </div>
                        ) : null}

                        <div className="flex items-center justify-end w-full">
                          {!isSenderUser && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportSender(message.sent_by?.id);
                                setReportContent(message.content);
                                setShowReportPopup(true);
                                logButtonEvent(
                                  "Report message clicked!",
                                  "/conversation/[id]",
                                );
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                            >
                              <FaExclamationCircle className="mr-1" size={10} />
                              Report
                            </button>
                          )}

                          {/* STATUS BANNER */}
                          {isSenderUser && (
                            <>
                              {/* REJECTED */}
                              {isSenderUser &&
                                message.status === "rejected" && (
                                  <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-2">
                                    <div className="flex items-start text-red-700 font-semibold">
                                      <AlertTriangle className="w-5 h-5 mr-2 mt-0.5" />
                                      <div>
                                        <div>
                                          Your message was not sent for the
                                          following reason:
                                        </div>

                                        {message.rejection_reason && (
                                          <div className="text-sm font-semibold mt-2">
                                            {message.rejection_reason}
                                          </div>
                                        )}

                                        {message.rejection_feedback && (
                                          <div className="text-sm text-red-500 mt-1 whitespace-pre-wrap">
                                            {message.rejection_feedback}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                              {/* APPROVED → GREEN CHECK */}
                              {message.status === "approved" && (
                                <span className="text-green-500 text-lg font-bold flex justify-end w-full">
                                  ✓
                                </span>
                              )}

                              {/* PENDING REVIEW → GRAY DASHED CHECK */}
                              {message.status === "pending_review" && (
                                <div className="flex items-center justify-end w-full">
                                  {/* Wrapper so the check can stick to the button */}
                                  <div className="relative inline-flex">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();

                                        handleEditMessage(message);
                                        logButtonEvent(
                                          "Edit message clicked!",
                                          "/conversation/[id]",
                                        );
                                      }}
                                      className="absolute -bottom-0.5 right-7 bg-blue-600 text-white text-xs px-2 py-1 rounded-full transition-colors hover:bg-blue-700"
                                      title="Edit message"
                                    >
                                      Edit
                                    </button>

                                    {/* Check badge in bottom-right of the button */}
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-400 border-dashed flex items-center justify-center">
                                      <span className="text-gray-400 text-xs font-bold">
                                        ✓
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ===== REPLY ===== */}
        <div className="bg-white">
          <div className="flex items-center justify-center px-4 py-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePickImage}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                title="Send photo"
              >
                <ImageIcon size={18} className="text-slate-600" />
              </button>
              <button
                type="button"
                onClick={handlePickVideo}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                title="Send video"
              >
                <Film size={18} className="text-slate-600" />
              </button>
              <button
                type="button"
                onClick={() => setShowAudioRecorder((prev) => !prev)}
                className={`p-2 rounded-full transition-colors ${
                  showAudioRecorder
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                title="Send voice message"
              >
                <Mic size={18} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center">
              <Image
                src="/arrow-left.png"
                alt="Back"
                width={20}
                height={20}
                className="mr-2"
              />
              <span className="text-gray-700">To {recipientName}</span>
            </div>
          </div>

          {showAudioRecorder && (
            <div className="px-4 pb-2">
              <AudioRecorder
                onRecordingComplete={handleAudioRecordComplete}
                onRequireLogin={handleRequireLogin}
              />
            </div>
          )}

          {pendingAttachments.length > 0 && (
            <div className="px-4 pb-3 space-y-2">
              {pendingAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
                    {getAttachmentIcon(attachment.mediaType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-emerald-900 truncate">
                      {attachment.name}
                    </div>
                    <div className="text-xs text-emerald-700">
                      {formatFileSize(attachment.size)}
                      {attachment.uploadStatus === "compressing" && " • Compressing..."}
                      {attachment.uploadStatus === "uploading" && " • Uploading..."}
                      {attachment.uploadStatus === "error" && " • Upload failed"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRequestDeleteAttachment(attachment)}
                    className="text-emerald-700 hover:text-emerald-900"
                    title="Delete attachment"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoFileChange}
          />

          {!isEditing ? (
            <div className="p-4">
              <div
                className="w-full p-3 border border-cyan-500 rounded-md text-gray-500 cursor-text"
                onClick={handleReplyClick}
              >
                {hasDraftContent
                  ? "Continue draft..."
                  : "Reply to the message..."}
              </div>
            </div>
          ) : (
            <div className="p-4 relative" style={{ height: "40vh" }}>
              <textarea
                ref={textAreaRef}
                className="w-full h-full p-3 focus:outline-none resize-none text-black bg-white"
                placeholder={
                  editingMessageId
                    ? "Edit your message..."
                    : "Write your message..."
                }
                value={messageContent}
                onChange={handleMessageChange}
              />
            </div>
          )}
        </div>

        {/* ===== POPUPS ===== */}
        {showCloseDialog && (
          <Dialog
            isOpen={showCloseDialog}
            onClose={handleContinueEditing}
            variant="closeDialog"
            closeOnOverlay={false}
            containerClassName="max-h-[80vh] overflow-auto"
            title={editingMessageId ? "Discard changes?" : "Close this message?"}
            subtitle={
              editingMessageId
                ? "Your changes will not be saved."
                : "Your message will be saved as a draft."
            }
            buttons={[
              {
                text: "Stay on page",
                onClick: handleContinueEditing,
                variant: "primary",
                className: "flex-1",
              },
              {
                text: editingMessageId ? "Discard" : "Close",
                onClick: handleConfirmClose,
                variant: "secondary",
                className: "flex-1",
              },
            ]}
          />
        )}
        {showAttachmentDeleteDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="bg-gray-100 p-6 rounded-2xl shadow-lg w-[345px] mx-auto max-h-[80vh] overflow-auto">
              <h2 className="text-xl font-semibold mb-1 text-black">
                Delete Attachment?
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Are you sure you want to delete this attachment? This is permanent action!
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmDeleteAttachment}
                  className="flex-1 bg-[#4E802A] text-white py-3 px-4 rounded-2xl"
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    setAttachmentToDelete(null);
                    setShowAttachmentDeleteDialog(false);
                  }}
                  className="flex-1 bg-gray-200 text-[#4E802A] py-3 px-4 rounded-2xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
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

        {showReportPopup && (
          <ReportPopup
            setShowPopup={setShowReportPopup}
            setShowConfirmReportPopup={setShowConfirmReportPopup}
            sender={reportSender}
            content={reportContent}
          />
        )}

        {showConfirmReportPopup && (
          <ConfirmReportPopup setShowPopup={setShowConfirmReportPopup} />
        )}
      </PageContainer>
    </PageBackground>
  );
}
