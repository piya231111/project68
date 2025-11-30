import { useEffect, useState } from "react";
import { api } from "../../../api";
import { socket } from "../../../socket";

export default function useChatMessages(friendId) {
  const me = JSON.parse(localStorage.getItem("user"));
  const userId = String(me?.id || "");

  const [roomId, setRoomId] = useState(null);
  const [roomReady, setRoomReady] = useState(false);   // ⭐ ใหม่
  const [messages, setMessages] = useState([]);

  /* ============================================
     ⭐ 0) คำหยาบ + ฟังก์ชันเซ็นเซอร์
  ============================================ */
  const badPatterns = [
    /ค+[ ._]*ว+[ ._]*ย+/gi,
    /เห+[ ._]*ี้+[ ._]*ย+/gi,
    /ส+[ ._]*ั+[ ._]*ส+/gi,
    /fu+ck+/gi,
    /bit+ch+/gi,
    /pu+ssy+/gi,
    /k+[ ._]*u+[ ._]*y+/gi,
  ];

  const replaceBadWords = (text) => {
    let newText = text;
    badPatterns.forEach((p) => {
      newText = newText.replace(p, "***");
    });
    return newText;
  };

  /* ============================================
     ⭐ 1) สร้างห้องแชท
  ============================================ */
  useEffect(() => {
    if (!friendId) return;

    api.post(`/chat/get-or-create-room/${friendId}`)
      .then((res) => setRoomId(res.data.room_id))
      .catch(console.error);

  }, [friendId]);

  /* ============================================
     ⭐ 2) join room + load old messages
  ============================================ */
  useEffect(() => {
    if (!roomId) return;

    socket.emit("join_room", roomId);
    setRoomReady(true);         // ⭐ แจ้งว่าห้องพร้อมแล้ว

    // โหลดข้อความเก่า
    api.get(`/chat/room/${roomId}`).then((res) => {
      const arr = Array.isArray(res.data.messages) ? res.data.messages : [];
      setMessages(arr);
    });

    // ⭐ ใช้ฟังก์ชันใหม่ที่ไม่ถือค่า roomId เก่า
    const handleReceive = (msg) => {
      setMessages((prev) => {
        if (String(msg.room_id) === String(roomId)) {
          return [...prev, msg];
        }
        return prev;
      });
    };

    socket.on("receive_message", handleReceive);
    return () => socket.off("receive_message", handleReceive);

  }, [roomId]);

  /* ============================================
     ⭐ 3) ส่งข้อความแบบ text
  ============================================ */
  const sendTextMessage = (text) => {
    if (!text.trim() || !roomId || !roomReady) return;

    const cleaned = replaceBadWords(text);

    socket.emit("send_message", {
      room_id: roomId,
      sender_id: userId,
      type: "text",
      text: cleaned,
    });
  };

  /* ============================================
     ⭐ 4) ส่งรูป / วิดีโอ / gif
  ============================================ */
  const sendMediaMessage = async (file) => {
    if (!file || !roomId || !roomReady) return;

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await api.post("/upload/chat-file", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const file_url = res.data.url;

      let type = "file";
      if (file.type.includes("image")) type = "image";
      if (file.type.includes("video")) type = "video";
      if (file.name.toLowerCase().endsWith(".gif")) type = "gif";

      socket.emit("send_message", {
        room_id: roomId,
        sender_id: userId,
        type,
        file_url,
      });

    } catch (err) {
      console.error("media error:", err);
    }
  };

  return {
    roomId,
    messages,
    roomReady,          // ⭐ ส่งให้ ChatInputBar
    sendTextMessage,
    sendMediaMessage,
  };
}
