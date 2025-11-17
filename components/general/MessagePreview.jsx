import React from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/app/utils/timestampToDate";


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
}) => {
  const imageSrc = profileImage || "/usericon.png";

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
    <a
      href={`/letters/${letterboxId}`}
      className={`block p-4 rounded-xl shadow hover:shadow-md transition-shadow duration-200 cursor-pointer ${
        status === "rejected"
          ? "bg-red-50"
          : isRecipient && unread
          ? "bg-green-50"
          : status === "pending_review"
          ? "bg-gray-50"
          : "bg-white"
      }`}>
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
        }`}>
        {lastMessage ? (
          <div className="flex">
            {getStatusIcon() && (
              <div className="mr-2 mt-0.5">{getStatusIcon()}</div>
            )}
            <div className="flex-1">
              {status === "rejected" && (
                <div className="font-normal text-red-500">
                  Your letter was rejected
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
                Your letter was rejected
              </div>
            )}
          </div>
        )}
      </div>
    </a>
  );
};

export default MessagePreview;
