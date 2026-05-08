import MessagePreview from "./MessagePreview";

const MessageList = ({ conversations }) => {
    return (
      <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
        {conversations.map((conversation, i) => (
          <div key={conversation.id}>
            <MessagePreview
              className={i === 0 && 'first-letter relative'}
              profileImage={conversation.sent_by?.profileImage || conversation.profileImage}
              name={conversation.sent_by?.name || conversation.name}
              country={conversation.sent_by?.country || conversation.country}
              lastMessage={conversation.content}
              lastMessageDate={conversation.created_at}
              letterboxId={conversation.id}
              status={conversation.status}
              isRecipient={conversation.isRecipient}
              unread={conversation.unread}
              rejectionReason={conversation.rejection_reason}
              rejectionFeedback={conversation.rejection_feedback}
              moderatorId={conversation.moderator_id}
              deleted={conversation.deleted}
              updatedAt={conversation.updated_at}
            />
          </div>
        ))}
      </div>
    );
  };
  
  export default MessageList;