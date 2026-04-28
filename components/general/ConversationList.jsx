import ConversationPreview from "./ConversationPreview";

const ConversationList = ({ conversations }) => {
  return (
    <ul className="w-full space-y-5 px-2 py-2">
      {conversations.map((c, i) => (
        <li key={c.conversationId || c.id || i}>
          <ConversationPreview
            profileImage={c.profileImage}
            name={c.name}
            country={c.country}
            lastMessage={c.lastMessage}
            lastMessageDate={c.lastMessageDate}
            conversationsId={c.conversationsId}
            status={c.status}
            isRecipient={c.isRecipient}
            unread={c.unread}
            id={c.recipientId}
          />
        </li>
      ))}
    </ul>
  );
};

export default ConversationList;
