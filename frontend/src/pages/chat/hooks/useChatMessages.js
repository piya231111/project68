import { useEffect, useState } from "react";
import { api } from "../../../api";
import { socket } from "../../../socket";

export default function useChatMessages(friendId) {
  const me = JSON.parse(localStorage.getItem("user"));
  const userId = String(me?.id || "");

  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);

  /* 1) สร้างห้อง */
  useEffect(() => {
    if (!friendId) return;

    api.post(`/chat/get-or-create-room/${friendId}`)
      .then((res) => setRoomId(res.data.room_id))
      .catch(console.error);
  }, [friendId]);

  /* 2) join room + load messages + listener */
  useEffect(() => {
    if (!roomId) return;

    socket.emit("join_room", roomId);

    // โหลดข้อความเก่าจาก DB
    api.get(`/chat/room/${roomId}`)
      .then((res) => {
        const msgs = Array.isArray(res.data.messages) ? res.data.messages : [];
        setMessages(msgs);
      })
      .catch(console.error);

    // Listener realtime
    const handleReceive = (msg) => {
      if (String(msg.room_id) === String(roomId)) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive_message", handleReceive);

    // cleanup
    return () => {
      socket.off("receive_message", handleReceive);
    };

  }, [roomId]);

  /* 3) ส่งข้อความ text */
  const sendTextMessage = async (text) => {
    if (!text.trim() || !roomId) return;

    const payload = {
      room_id: roomId,
      sender_id: userId,
      type: "text",
      text,
      created_at: new Date().toISOString(),
    };

    socket.emit("send_message", payload);
    await api.post(`/chat/room/${roomId}`, payload);
  };

  /* 4) ส่งไฟล์ (image / video / gif) */
  const sendMediaMessage = async (file) => {
    if (!file || !roomId) return;

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

      const payload = {
        room_id: roomId,
        sender_id: userId,
        type,
        file_url,
        created_at: new Date().toISOString(),
      };

      socket.emit("send_message", payload);
      await api.post(`/chat/room/${roomId}`, payload);

    } catch (err) {
      console.error("sendMediaMessage error:", err);
    }
  };

  return {
    roomId,
    messages,
    sendTextMessage,
    sendMediaMessage,
  };
}
