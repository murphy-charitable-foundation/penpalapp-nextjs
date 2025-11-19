import { PageContainer } from "../../components/general/PageContainer";
import MessagePreview from "./MessagePreview";

const ConversationList = ({
  conversations,
  className = "",
  maxHeight = "50vh",
  bottomGap = 45, 
}) => {
  const bottomPad = typeof bottomGap === "number" ? bottomGap + 16 : 16;

  return (
    <PageContainer
      width="fluid"
      padding="none"
      scroll={false}
      bg="bg-white"
      className={`!w-full !max-w-none p-0 !rounded-none !shadow-none !overflow-visible ${className}`}
      style={{ borderRadius: 0 }}
    >
      
      <div className="w-full px-10 flex flex-col min-h-0">
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-white"
          style={{
            height: maxHeight,               
            maxHeight,                       
            scrollbarGutter: "stable",
            paddingBottom: `calc(${bottomPad}px + env(safe-area-inset-bottom, 0px))`, 
          }}
        >
          <ul className="m-0 p-0 list-none w-full space-y-4">
            {conversations.map((c, i) => (
              <li key={c.letterboxId || c.id || i} className="w-full">
                <MessagePreview
                  className={i === 0 ? "first-letter relative" : ""}
                  profileImage={c.profileImage}
                  name={c.name}
                  country={c.country}
                  lastMessage={c.lastMessage}
                  lastMessageDate={c.lastMessageDate}
                  letterboxId={c.letterboxId}
                  status={c.status}
                  isRecipient={c.isRecipient}
                  unread={c.unread}
                />
              </li>
            ))}
          </ul>

          
          <div aria-hidden className="pointer-events-none" style={{ height: bottomGap }} />
        </div>
      </div>
    </PageContainer>
  );
};

export default ConversationList;
