import React, { useState } from "react";

export default function ChatInputBar({
  sendTextMessage,
  sendMediaMessage,
  openGifModal,
}) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    sendTextMessage(text);
    setText("");
  };

  return (
    <div className="bg-white p-4 border-t flex items-center gap-3">

      {/* ไฟล์ */}
      <input
        type="file"
        accept="image/*,video/*,.gif"
        className="hidden"
        id="fileUploadChat"
        onChange={(e) => sendMediaMessage(e.target.files[0])}
      />
      <label htmlFor="fileUploadChat" className="p-3 bg-gray-200 rounded-full">
        📎
      </label>

      {/* GIF */}
      <button
        onClick={openGifModal}
        className="p-3 bg-yellow-300 rounded-full"
      >
        GIF
      </button>

      <input
        type="text"
        placeholder="พิมพ์ข้อความ..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        className="flex-1 px-4 py-2 rounded-full"
      />

      <button
        onClick={send}
        className="bg-[#00B8E6] text-white px-6 py-2 rounded-full"
      >
        ส่ง
      </button>
    </div>
  );
}
