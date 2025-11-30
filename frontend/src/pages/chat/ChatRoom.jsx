import React from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInputBar from "./ChatInputBar";
import GifModal from "./GifModal";
import useChatMessages from "./hooks/useChatMessages";
import useFriendData from "./hooks/useFriendData";
import useGifSearch from "./hooks/useGifSearch";

export default function ChatRoom() {
  const {
    friendId,
    friend,
    avatar,
    item,
    isOnline,
  } = useFriendData();

  // ⭐ ป้องกัน Hook run เวลา friendId ยังไม่รู้ → React crash
  if (!friendId) return <div className="p-10">Loading...</div>;

  const {
    roomId,
    messages,
    sendTextMessage,
    sendMediaMessage,
  } = useChatMessages(friendId);

  const {
    gifModalOpen,
    setGifModalOpen,
    gifSearch,
    setGifSearch,
    gifResults,
    searchGIF,
    sendGif,
  } = useGifSearch(roomId);

  return (
    <main className="flex flex-col h-screen bg-[#E9FBFF]">

      <ChatHeader
        friend={friend}
        avatar={avatar}
        item={item}
        isOnline={isOnline}
      />

      <MessageList messages={messages} />

      <ChatInputBar
        sendTextMessage={sendTextMessage}
        sendMediaMessage={sendMediaMessage}
        openGifModal={() => setGifModalOpen(true)}
      />

      {gifModalOpen && (
        <GifModal
          gifSearch={gifSearch}
          setGifSearch={setGifSearch}
          gifResults={gifResults}
          searchGIF={searchGIF}
          sendGif={sendGif}
          close={() => setGifModalOpen(false)}
        />
      )}
    </main>
  );
}
