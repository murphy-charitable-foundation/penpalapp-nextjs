import React, { useState } from "react";
import { CheckCircle, AlertTriangle, X } from "lucide-react";
import Image from "next/image";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../app/firebaseConfig.js"; // Adjust this import to match your Firebase config location

const MessagePreview = ({
  profileImage,
  name,
  country,
  lastMessage,
  lastMessageDate,
  letterboxId,
  status,
  isRecipient,
  unread = false,
  rejectionReason,
  rejectionFeedback,
  moderatorId,
  deleted,
  updatedAt,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const imageSrc = profileImage || "/usericon.png";

    // Approve function
    const handleApprove = async (letterboxId, moderatorId) => {
        if (!moderatorId) {
          console.warn("Cannot approve letter: moderator not signed in.");
          return;
        }
        try {
        const letterRef = doc(db, "letters", letterboxId); // Adjust collection name if needed
        
        await updateDoc(letterRef, {
            status: "sent",
            moderator_id: moderatorId,
            updated_at: serverTimestamp(),
            unread: true, // Mark as unread for recipient
        });
        
        console.log("Letter approved successfully:", letterboxId);
        setIsModalOpen(false);
        // Optional: Add success notification or callback here
        
        } catch (error) {
        console.error("Error approving letter:", error);
        // Optional: Add error notification here
        }
    };
    
    // Reject function
    const handleReject = async (letterboxId, moderatorId, rejectionReason, rejectionFeedback = "") => {
        if (!moderatorId) {
          console.warn("Cannot reject letter: moderator not signed in.");
          return;
        }
        try {
        const letterRef = doc(db, "letters", letterboxId); // Adjust collection name if needed
        
        await updateDoc(letterRef, {
            status: "rejected",
            moderator_id: moderatorId,
            rejection_reason: rejectionReason,
            rejection_feedback: rejectionFeedback,
            updated_at: serverTimestamp(),
            unread: false, // Rejected letters don't need to be unread
        });
        
        console.log("Letter rejected successfully:", letterboxId);
        setIsModalOpen(false);
        // Optional: Add success notification or callback here
        
        } catch (error) {
        console.error("Error rejecting letter:", error);
        // Optional: Add error notification here
        }
    };


  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date =
      typeof timestamp.toDate === "function"
        ? timestamp.toDate()
        : new Date(timestamp.seconds * 1000);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const timeString = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    if (date.toDateString() === today.toDateString()) {
      return `Today ${timeString}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${timeString}`;
    }
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIcon = () => {
    if (status === "rejected") {
      return <AlertTriangle className="text-red-500 w-6 h-6" />;
    }
    if (status === "sent") {
      return <CheckCircle className="text-green-500 w-6 h-6" />;
    }
    if (status === "pending_review") {
      return (
        <div className="relative w-6 h-6">
          <div className="absolute inset-0 rounded-full border border-dashed border-gray-400" />
          <CheckCircle className="absolute inset-0 m-auto w-4 h-4 text-gray-400" />
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`block w-full text-left p-4 rounded-xl shadow hover:shadow-md transition-shadow duration-200 cursor-pointer ${
          status === "rejected"
            ? "bg-red-50"
            : isRecipient && unread
            ? "bg-green-50"
            : status === "pending_review"
            ? "bg-gray-50"
            : "bg-white"
        }`}
      >
        <div className="flex items-start">
          <Image
            src={imageSrc}
            alt={`${name}'s profile`}
            className="w-12 h-12 rounded-full object-cover mr-4"
            width={36}
            height={36}
          />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-gray-900">
                  {status === "draft" && lastMessage !== "" && (
                    <span className="text-red-500 mr-1">[Draft]</span>
                  )}
                  {name}
                </div>
                <div className="text-sm text-gray-500">{country}</div>
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                {formatDate(lastMessageDate)}
              </div>
            </div>
          </div>
        </div>
        <div
          className={`mt-2 text-sm text-gray-700 truncate ${
            isRecipient && unread ? "font-semibold" : ""
          }`}
        >
          {lastMessage ? (
            <div className="flex">
              {getStatusIcon() && (
                <div className="mr-2 mt-0.5">{getStatusIcon()}</div>
              )}
              <div className="flex-1">
                {status === "rejected" && (
                  <div className="font-normal text-red-500">
                    Letter was rejected
                  </div>
                )}
                {lastMessage}
              </div>
            </div>
          ) : (
            <div className="flex">
              <div className="mr-2 mt-0.5">{getStatusIcon()}</div>
              {status === "rejected" && (
                <div className="flex-1 font-normal text-red-500">
                  Letter was rejected
                </div>
              )}
            </div>
          )}
        </div>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
              <div className="flex items-center">
                <Image
                  src={imageSrc}
                  alt={`${name}'s profile`}
                  className="w-16 h-16 rounded-full object-cover mr-4"
                  width={64}
                  height={64}
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
                  <p className="text-gray-600">{country}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    Status: {status.replace("_", " ")}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(lastMessageDate)}
                </span>
              </div>

              {status === "rejected" && rejectionReason && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-semibold mb-1">
                    Letter was rejected
                  </p>
                  <p className="text-red-600 text-sm">
                    Reason: {rejectionReason}
                  </p>
                  {rejectionFeedback && (
                    <p className="text-red-600 text-sm mt-2">
                      Feedback: {rejectionFeedback}
                    </p>
                  )}
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                  Letter Content:
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {lastMessage || "No message content"}
                </p>
              </div>

              <div className="mt-4 space-y-1">
                <div className="text-xs text-gray-500">
                  Letter ID: {letterboxId}
                </div>
                {updatedAt && (
                  <div className="text-xs text-gray-500">
                    Last Updated: {formatDate(updatedAt)}
                  </div>
                )}
                {moderatorId && (
                  <div className="text-xs text-gray-500">
                    Moderator ID: {moderatorId}
                  </div>
                )}
                {deleted && (
                  <div className="text-xs text-red-500 font-medium">
                    This letter has been deleted
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const moderatorUid = auth.currentUser?.uid;
                      if (!moderatorUid) {
                        console.warn("Cannot reject letter: auth is not ready.");
                        return;
                      }
                      handleReject(
                        letterboxId,
                        moderatorUid,
                        "Personal Information Disclosure",
                        "Optional feedback message"
                      );
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm hover:shadow flex items-center gap-2"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Deny
                  </button>
                  <button
                    onClick={() => {
                      const moderatorUid = auth.currentUser?.uid;
                      if (!moderatorUid) {
                        console.warn("Cannot approve letter: auth is not ready.");
                        return;
                      }
                      handleApprove(letterboxId, moderatorUid);
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm hover:shadow flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessagePreview;