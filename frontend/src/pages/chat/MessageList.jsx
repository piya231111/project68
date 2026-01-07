import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages }) {
  const listRef = useRef(null);
  const bottomRef = useRef(null);

  /* Auto-scroll ลงล่างสุด "ทุกครั้ง" เมื่อมีข้อความใหม่ */
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    // เลื่อนลงล่างสุดแบบดีที่สุด
    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div
      ref={listRef}
      className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
    >
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}

      {/* anchor สำหรับ scroll ลงสุด */}
      <div ref={bottomRef} />
    </div>
  );
}
