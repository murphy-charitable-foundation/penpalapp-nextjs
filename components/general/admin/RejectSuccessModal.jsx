"use client";

import ProfileImage from "../ProfileImage";

export default function LetterCard({ letter, onClick }) {
  return (
    <div
      onClick={() => onClick(letter)}
      className="flex items-center p-4 mb-3 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
    >
      <div className="flex-grow">
        <div className="flex mt-3 w-full">
          <div className="flex flex-col w-full">
            
            {/* TOP ROW */}
            <div className="flex flex-row w-full">
              <ProfileImage
                photo_uri={letter?.profileImage}
                first_name={letter?.first_name}
              />

              <div className="flex flex-col ml-2 w-full">
                <div className="flex justify-between w-full">
                  <h3 className="font-semibold text-gray-800">
                    {letter.first_name} {letter.last_name}
                  </h3>

                  {/* FIX DATE CUTOFF */}
                  <h4 className="font-medium text-sm text-gray-500 ml-2 shrink-0">
                    {letter.received}
                  </h4>
                </div>

                <h3 className="text-sm text-gray-400">
                  {letter.user?.country}
                </h3>
              </div>
            </div>

            {/* MESSAGE PREVIEW */}
            <div className="mt-3">
              <p className="text-gray-600 text-sm truncate">
                {letter.content ?? ""}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
