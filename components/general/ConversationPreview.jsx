import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { formatTimestamp } from "@/app/utils/dateHelpers";

const ConversationPreview = ({
  profileImage,
  name,
  country,
  lastMessage,
  hasAttachments = false,
  lastMessageDate,
  conversationId,
  status,
  isRecipient,
  unread = false,
  isAdmin = false,
  onClick = () => {},
  id,
}) => {
  const router = useRouter();
  const imageSrc = profileImage || "/usericon.png";

  const handleProfileClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!id) return;
    router.push(`/profile-view/${id}`);
  };

  // Returns the appropriate status icon based on message status
  const getStatusIcon = () => {
    if (status === "rejected") {
      return (
        <AlertTriangle
          className="text-red-500 w-6 h-6"
          title="Rejected"
          aria-label="Rejected"
        />
      );
    }

    if (status === "approved") {
      return (
        <CheckCircle
          className="text-green-500 w-6 h-6"
          title="Approved"
          aria-label="Approved"
        />
      );
    }

    if (status === "pending_review") {
      return (
        <div
          className="relative w-6 h-6"
          title="Pending review"
          aria-label="Pending review"
        >
          <div className="absolute inset-0 rounded-full border border-dashed border-gray-400" />
          <CheckCircle className="absolute inset-0 m-auto w-4 h-4 text-gray-400" />
        </div>
      );
    }

    return null;
  };

  const rejectedText = isAdmin
    ? "Message was rejected"
    : "Your message was rejected";

  const previewMessage = lastMessage || (hasAttachments ? "Attachments" : "");

  const cardContent = (
    <div
      className={`w-full p-2 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${
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
        <div
          onClick={handleProfileClick}
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleProfileClick(e)}
        >
          <Image
            src={imageSrc}
            alt={`${name}'s profile`}
            className="w-12 h-12 rounded-full object-cover mr-4"
            width={48}
            height={48}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {status === "draft" && (lastMessage !== "" || hasAttachments) && (
                  <span
                  className="text-red-500 mr-1"
                  title="Draft"
                  aria-label="Draft"
                >
                  [Draft]
                </span>
                        )}
                {name}
              </div>

              <div className="text-sm text-gray-500 truncate">{country}</div>
            </div>

            <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
              {formatTimestamp(lastMessageDate)}
            </div>
          </div>

          <div
            className={`mt-2 text-sm text-gray-700 truncate ${
              isRecipient && unread ? "font-semibold" : ""
            }`}
          >
            {previewMessage ? (
              <div className="flex items-start">
                {getStatusIcon() && (
                  <div className="mr-2 mt-0.5 shrink-0">{getStatusIcon()}</div>
                )}

                <div className="flex-1 min-w-0 truncate">
                  {status === "rejected" && (
                    <div className="font-normal text-red-500">
                      {rejectedText}
                    </div>
                  )}
                  {previewMessage}
                </div>
              </div>
            ) : (
              <div className="flex items-start">
                {getStatusIcon() && (
                  <div className="mr-2 mt-0.5 shrink-0">{getStatusIcon()}</div>
                )}

                {status === "rejected" && (
                  <div className="flex-1 font-normal text-red-500">
                    {rejectedText}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isAdmin) {
    return (
      <div onClick={onClick} className="w-full text-left">
        {cardContent}
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="w-full" role="button" aria-disabled="true">
        {cardContent}
      </div>
    );
  }

  return <Link href={`/conversation/${conversationId}`}>{cardContent}</Link>;
};

export default ConversationPreview;
