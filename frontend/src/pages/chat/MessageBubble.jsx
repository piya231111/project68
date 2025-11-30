import React from "react";

export default function MessageBubble({ message }) {
  const me = JSON.parse(localStorage.getItem("user"));
  const userId = me?.id;

  const isMine = String(message.sender_id) === String(userId);

  const base = "max-w-xs px-4 py-2 rounded-2xl shadow";
  const myBubble = "bg-[#00B8E6] text-white rounded-br-none";
  const otherBubble = "bg-white text-gray-800 rounded-bl-none border";

  // ⭐ ป้องกัน created_at undefined ทำให้ UI Freeze
  let time = "";
  try {
    time = new Date(message.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    time = "";
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`${base} ${isMine ? myBubble : otherBubble}`}>

        {/* Text */}
        {message.type === "text" && <p>{message.text}</p>}

        {/* Image */}
        {message.type === "image" && (
          <img
            src={message.file_url}
            alt="image"
            className="max-w-[200px] rounded-lg"
          />
        )}

        {/* Video */}
        {message.type === "video" && (
          <video
            src={message.file_url}
            controls
            className="max-w-[240px] rounded-lg"
          />
        )}

        {/* GIF */}
        {message.type === "gif" && (
          <img
            src={message.file_url}
            alt="gif"
            className="max-w-[200px] rounded-lg"
          />
        )}

        {/* Time */}
        <p className="text-[10px] opacity-70 text-right mt-1">
          {time}
        </p>

      </div>
    </div>
  );
}
