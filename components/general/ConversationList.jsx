import MessagePreview from "./MessagePreview";

const ConversationList = ({ conversations }) => {
  return (
    <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
      {conversations.map((conversation, i) => (
        <div key={conversation.id}>
          <MessagePreview
            className={ i === 0 && 'first-letter relative'}
            profileImage={conversation.profileImage}
            name={conversation.name}
            country={conversation.country}
            lastMessage={conversation.lastMessage}
            lastMessageDate={conversation.lastMessageDate}
            letterboxId={conversation.letterboxId}
            status={conversation.status}
            isRecipient={conversation.isRecipient}
            unread={conversation.unread}
            id={conversation.recipientId}
          />
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
