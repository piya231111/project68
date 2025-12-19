// src/pages/chat/GroupChatRoom.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../../socket";
import FriendDetailModal from "../../components/FriendDetailModal";
import GifModal from "../chat/GifModal";
import useGifSearch from "../chat/hooks/useGifSearchRandom";

export default function GroupChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const me = JSON.parse(localStorage.getItem("user"));
  const bottomRef = useRef(null);

  /** GIF Hook */
  const {
    gifModalOpen,
    setGifModalOpen,
    gifSearch,
    setGifSearch,
    gifResults,
    searchGIF,
    sendGif,
  } = useGifSearch(roomId, "group");

  // เข้าร่วมห้องใน DB ก่อน แล้วค่อย join socket
  useEffect(() => {
    if (!roomId) return;

    async function joinRoomDB() {
      const token = localStorage.getItem("token");

      await fetch(`http://localhost:7000/api/chat/group/join/${roomId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: null }),
      });
    }

    joinRoomDB();  // ⭐ บันทึกเข้าฐานข้อมูล
    socket.emit("groupChat:join", { roomId, user: me });  // ⭐ join socket

  }, [roomId]);


  // โหลด cache ข้อความ (localStorage)
  useEffect(() => {
    const saved = localStorage.getItem(`group_chat_${roomId}`);
    if (saved) setMessages(JSON.parse(saved));
  }, [roomId]);

  // JOIN ROOM
  useEffect(() => {
    if (!roomId) return;
    socket.emit("groupChat:join", { roomId, user: me });

    // ห้องเต็ม
    socket.on("groupChat:full", (data) => {
      alert(data.error);
      navigate("/chat/group");
    });

    // มีสมาชิกเข้าห้อง
    socket.on("groupChat:userJoin", ({ userId, name }) => {
      loadMembers(); // ⭐ refresh รายชื่อ
      setMessages((prev) => [
        ...prev,
        { system: true, text: `${name} เข้าห้อง` },
      ]);
    });

    // สมาชิกออกห้อง
    socket.on("groupChat:userLeft", ({ userId }) => {
      loadMembers(); // ⭐ refresh รายชื่อ
      setMessages((prev) => [
        ...prev,
        { system: true, text: `สมาชิกออกจากห้อง` },
      ]);
    });

    // ข้อความใหม่
    socket.on("groupChat:message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // โหลดสมาชิกครั้งแรก
    loadMembers();

    return () => {
      socket.off("groupChat:full");
      socket.off("groupChat:userJoin");
      socket.off("groupChat:userLeft");
      socket.off("groupChat:message");
    };
  }, [roomId]);

  // Scroll → bottom ทุกครั้งที่มีข้อความใหม่
  useEffect(() => {
    localStorage.setItem(`group_chat_${roomId}`, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // โหลดสมาชิกจากฐานข้อมูล
  async function loadMembers() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:7000/api/chat/group/${roomId}/members`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      setMembers(data.members);
    } catch (err) {
      console.error("โหลดสมาชิกห้องผิดพลาด", err);
    }
  }

  // ส่งข้อความ
  function sendMessage() {
    if (!input.trim()) return;

    socket.emit("groupChat:message", {
      roomId,
      sender: me.id,
      name: me.display_name,
      text: input.trim(),
      time: Date.now(),
    });

    setInput("");
  }

  // Upload ไฟล์
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("http://localhost:7000/api/upload/chat-file", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const data = await res.json();

    socket.emit("groupChat:message", {
      roomId,
      sender: me.id,
      name: me.display_name,
      fileUrl: data.url,
      type: file.type.startsWith("video") ? "video" : "image",
      time: Date.now(),
    });
  }

  // ออกจากห้อง
  async function leaveRoom() {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:7000/api/chat/group/leave/${roomId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    socket.emit("groupChat:leave", { roomId, userId: me.id });

    navigate("/chat/group");
  }

  return (
    <div className="flex flex-col h-screen bg-[#E9FBFF]">

      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-4 bg-white shadow-md">
        <h1 className="text-xl font-bold text-[#00B8E6]">ห้องแชทกลุ่ม</h1>
        <button onClick={leaveRoom} className="text-red-500 font-semibold">
          ออกจากห้อง
        </button>
      </div>

      {/* MEMBER LIST */}
      <div className="bg-white border-b px-4 py-2 flex gap-3 overflow-x-auto">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => {
              setSelectedUser(m);
              setShowDetail(true);
            }}
          >
            <img
              src={`/uploads/avatars/${m.avatar_id}.png`}
              className="w-10 h-10 rounded-full"
            />
            <p className="text-[11px] text-[#00B8E6] font-medium mt-1">
              {m.display_name}
            </p>
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => {
          if (msg.system)
            return (
              <p key={i} className="text-center text-gray-500 text-sm italic">
                {msg.text}
              </p>
            );

          const isMine = msg.sender === me.id;

          return (
            <div
              key={i}
              className={`flex flex-col ${isMine ? "items-end" : "items-start"
                }`}
            >
              {!isMine && (
                <p className="text-[11px] text-blue-500 font-medium mb-1 ml-1">
                  {msg.name}
                </p>
              )}

              {msg.fileUrl ? (
                msg.type === "video" ? (
                  <video
                    src={msg.fileUrl}
                    controls
                    className="max-w-[260px] rounded-lg shadow"
                  />
                ) : (
                  <img
                    src={msg.fileUrl}
                    className="max-w-[260px] rounded-lg shadow"
                  />
                )
              ) : (
                <div
                  className={`px-4 py-2 rounded-2xl shadow text-sm max-w-[260px] ${isMine
                    ? "bg-[#00B8E6] text-white rounded-br-none"
                    : "bg-white border text-gray-700 rounded-bl-none"
                    }`}
                >
                  {msg.text}
                </div>
              )}

              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(msg.time).toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          );
        })}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div className="bg-white p-4 border-t flex items-center gap-3">
        <input
          type="file"
          id="fileUploadGroup"
          className="hidden"
          onChange={handleFileUpload}
        />
        <label
          htmlFor="fileUploadGroup"
          className="p-3 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300"
        >
          📎
        </label>

        <button
          onClick={() => setGifModalOpen(true)}
          className="p-3 bg-yellow-300 rounded-full hover:bg-yellow-400"
        >
          GIF
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="พิมพ์ข้อความ..."
          className="flex-1 px-4 py-2 rounded-full border bg-gray-50 focus:ring-2 focus:ring-[#00B8E6]"
        />

        <button
          onClick={sendMessage}
          className="bg-[#00B8E6] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#009ccc]"
        >
          ส่ง
        </button>
      </div>

      {/* GIF MODAL */}
      {gifModalOpen && (
        <GifModal
          gifSearch={gifSearch}
          setGifSearch={setGifSearch}
          gifResults={gifResults}
          searchGIF={searchGIF}
          sendGif={(url) =>
            sendGif(url, (fileUrl) =>
              socket.emit("groupChat:message", {
                roomId,
                sender: me.id,
                name: me.display_name,
                fileUrl,
                type: "gif",
                time: Date.now(),
              })
            )
          }
          close={() => setGifModalOpen(false)}
        />
      )}

      {/* DETAIL MODAL */}
      {showDetail && selectedUser && (
        <FriendDetailModal
          friend={selectedUser}
          onClose={() => setShowDetail(false)}
          onAddFriend={() => { }}
          onRemoveFriend={() => { }}
          onToggleFavorite={() => { }}
          onBlockUser={() => { }}
          onChat={() => { }}
        />
      )}
    </div>
  );
}
