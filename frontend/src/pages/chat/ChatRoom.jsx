// src/pages/chat/ChatRoom.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { socket } from "../../socket";

export default function ChatRoom() {
  const { friendId } = useParams();
  const navigate = useNavigate();

  const [friend, setFriend] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);

  /* ---------------------------------------------------
     1) โหลดข้อมูลเพื่อน
  ---------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/friends/${friendId}`);
        setFriend(res.data.friend);
      } catch (err) {
        console.error("Load friend failed:", err);
      }
    })();
  }, [friendId]);

  /* ---------------------------------------------------
     2) ขอห้องแชท roomId จาก backend
  ---------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.post(`/chat/get-or-create-room/${friendId}`);
        setRoomId(res.data.room_id);
      } catch (err) {
        console.error("Create room failed:", err);
      }
    })();
  }, [friendId]);

  /* ---------------------------------------------------
     3) โหลดข้อความในห้อง (เมื่อได้ roomId)
  ---------------------------------------------------- */
  useEffect(() => {
    if (!roomId) return;

    (async () => {
      try {
        const res = await api.get(`/chat/room/${roomId}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error("Load messages failed:", err);
      }
    })();
  }, [roomId]);

  /* ---------------------------------------------------
     4) WebSocket join room & ฟังข้อความ
  ---------------------------------------------------- */
  useEffect(() => {
    if (!roomId) return;

    socket.connect();

    socket.emit("online", localStorage.getItem("userId")); // แจ้งว่าออนไลน์
    socket.emit("join_room", roomId);

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit("leave_room", roomId);
      socket.off("receive_message");
    };
  }, [roomId]);

  /* ---------------------------------------------------
     Auto scroll
  ---------------------------------------------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------------------------------------------
     ส่งข้อความ
  ---------------------------------------------------- */
  const sendMessage = async () => {
    if (!text.trim() || !roomId) return;

    const msgData = {
      room_id: roomId,
      sender_id: localStorage.getItem("userId"),
      receiver_id: friendId,
      text,
    };

    // ส่ง socket real-time
    socket.emit("send_message", msgData);

    // ส่ง REST บันทึกลง DB
    try {
      const res = await api.post(`/chat/room/${roomId}`, { text });
      setMessages((prev) => [...prev, res.data.message]);
    } catch (err) {
      console.error("Save message failed:", err);
    }

    setText("");
  };

  return (
    <main className="flex flex-col h-[calc(100vh-80px)] bg-[#E9FBFF]">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white px-6 py-4 shadow">
        <button onClick={() => navigate(-1)} className="text-xl mr-2">
          ←
        </button>

        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
          {friend?.display_name?.charAt(0).toUpperCase()}
        </div>

        <div>
          <p className="font-semibold text-gray-800">{friend?.display_name}</p>
          <p className="text-sm text-gray-500">ออนไลน์</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.sender_id === friendId ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-2xl shadow ${
                m.sender_id === friendId
                  ? "bg-white text-gray-800 rounded-bl-none border"
                  : "bg-[#00B8E6] text-white rounded-br-none"
              }`}
            >
              <p>{m.text}</p>
              <p className="text-[10px] opacity-70 text-right mt-1">
                {new Date(m.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        <div ref={bottomRef}></div>
      </div>

      {/* Input */}
      <div className="bg-white p-4 border-t flex items-center gap-3">
        <input
          type="text"
          placeholder="พิมพ์ข้อความ..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 px-4 py-2 rounded-full bg-gray-100 border outline-none focus:ring-2 focus:ring-[#00B8E6]"
        />
        <button
          onClick={sendMessage}
          className="bg-[#00B8E6] text-white px-6 py-2 rounded-full hover:bg-[#009ecc] shadow"
        >
          ส่ง
        </button>
      </div>
    </main>
  );
}
