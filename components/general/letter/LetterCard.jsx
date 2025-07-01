import ProfileImage from "../ProfileImage";
import { formatDisplayDate } from "../../../app/utils/timestampToDate";
export default function LetterCard({ letter, uid }) {
  console.log("LetterCard", letter);
  const is_sender = letter?.recipients[0]?.id !== uid;
  const date = formatDisplayDate(letter?.letters[0]?.timestamp);
  return (
    <a 
      href={`/letters/${letter.id}`} 
      className={'flex items-center p-4 mb-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer ' + (is_sender ? 'bg-white' : 'bg-green-100')}
    >
      <div className="flex-grow">
        {letter.recipients?.map(rec => (
          <div key={rec.id} className='flex mt-3'>
            <ProfileImage photo_uri={rec?.photo_uri} first_name={rec?.first_name} />
            <div className="flex flex-col">
              <div className="flex gap-x-2">
                {letter.letters[0].status === "draft" && <h4 className="text-md text-red-600">[DRAFT]</h4>}
                <h3 className="font-semibold text-gray-800">{rec.first_name} {rec.last_name}</h3>
                <h3 className="font-semibold text-gray-400">{rec.country}</h3>
              </div>
              <div className='flex gap-x-2 mt-1'>
                <h4 className={(is_sender ? "" : "font-bold ") + "text-gray-600 text-sm nowrap"}>{letter.letters[0].content ?? ''}</h4>
                <span className="text-xs text-gray-400">{letter.letters[0].received}</span>
              </div>
            </div>
            <div className="ml-[auto]">
            <h4 className="text-gray-600 text-sm nowrap">{date.toString()}</h4>
            </div>
          </div>
        ))}
      </div>
    </a>
  );
} 