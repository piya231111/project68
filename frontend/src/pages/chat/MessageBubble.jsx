import React from "react";

export default function MessageBubble({ message }) {
  const me = JSON.parse(localStorage.getItem("user"));
  const userId = me?.id;

  const isMine = String(message.sender_id) === String(userId);

  const base = "max-w-xs px-4 py-2 rounded-2xl shadow";
  const myBubble = "bg-[#00B8E6] text-white rounded-br-none";
  const otherBubble = "bg-white text-gray-800 rounded-bl-none border";

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`${base} ${isMine ? myBubble : otherBubble}`}>

        {message.type === "text" && <p>{message.text}</p>}

        {message.type === "image" && (
          <img src={message.file_url} className="max-w-[200px] rounded-lg" />
        )}

        {message.type === "video" && (
          <video src={message.file_url} controls className="max-w-[240px]" />
        )}

        {message.type === "gif" && (
          <img src={message.file_url} className="max-w-[200px] rounded-lg" />
        )}

        <p className="text-[10px] opacity-70 text-right mt-1">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

      </div>
    </div>
  );
}
