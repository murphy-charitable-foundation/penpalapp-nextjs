import React from "react";

const MessagePreview = ({
  profileImage,
  name,
  country,
  lastMessage,
  lastMessageDate,
  letterboxId,
  status,
  className
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

  return (
    <a
      href={`/letters/${letterboxId}`}
      className={`block p-4 bg-white rounded-xl shadow hover:shadow-md transition-shadow duration-200 cursor-pointer ${className}`}
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
              {status === "draft" && <span className="text-red-500 mr-1">[Draft]</span>}
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
      <div className="mt-2 text-sm text-gray-700 truncate">{lastMessage}</div>
    </a>
  );
};

export default MessagePreview;
