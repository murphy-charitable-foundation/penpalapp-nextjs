import React from "react";
import { Check, X } from "lucide-react";   // <-- SIMPLE ICONS
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

  // 🔥 CLEAN SIMPLE ICONS
  const getStatusIcon = () => {
    if (status === "rejected") {
      return <X className="text-red-500 w-5 h-5" />;       // ❌ simple red X
    }
    if (status === "sent") {
      return <Check className="text-green-600 w-5 h-5" />; // ✅ simple green check
    }
    return null;
  };

  return (
    <div
      onClick={onClick}
      className={`block p-4 rounded-xl shadow hover:shadow-md transition cursor-pointer ${
        status === "rejected"
          ? "bg-red-50"
          : status === "sent"
          ? "bg-green-50"
          : "bg-white"
      }`}
    >
      <div className="flex items-start">

        {/* LEFT ICON */}
        <div className="mr-3 mt-2">
          {getStatusIcon()}
        </div>

        {/* PROFILE + CONTENT */}
        <Image
          src={imageSrc}
          alt={`${name} profile`}
          width={36}
          height={36}
          className="w-12 h-12 rounded-full object-cover mr-4"
        />

        <div className="flex-1">
          <div className="flex justify-between">
            <div>
              <div className="font-semibold text-gray-900">{name}</div>
              <div className="text-sm text-gray-500">{country}</div>
            </div>
            <div className="text-xs text-gray-400">
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
