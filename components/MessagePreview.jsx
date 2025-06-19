import React from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";

const MessagePreview = ({
  profileImage,
  name,
  country,
  lastMessage,
  lastMessageDate,
  letterboxId,
  status,
  isRecipient,
}) => {
  const imageSrc = profileImage || "/usericon.png";

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
    if (status === "approved") {
      return <CheckCircle className="text-green-500 w-6 h-6" />;
    }
    if (status === "pending") {
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
    <a
      href={`/letters/${letterboxId}`}
      className={`block p-4 rounded-xl shadow hover:shadow-md transition-shadow duration-200 cursor-pointer ${
        status === "rejected"
          ? "bg-red-50"
          : isRecipient
          ? "bg-green-50"
          : "bg-white"
      }`}
    >
      <div className="flex items-start">
        <img
          src={imageSrc}
          alt={`${name}'s profile`}
          className="w-12 h-12 rounded-full object-cover mr-4"
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
        className={`mt-2 text-sm text-gray-700 leading-snug ${
          isRecipient ? "font-semibold" : ""
        }`}
      >
        {lastMessage ? (
          <div className="relative">
            <div className="float-left mr-2 mt-0.5">{getStatusIcon()}</div>
            {status === "rejected" && <div className="font-normal text-red-500">Your letter was rejected</div>}
            <div className="overflow-hidden">{lastMessage}</div>
          </div>
        ) : (
          // No message: Show icon normally (not floated)
          status && (
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              {status === "rejected" && <div className="font-normal text-red-500">Your letter was rejected</div>}
            </div>
          )
        )}
      </div>
    </a>
  );
};

export default MessagePreview;