import React from "react";

const BACKEND_URL = "http://localhost:7000";

export default function MessageBubble({ message }) {
  const me = JSON.parse(localStorage.getItem("user"));
  const userId = me?.id;

  const isMine = String(message.sender_id) === String(userId);

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isMedia =
    message.type === "image" ||
    message.type === "gif" ||
    message.type === "video";

  const avatar =
    message.avatar_id
      ? `${BACKEND_URL}/uploads/avatars/avatar${String(message.avatar_id).padStart(2, "0")}.png`
      : isMine
        ? `${BACKEND_URL}/uploads/avatars/avatar${String(me.avatar_id).padStart(2, "0")}.png`
        : "/default-avatar.png";

  const item =
    message.item_id
      ? `${BACKEND_URL}/uploads/items/item${String(message.item_id).padStart(2, "0")}.png`
      : isMine
        ? `${BACKEND_URL}/uploads/items/item${String(me.item_id).padStart(2, "0")}.png`
        : null;

  const mediaUrl = message.file_url
    ? message.file_url.startsWith("http")
      ? message.file_url
      : `${BACKEND_URL}${message.file_url}`
    : null;

  return (
    <div
      className={`flex my-4 ${isMine ? "justify-end" : "justify-start"
        }`}
    >
      <div
        className={`flex gap-2 ${isMine ? "flex-row-reverse items-end" : "items-start"
          }`}
      >
        <div className="relative shrink-0 w-14 h-14 rounded-full overflow-hidden border shadow bg-white">

          {/* ITEM : ชั้นหลัง (พอดีวง ไม่เล็กเกิน) */}
          {item && (
            <img
              src={item}
              alt="item"
              className="absolute inset-0 w-full h-full object-contain scale-[1.08] translate-y-[3%] opacity-75 z-0 pointer-events-none"
            />
          )}

          {/* AVATAR : เต็มพอดีวง */}
          <img
            src={avatar}
            onError={(e) => (e.target.src = '/default-avatar.png')}
            className="absolute inset-0 w-full h-full object-contain scale-[1.05] translate-y-[2%] z-10"
          />
        </div>

        {/* ===== MESSAGE BLOCK ===== */}
        <div
          className={`flex flex-col max-w-xs ${isMine ? "items-end" : "items-start"
            }`}
        >
          {/* NAME */}
          <p className="text-[11px] text-gray-500 font-medium mb-1">
            {isMine ? me?.username : message.sender_name}
          </p>

          {/* MEDIA */}
          {isMedia && mediaUrl && (
            <div className="my-1">
              {message.type === "video" ? (
                <video
                  src={mediaUrl}
                  controls
                  className="max-w-[260px] rounded-2xl shadow"
                />
              ) : (
                <img
                  src={mediaUrl}
                  className="max-w-[260px] rounded-2xl shadow"
                />
              )}
            </div>
          )}

          {/* TEXT */}
          {!isMedia && (
            <div
              className={`px-4 py-2 rounded-2xl shadow text-sm ${isMine
                ? "bg-[#00B8E6] text-white rounded-br-md"
                : "bg-white border text-gray-800 rounded-bl-md"
                }`}
            >
              {message.text}
            </div>
          )}

          {/* TIME */}
          <span className="text-[10px] text-gray-400 mt-1">
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}
