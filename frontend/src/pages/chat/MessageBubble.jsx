import React from "react";

export default function MessageBubble({ message }) {
  const me = JSON.parse(localStorage.getItem("user"));
  const userId = me?.id;

  const isMine = String(message.sender_id) === String(userId);

  const base =
    "max-w-xs px-4 py-2 rounded-2xl shadow";
  const myBubble = "bg-[#00B8E6] text-white rounded-br-none";
  const otherBubble = "bg-white text-gray-800 rounded-bl-none border";

  let time = "";
  try {
    time = new Date(message.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {}

  const isMedia =
    message.type === "image" ||
    message.type === "gif" ||
    message.type === "video";

  return (
    <div
      className={`flex flex-col my-2 ${
        isMine ? "items-end" : "items-start"
      }`}
    >
      {/* ---------- ชื่อผู้ส่ง (เฉพาะเพื่อน) ---------- */}
      {!isMine && (
        <p className="text-[11px] text-gray-500 font-medium mb-1 ml-1">
          {message.sender_name}
        </p>
      )}

      {/* ---------------- MEDIA (ไม่มี Bubble) ---------------- */}
      {isMedia && (
        <div className="my-1">
          {message.type === "image" && (
            <img
              src={message.file_url}
              className="max-w-[260px] rounded-lg shadow"
            />
          )}

          {message.type === "gif" && (
            <img
              src={message.file_url}
              className="max-w-[260px] rounded-lg shadow"
            />
          )}

          {message.type === "video" && (
            <video
              src={message.file_url}
              controls
              className="max-w-[260px] rounded-lg shadow"
            />
          )}
        </div>
      )}

      {/* ---------------- TEXT BUBBLE ---------------- */}
      {!isMedia && (
        <div className={`${base} ${isMine ? myBubble : otherBubble}`}>
          <p>{message.text}</p>
        </div>
      )}

      {/* ---------------- TIME ---------------- */}
      <p
        className={`text-[10px] text-gray-400 mt-1 ${
          isMine ? "text-right" : "text-left"
        }`}
      >
        {time}
      </p>
    </div>
  );
}
