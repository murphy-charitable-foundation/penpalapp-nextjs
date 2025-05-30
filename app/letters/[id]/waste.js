"use client";

export default function Page({ params }) {
  // Send message function
  const handleSendMessage = async () => {
    const trimmedContent = messageContent.trim();

    if (!trimmedContent && !draft?.content?.trim()) {
      alert("Please enter a message");
      return;
    }

    if (isSending) return;

    setIsSending(true);

    const letterUserRef = userRef || doc(db, "users", user.uid);
    const contentToSend = trimmedContent || draft?.content?.trim();
    const currentTime = new Date();

    const messageData = {
      sent_by: letterUserRef,
      content: contentToSend,
      status: "sent",
      created_at: currentTime,
      deleted: null,
    };

    let messageRef;

    if (draft?.id) {
      // Update existing draft to sent
      messageRef = doc(lettersRef, draft.id);
      await updateDoc(messageRef, messageData);
    } else {
      // Create new message
      messageRef = doc(lettersRef);
      await setDoc(messageRef, messageData);
    }

    // Verify message was sent
    const sentDoc = await getDoc(messageRef);
    if (!sentDoc.exists() || sentDoc.data().status !== "sent") {
      throw new Error("Message failed to send");
    }

    // Clear states
    setMessageContent("");
    setDraft(null);
    setHasDraftContent(false);
  };
}
