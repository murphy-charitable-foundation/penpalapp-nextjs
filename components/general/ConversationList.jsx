import MessagePreview from "./MessagePreview";

const ConversationList = ({ conversations }) => {
  return (
    <ul className="w-full space-y-5 px-2 py-2">
      {conversations.map((c, i) => (
        <li key={c.letterboxId || c.id || i}>
          <MessagePreview
            profileImage={c.profileImage}
            name={c.name}
            country={c.country}
            lastMessage={c.lastMessage}
            lastMessageDate={c.lastMessageDate}
            penpalId={c.penpalId}
            letterboxId={c.letterboxId}
            status={c.status}
            isRecipient={c.isRecipient}
            unread={c.unread}
          />
        </li>
      ))}
    </ul>
  );
};

export default ConversationList;
