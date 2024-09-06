"use client";

import Image from "next/image";
import { getDownloadURL, ref, uploadBytesResumable } from "@firebase/storage";
import { storage } from "@/app/firebaseConfig";
import { IoMdClose } from "react-icons/io";
import { MdInsertDriveFile } from "react-icons/md";

const FileModal = ({ setIsFileModalOpen, attachments, setAttachments, id }) => {
  const handleUpload = async (file) => {
    try {
      if (file) {
        const storageRef = ref(storage, `uploads/letterbox/${id}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          },
          (error) => {
            console.error("Upload error:", error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setAttachments([...attachments, url]);
          }
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (event) => {
    const selectedFile = event.target.files[0];
    handleUpload(selectedFile);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full h-[50%]">
        <div className="flex relative">
          <button
            onClick={() => setIsFileModalOpen(false)}
            className="rounded-lg transition-colors duration-150 h-6 w-6 absolute top-0 left-0"
          >
            <IoMdClose className="h-full w-full" />
          </button>
          <h3 className="font-semibold text-xl text-gray-800 my-0 mx-auto">
            Attachements
          </h3>
        </div>
        <input
          type="file"
          hidden
          onChange={handleChange}
          id="raised-button-file"
        />
        <label
          htmlFor="raised-button-file"
          className="flex items-center border border-[#603A35] px-4 py-2 rounded-md mt-4 w-[40%] cursor-pointer"
        >
          <MdInsertDriveFile className="mr-2 fill-[#603A35] h-6 w-6" />
          Select a file
        </label>
        {attachments?.length > 0 && (
          <>
            <h3 className="font-600 mt-4">Selected</h3>
            {attachments.map((att, index) => (
              <div key={index}>
                <Image src={att} alt="attachment" width={100} height={100} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default FileModal;
