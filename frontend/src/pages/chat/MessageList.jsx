import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages }) {
  const listRef = useRef(null);
  const bottomRef = useRef(null);

  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  /* ---------------------------------------------------
      1) ตรวจว่า User เลื่อนขึ้นไปดูข้อความเก่าหรือยัง?
  ---------------------------------------------------- */
  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;

    const isBottom =
      el.scrollHeight - el.scrollTop <= el.clientHeight + 10;

    setIsUserAtBottom(isBottom);
  };

  /* ---------------------------------------------------
      2) Auto-scroll เมื่อมีข้อความใหม่
         - ทำงานเฉพาะเมื่อ User อยู่ล่างสุดเท่านั้น
  ---------------------------------------------------- */
  useEffect(() => {
    if (isUserAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
    >
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}

      {/* anchor‬ สำหรับ scroll ลงสุด */}
      <div ref={bottomRef} />
    </div>
  );
}
