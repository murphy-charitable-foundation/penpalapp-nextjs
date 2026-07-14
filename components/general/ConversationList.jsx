import ConversationPreview from "./ConversationPreview";

const ConversationList = ({
  conversations,
  isAdmin = false,
  onSelectConversation = () => {},
}) => {
  return (
    <div className="space-y-4 pr-1 mb-4">
      {conversations.map((conversation, i) => (
        <div key={`${conversation.conversationId}-${conversation.id}-${i}`}>
          <ConversationPreview
            className={i === 0 ? "first-letter relative" : ""}
            profileImage={conversation.profileImage}
            name={conversation.name}
            country={conversation.country}
            lastMessage={conversation.lastMessage}
            lastMessageDate={conversation.lastMessageDate}
            attachments={conversation.attachments}
            conversationId={conversation.conversationId}
            status={conversation.status}
            isRecipient={conversation.isRecipient}
            unread={conversation.unread}
            isAdmin={isAdmin}
            id={conversation.sent_by?.id}
            onClick={() => onSelectConversation(conversation)}
          />
        </div>
      ))}
    </div>
  );
};

export default ConversationList;