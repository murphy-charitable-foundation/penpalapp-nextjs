import ProfileImage from "../ProfileImage";

export default function LetterCard({ letter }) {
  return (
    <a 
      href={`/letters/${letter.id}`} 
      className="flex items-center p-4 mb-3 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
    >
      <div className="flex-grow">
        {letter.recipients?.map(rec => (
          <div key={rec.id} className='flex mt-3'>
            <ProfileImage photo_uri={rec?.photo_uri} first_name={rec?.first_name} />
            <div className="flex flex-col">
              <div className='flex'>
                {letter.letters[0].status === "draft" && <h4 className="mr-2">[DRAFT]</h4>}
                <h3 className="font-semibold text-gray-800">{rec.first_name} {rec.last_name}</h3>
              </div>
              <div>{rec.country}</div>
            </div>
          </div>
        ))}
        <p className="text-gray-600 truncate">{letter.letters[0].content ?? ''}</p>
        <span className="text-xs text-gray-400">{letter.letters[0].received}</span>
      </div>
    </a>
  );
} 