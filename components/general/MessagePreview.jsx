import React from "react";
import { Check, X } from "lucide-react";
import Image from "next/image";

const MessagePreview = ({
  profileImage,
  name,
  country,
  lastMessage,
  lastMessageDate,
  status,
  isRecipient,
  unread = false,
  onClick,
}) => {
  const imageSrc = profileImage || "/usericon.png";

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date =
      typeof timestamp.toDate === "function"
        ? timestamp.toDate()
        : new Date(timestamp.seconds * 1000);

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIcon = () => {
  if (status === "rejected") {
    return <X className="text-secondary w-5 h-5" />;
  }
  if (status === "sent") {
    return <Check className="text-primary w-5 h-5" />;
  }
  return null;
};


  return (
    <div
      onClick={onClick}
      className={`block p-4 rounded-xl shadow hover:shadow-md transition cursor-pointer ${
      status === "rejected"
        ? "bg-secondary/10"
        : status === "sent"
        ? "bg-primary/10"
        : "bg-white"
    }`}

    >
      <div className="flex items-start">
        {/* LEFT ICON */}
        <div className="mr-3 mt-2">{getStatusIcon()}</div>

        {/* PROFILE IMAGE */}
        <Image
          src={imageSrc}
          alt={`${name} profile`}
          width={36}
          height={36}
          className="w-12 h-12 rounded-full object-cover mr-4"
        />

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0">
          {/* HEADER ROW */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {name}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {country}
              </div>
            </div>

            <div className="text-xs text-gray-400 whitespace-nowrap shrink-0">
              {formatDate(lastMessageDate)}
            </div>
          </div>

          {/* MESSAGE */}
          <div
            className={`mt-2 text-sm text-gray-700 truncate ${
              unread && isRecipient ? "font-semibold" : ""
            }`}
          >
            {lastMessage}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagePreview;
