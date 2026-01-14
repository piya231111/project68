// src/pages/chat/GroupChatLobby.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GroupChatLobby() {
  const [rooms, setRooms] = useState([]);
  const [popularRooms, setPopularRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [password, setPassword] = useState("");

  // create room modal
  const [createModal, setCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [roomType, setRoomType] = useState("public");
  const [roomPassword, setRoomPassword] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  /* =========================
      LOAD ROOMS
  ========================== */
  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const res = await fetch("http://localhost:7000/api/chat/group/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setRooms(data.rooms || []);
      setPopularRooms(data.popular || []);
    } catch (err) {
      console.error("โหลดห้องไม่สำเร็จ", err);
    }
  }

  /* =========================
      JOIN ROOM
  ========================== */
  const joinRoom = async (room) => {
    if (room.type === "private") {
      setSelectedRoom(room);
      return;
    }

    navigate(`/chat/group/${room.id}`);
  };

  const submitPassword = async () => {
    if (password.length !== 4) return alert("กรุณากรอกรหัส 4 หลัก");

    const res = await fetch(
      `http://localhost:7000/api/chat/group/join/${selectedRoom.id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "รหัสไม่ถูกต้อง");
      return;
    }

    setPassword("");
    setSelectedRoom(null);
    navigate(`/chat/group/${selectedRoom.id}`);
  };

  /* =========================
      CREATE ROOM
  ========================== */
  const createRoom = async () => {
    if (!newRoomName.trim()) return alert("กรุณากรอกชื่อห้อง");

    if (roomType === "private" && roomPassword.length !== 4)
      return alert("กรุณากรอกรหัส 4 หลัก");

    const res = await fetch("http://localhost:7000/api/chat/group/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newRoomName,
        type: roomType,
        password: roomType === "private" ? roomPassword : null,
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "สร้างห้องไม่สำเร็จ");

    await loadRooms();

    // (ถ้ายังอยากเข้าไปในห้องที่สร้าง)
    navigate(`/chat/group/${data.roomId}`);

    setCreateModal(false);
    setNewRoomName("");
    setRoomPassword("");
  };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full">
      <div className="max-w-6xl mx-auto p-6">

        {/* TITLE */}
        <h1 className="text-3xl font-bold text-[#00B8E6] mb-6">
          เลือกห้องแชทกลุ่ม
        </h1>

        {/* ACTION BAR */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center max-w-4xl mb-8">
          <button
            onClick={() => setCreateModal(true)}
            className="bg-[#00B8E6] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#009ccc] whitespace-nowrap"
          >
            สร้างห้องแชท
          </button>

          <input
            placeholder="ค้นหาห้องแชท..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-[#b7edf7] shadow bg-white"
          />
        </div>

        {/* POPULAR ROOMS */}
        <h2 className="text-xl font-semibold text-[#00B8E6] mb-3 flex items-center gap-2">
          ห้องยอดนิยม
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {popularRooms.map((room) => (
            <RoomCard key={room.id} room={room} joinRoom={joinRoom} />
          ))}
        </div>

        {/* ALL ROOMS */}
        <h2 className="text-xl font-semibold text-[#00B8E6] mt-10 mb-3 flex items-center gap-2">
          ห้องทั้งหมด
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-24">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} joinRoom={joinRoom} />
          ))}
        </div>

        {/* PRIVATE PASSWORD MODAL */}
        {selectedRoom && (
          <Modal>
            <h3 className="text-xl font-bold mb-4">
              ห้อง {selectedRoom.name}
            </h3>

            <input
              type="password"
              maxLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-center text-xl tracking-widest mb-6"
              placeholder="••••"
            />

            <div className="flex gap-3">
              <button
                className="flex-1 bg-[#00B8E6] text-white py-2 rounded-xl"
                onClick={submitPassword}
              >
                เข้าร่วม
              </button>

              <button
                className="flex-1 bg-gray-300 py-2 rounded-xl"
                onClick={() => setSelectedRoom(null)}
              >
                ยกเลิก
              </button>
            </div>
          </Modal>
        )}

        {/* CREATE ROOM MODAL */}
        {createModal && (
          <Modal>
            <h3 className="text-2xl font-bold text-[#00B8E6] mb-4">
              สร้างห้องแชทใหม่
            </h3>

            <input
              placeholder="ชื่อห้องแชท"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 mb-4"
            />

            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 mb-4"
            >
              <option value="public">สาธารณะ (Public)</option>
              <option value="private">ส่วนตัว (Private)</option>
            </select>

            {roomType === "private" && (
              <input
                type="password"
                maxLength={4}
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 mb-4 text-center tracking-widest"
                placeholder="••••"
              />
            )}

            <button
              onClick={createRoom}
              className="w-full bg-[#00B8E6] text-white py-3 rounded-xl font-semibold mb-3"
            >
              สร้างห้อง
            </button>

            <button
              className="w-full text-gray-500 py-2"
              onClick={() => setCreateModal(false)}
            >
              ยกเลิก
            </button>
          </Modal>
        )}

      </div>
    </div>
  );
}

/* =========================
    ROOM CARD
========================== */
function RoomCard({ room, joinRoom }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-[#d4f7ff] flex flex-col justify-between">

      <div>
        <h3 className="text-lg font-bold text-[#00B8E6] truncate">
          {room.name}
        </h3>

        <p className="text-gray-600 text-sm mt-1">
          ทั้งหมด {room.members} / 10 คน
        </p>

        <p className="text-sm mt-1">
          {room.type === "public" ? (
            <span className="text-green-600 font-semibold">สาธารณะ (Public)</span>
          ) : (
            <span className="text-red-500 font-semibold">ส่วนตัว (Private)</span>
          )}
        </p>
      </div>

      <button
        className="mt-3 bg-[#00B8E6] hover:bg-[#009ccc] text-white py-2 rounded-lg font-semibold"
        onClick={() => joinRoom(room)}
      >
        เข้าร่วม
      </button>

    </div>
  );
}

/* =========================
    MODAL WRAPPER
========================== */
function Modal({ children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-xl">
        {children}
      </div>
    </div>
  );
}
