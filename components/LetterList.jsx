import MessagePreview from "./MessagePreview";

const LetterList = ({ letters, user }) => {
  console.log(letters)
  console.log(user)
  return (
    <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
      {letters.map((letter) => (
        <div key={letter.id}>
          <MessagePreview
            profileImage={letter.profileImage}
            name={letter.name}
            country={letter.country}
            lastMessage={letter.lastMessage}
            lastMessageDate={letter.lastMessageDate}
            letterboxId={letter.letterboxId}
            status={letter.status}
            isRecipient={letter.recipient === user}
          />
        </div>
      ))}
    </div>
  );
};

export default LetterList;
