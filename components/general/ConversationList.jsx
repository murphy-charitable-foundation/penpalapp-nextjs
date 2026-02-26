import MessagePreview from "./MessagePreview.jsx";

const ConversationList = ({
  conversations,
  isAdmin = false,
  onSelectConversation,
}) => {

  return (
    <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
      {conversations.map((conversation, i) => (
        <div key={`${conversation.letterboxId}-${conversation.id}-${i}`}>
          <MessagePreview
            className={i === 0 ? "first-letter relative" : ""}
            profileImage={conversation.profileImage}
            name={conversation.name}
            country={conversation.country}
            lastMessage={conversation.lastMessage}
            lastMessageDate={conversation.lastMessageDate}
            letterboxId={conversation.letterboxId}
            status={conversation.status}
            isRecipient={conversation.isRecipient}
            unread={conversation.unread}
            isAdmin={isAdmin}
            onClick={() => onSelectConversation(conversation)}
          />
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
