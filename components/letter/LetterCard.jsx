import { useState, useRef } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { IoIosAttach, IoMdSend } from "react-icons/io";
import ReportPopup from "./ReportPopup";
import ImageViwer from "../ImageViewer";
import ConfirmReportPopup from "./ConfirmReportPopup";
import Button from "../Button";
import Image from "next/image";

const LetterCard = ({ unread = false }) => {
  const [textArea, setTextArea] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showFullMessage, setShowFullMessage] = useState(false);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [showConfirmReportPopup, setShowConfirmReportPopup] = useState(false);

  const inputFile = useRef(null);

  const onSend = () => {
    console.log(inputFile.current.files);
    console.log(textArea);
  };

  const handleFileChange = () => {
    const files = [];
    Object.values(inputFile.current.files).map((file) => files.push(file.name));
    setAttachedFiles(files);
  };

  return (
    <main>
      {showReportPopup && (
        <ReportPopup
          setShowPopup={setShowReportPopup}
          setShowConfirmReportPopup={setShowConfirmReportPopup}
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
              src="/usericon.png"
              alt="profile"
              className="rounded-full h-8 w-8 image-cover"
            />
            <div>
              <h3 className="font-semibold">Louise Palermo</h3>
              <p className="text-gray-600">Uganda</p>
            </div>
          </div>
          <div>
            <p className="text-xs">15 March</p>
          </div>
        </div>
        <section className="px-5">
          <div className="flex justify-end mb-2">
            <FaExclamationCircle
              className="cursor-pointer"
              onClick={() => setShowReportPopup(true)}
            />
          </div>
          <div className="flex gap-2 mb-1">
            <ImageViwer
              styleClass="h-8 w-8"
              imageSources={[
                "/writeicon.png",
                "/discovericon.png",
                "/voiceicon.png",
              ]}
            />
          </div>
          <p
            onClick={() => setShowFullMessage((prev) => !prev)}
            className={`${
              !showFullMessage ? "line-clamp-2" : ""
            } text-sm cursor-pointer`}
          >
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Excepturi
            rerum quaerat ad amet animi fuga, eum quasi illo, minus, ut dolorem
            perspiciatis dicta illum quia corporis. Modi nostrum neque deleniti
            esse similique labore perferendis ullam rem autem. Voluptate,
            reprehenderit ad?
          </p>
          {showFullMessage && (
            <>
              <textarea
                className="text-sm focus:outline-0 p-1 w-full mt-1 border border-gray-300 rounded-md"
                type="text"
                onChange={(e) => setTextArea(e.target.value)}
                placeholder="Reply to this letter..."
              />
              <div className="flex gap-2 items-start justify-between mt-2">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div className="relative" key={index}>
                      <label className="text-xs bg-gray-100 border border-gray-300 p-1">
                        {file}
                      </label>
                    </div>
                  ))}
                </div>
                <section className="flex gap-2">
                  <div>
                    <input
                      type="file"
                      id="file"
                      ref={inputFile}
                      multiple={true}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="info"
                      size="sm"
                      onClick={() => inputFile.current.click()}
                    >
                      <IoIosAttach />
                    </Button>
                  </div>
                  <Button type="success" size="sm" onClick={onSend}>
                    <IoMdSend />
                  </Button>
                </section>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default LetterCard;
