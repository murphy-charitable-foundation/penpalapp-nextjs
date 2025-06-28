import ProfileImage from "../ProfileImage";
import close from "../../../public/close.png";
import Image from "next/image";

export default function LetterCard({ letter }) {
  return (
    <a 
      href={`/letters/${letter.id}`} 
      className="flex items-center p-4 mb-3 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
    >
      <div className="flex-grow">
          <div key={letter.id} className='flex mt-3 w-full'>
            <div className="flex flex-col w-[100%]">
              
              <div className="flex flex-row w-[100%]">
                <ProfileImage photo_uri={letter?.profileImage} first_name={letter?.first_name} />
                <div className="flex flex-col ml-2 w-full">
                  <div className="flex justify-between w-full">
                    <h3 className="font-semibold text-gray-800">
                      {letter.first_name} {letter.last_name}
                    </h3>
                    <h4 className="font-semibold mt-0.5 text-sm text-gray-600 whitespace-nowrap">
                      0:00 pm
                    </h4>
                  </div>
                  
                  <div className="">
                    <h3 className="font-semibold text-gray-400">
                      {letter.user.country}
                    </h3>
                  </div>
                </div>
              </div>
              <div className='flex flex-row gap-x-4 mt-4'>
                  {/*{letter.letters[0].status === "draft" && <h4 className="text-md">[DRAFT]</h4>}*/}
                  <div>
                    <Image src={close} width={40} height={40} />
                  </div>
                  
                  <h4 className="text-gray-600 text-sm nowrap">{letter.content ?? ''}</h4>
                  <span className="text-xs text-gray-400">{letter.received}</span>
                  
                  
              </div>
            </div>
            
          </div>

      </div>
    </a>
  );
} 