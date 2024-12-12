import { useState } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import ReportPopup from "./ReportPopup";
import ImageViwer from "../ImageViewer";
import ConfirmReportPopup from "./ConfirmReportPopup";

import Image from "next/image";

const LetterCard = ({
  id,
  attachments,
  createdAt,
  content,
  user,
  unread = false,
}) => {
  const [showFullMessage, setShowFullMessage] = useState(false);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [showConfirmReportPopup, setShowConfirmReportPopup] = useState(false);

  const formatDate = (createdAt) => {
    const date = new Date(createdAt * 1000);
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${formattedDate} ${formattedTime}`;
  };

  return (
    <main>
      {showReportPopup && (
        <ReportPopup
          setShowPopup={setShowReportPopup}
          setShowConfirmReportPopup={setShowConfirmReportPopup}
          user={user}
          content={content}
          id={id}
        />
      )}
      {showConfirmReportPopup && (
        <ConfirmReportPopup setShowPopup={setShowConfirmReportPopup} />
      )}
      <div
        className={`${
          unread ? "bg-green-100" : "bg-white"
        } p-5 border border-b-gray-300`}
      >
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Image
              height={100}
              width={100}
              src={user.photo_uri}
              alt="profile"
              className="rounded-full h-8 w-8 image-cover"
            />
            <div>
              <h3 className="font-semibold">{`${user.first_name} ${user.last_name}`}</h3>
              <p className="text-gray-600">{user.country}</p>
            </div>
          </div>
          <div>
            <p className="text-xs">{formatDate(createdAt)}</p>
          </div>
        </div>
        <section className="px-5">
          <div className="flex justify-end mb-2">
            <FaExclamationCircle
              className="cursor-pointer"
              onClick={() => setShowReportPopup(true)}
            />
          </div>
          {attachments && attachments.length > 0 && (
            <div className="flex gap-2 mb-1">
              <ImageViwer styleClass="h-8 w-8" imageSources={attachments} />
            </div>
          )}

          <p
            onClick={() => setShowFullMessage((prev) => !prev)}
            className={`${
              !showFullMessage ? "line-clamp-2" : ""
            } text-sm cursor-pointer`}
          >
            {content}
          </p>
        </section>
      </div>
    </main>
  );
};

export default LetterCard;
