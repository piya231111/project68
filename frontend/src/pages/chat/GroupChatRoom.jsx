// src/pages/chat/GroupChatRoom.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../../socket";
import FriendDetailModal from "../../components/FriendDetailModal";
import GifModal from "../chat/GifModal";
import useGifSearch from "../chat/hooks/useGifSearchRandom";
import InviteFriendModal from "../../components/InviteFriendModal";

export default function GroupChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friendMap, setFriendMap] = useState({});


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

  // JOIN ห้องใน DB → แล้วค่อย join socket
  useEffect(() => {
    if (!roomId) return;

    async function joinRoomDB() {
      try {
        const token = localStorage.getItem("token");

        // STEP 1: Load room info
        const roomRes = await fetch(
          `http://localhost:7000/api/chat/group/${roomId}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await roomRes.json();
        const roomType = data?.room?.type;

        // STEP 2: Join room (DB)
        if (roomType === "public") {
          await fetch(
            `http://localhost:7000/api/chat/group/join-public/${roomId}`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } else {
          await fetch(
            `http://localhost:7000/api/chat/group/join/${roomId}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ password: null }),
            }
          );
        }

        // STEP 3: ตรวจว่า reconnect ไหม
        const key = `group_joined_${roomId}`;
        const isReconnect = localStorage.getItem(key) === "1";

        // STEP 4: join socket (ตัวสำคัญ)
        socket.emit("groupChat:join", {
          roomId,
          user: me,
          isReconnect,
        });

        // บันทึกว่าเคยเข้าห้องนี้แล้ว
        localStorage.setItem(key, "1");

      } catch (err) {
        console.error("JOIN GROUP ROOM ERROR:", err);
      }
    }

    joinRoomDB();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    loadMembers();
    loadFriendsStatus(); //สำคัญมาก
  }, [roomId]);

  // โหลดสมาชิก
  async function loadMembers() {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:7000/api/chat/group/${roomId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();

      if (!Array.isArray(data.members)) {
        setMembers([]);
        return;
      }

      // ✅ กัน id ซ้ำ
      const unique = [
        ...new Map(data.members.map(m => [m.id, m])).values()
      ];

      setMembers(unique);

    } catch (err) {
      console.error(err);
      setMembers([]);
    }
  }

  async function addFriend(friendId) {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:7000/api/friends/request/${friendId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await loadFriendsStatus();
    alert("ส่งคำขอเป็นเพื่อนแล้ว");
  }

  async function blockUser(friendId) {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:7000/api/friends/${friendId}/block`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await loadFriendsStatus();
    alert("บล็อคผู้ใช้แล้ว");
  }

  // โหลดข้อความจาก localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`group_chat_${roomId}`);
    if (saved) setMessages(JSON.parse(saved));
  }, [roomId]);

  // ตั้ง event socket
  useEffect(() => {
    if (!roomId) return;

    socket.on("groupChat:full", (data) => {
      alert(data.error);
      navigate("/chat/group");
    });

    socket.on("groupChat:joinedSelf", () => {
      loadMembers();
    });

    socket.on("groupChat:userJoin", ({ name }) => {
      setMessages((prev) => [
        ...prev,
        { system: true, text: `${name} เข้าห้อง` },
      ]);
    });

    socket.on("groupChat:userLeft", () => {
      setMessages((prev) => [
        ...prev,
        { system: true, text: `สมาชิกออกจากห้อง` },
      ]);
    });

    socket.on("groupChat:message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // ตัวนี้คือ KEY สำคัญ
    socket.on("groupChat:syncMembers", () => {
      loadMembers();
      loadFriendsStatus();
    });

    return () => {
      socket.off("groupChat:full");
      socket.off("groupChat:joinedSelf");
      socket.off("groupChat:userJoin");
      socket.off("groupChat:userLeft");
      socket.off("groupChat:message");
      socket.off("groupChat:syncMembers"); // อย่าลืม off
    };
  }, [roomId]);

  async function loadFriendsStatus() {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:7000/api/friends", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    const map = {};
    (data.friends || []).forEach((f) => {
      map[f.id] = f;
    });

    setFriendMap(map);
  }

  // auto scroll
  useEffect(() => {
    localStorage.setItem(`group_chat_${roomId}`, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // Upload file
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

  // Leave room
  async function leaveRoom() {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:7000/api/chat/group/leave/${roomId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    socket.emit("groupChat:leave", {
      roomId,
      userId: me.id,
      manualLeave: true
    });

    // ลบ cache แชท
    localStorage.removeItem(`group_chat_${roomId}`);

    // สำคัญมาก: ลบ reconnect flag
    localStorage.removeItem(`group_joined_${roomId}`);

    setMessages([]);
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
      <div className="bg-white border-b px-6 py-3 flex items-center gap-6 overflow-x-auto">

        {/* รายชื่อสมาชิก */}
        {members.map((m) => {
          const avatarFile =
            Number(m.avatar_id) < 10
              ? `avatar0${m.avatar_id}.png`
              : `avatar${m.avatar_id}.png`;

          const itemFile =
            Number(m.item_id) < 10
              ? `item0${m.item_id}.png`
              : `item${m.item_id}.png`;

          return (
            <div
              key={m.id}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => {
                const friendStatus = friendMap[m.id]; // ❗ ไม่ต้อง || {}

                setSelectedUser({
                  ...m,
                  isFriend: !!friendStatus,
                  isIncomingRequest: false,
                  isSentRequest: false,
                  isInRoom: true,
                });

                setShowDetail(true);
              }}
            >
              <div className="relative w-14 h-14">
                <div className="w-full h-full rounded-full border-2 border-gray-200 overflow-hidden relative">

                  {m.item_id && (
                    <img
                      src={`http://localhost:7000/uploads/items/${itemFile}`}
                      className="absolute inset-0 w-full h-full object-cover opacity-70"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  )}

                  <img
                    src={`http://localhost:7000/uploads/avatars/${avatarFile}`}
                    onError={(e) => (e.target.src = "/default-avatar.png")}
                    className="relative w-full h-full object-contain z-10"
                  />
                </div>
              </div>

              <p className="text-[13px] text-[#00B8E6] font-semibold mt-1">
                {m.display_name}
              </p>
            </div>
          );
        })}

        {/* ปุ่มชวนเพื่อน (ดันไปขวาสุด) */}
        <button
          onClick={() => setShowInviteModal(true)}
          className="ml-auto text-[#00B8E6] font-semibold whitespace-nowrap"
        >
          ชวนเพื่อน
        </button>
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
          sendGif={(gifUrl) => {
            socket.emit("groupChat:message", {
              roomId,
              sender: me.id,
              name: me.display_name,
              fileUrl: gifUrl,
              type: "gif",
              time: Date.now(),
            });

            setGifModalOpen(false);
          }}
          close={() => setGifModalOpen(false)}
        />
      )}

      {/* DETAIL MODAL */}
      {showDetail && selectedUser && (
        <FriendDetailModal
          friend={selectedUser}

          onClose={() => {
            setShowDetail(false);
            setSelectedUser(null);
          }}

          onAddFriend={async (friendId) => {
            await addFriend(friendId);
            setShowDetail(false);
            setSelectedUser(null);
          }}

          onBlockUser={async (friendId) => {
            await blockUser(friendId);
            setShowDetail(false);
            setSelectedUser(null);
          }}

          onChat={(friendId) => {
            setShowDetail(false);
            setSelectedUser(null);
            navigate(`/chat/${friendId}`);
          }}
        />
      )}
      {/* INVITE MODAL */}
      {showInviteModal && (
        <InviteFriendModal
          roomId={roomId}
          members={members}   //เพิ่มบรรทัดนี้
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}
