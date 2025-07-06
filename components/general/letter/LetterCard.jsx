import ProfileImage from "../ProfileImage";

export default function LetterCard({ letter, className }) {
  return (
    <div className={className} >
      <a 
        href={`/letters/${letter.id}`} 
        className="flex items-center p-4 mb-3 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      >
        <div className="flex-grow">
          {letter.recipients?.map(rec => (
            <div key={rec.id} className='flex mt-3'>
              <ProfileImage photo_uri={rec?.photo_uri} first_name={rec?.first_name} />
              <div className="flex flex-col">
                <div className="flex gap-x-2">
                  <h3 className="font-semibold text-gray-800">{rec.first_name} {rec.last_name}</h3>
                  <h3 className="font-semibold text-gray-400">{rec.country}</h3>
                </div>
                <div className='flex gap-x-2 mt-1'>
                  {/*{letter.letters[0].status === "draft" && <h4 className="text-md">[DRAFT]</h4>}*/}
                  <h4 className="text-gray-600 text-sm nowrap">{letter.letters[0].content ?? ''}</h4>
                  <span className="text-xs text-gray-400">{letter.letters[0].received}</span>
                </div>
              </div>
              <div className="ml-[auto]">
              <h4 className="text-gray-600 text-sm nowrap">0:00 PM</h4>
              </div>
            </div>
          ))}
        </div>
      </a>
    </div>
  );
} 