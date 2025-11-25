import MessagePreview from "./MessagePreview";

const ConversationList = ({
  conversations,
  className = "",
  maxHeight = "50vh",
  bottomGap = 45, // height of bottom navbar (یا هر چیزی زیرش هست)
}) => {
  const bottomPad = typeof bottomGap === "number" ? bottomGap + 16 : 16;

  return (
    <div className={`w-full flex flex-col min-h-0 ${className}`}>
      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-white px-10"
        style={{
          height: maxHeight,                 // allow explicit height from parent
          maxHeight,                         // و در عین حال سقفش هم همین
          scrollbarGutter: "stable",
          paddingBottom: `calc(${bottomPad}px + env(safe-area-inset-bottom, 0px))`,
          WebkitOverflowScrolling: "touch",
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

        {/* فاصله‌ی مرده‌ی زیر لیست تا لبه‌ی کارت */}
        <div aria-hidden className="pointer-events-none" style={{ height: bottomGap }} />
      </div>
    </div>
  );
};

export default ConversationList;
