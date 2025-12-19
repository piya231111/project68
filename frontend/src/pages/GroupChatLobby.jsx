// src/pages/GroupChatLobby.jsx
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

  // โหลดห้องทั้งหมด
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

  // ============================
  // JOIN ROOM
  // ============================
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

  // ============================
  // CREATE ROOM
  // ============================
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

    // ⭐⭐⭐ หลังสร้างห้อง → เด้งเข้าห้องทันที
    navigate(`/chat/group/${data.room.id}`);

    setCreateModal(false);
    setNewRoomName("");
    setRoomPassword("");
  };

  // filter search
  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#E9FBFF] p-6">

      <h1 className="text-3xl text-[#00B8E6] font-bold mb-6">
        เลือกห้องแชทกลุ่ม
      </h1>

      {/* CREATE ROOM BUTTON */}
      <button
        onClick={() => setCreateModal(true)}
        className="bg-[#00B8E6] text-white px-5 py-3 rounded-xl font-semibold mb-6 hover:bg-[#009ccc]"
      >
        + สร้างห้องแชทใหม่
      </button>

      {/* SEARCH */}
      <input
        placeholder="ค้นหาห้องแชท..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-lg px-4 py-3 rounded-xl border border-[#b7edf7] shadow bg-white"
      />

      {/* POPULAR ROOMS */}
      <h2 className="text-xl font-semibold text-[#00B8E6] mt-8 mb-2">
        ⭐ ห้องยอดนิยม
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {popularRooms.map((room) => (
          <RoomCard room={room} joinRoom={joinRoom} key={room.id} />
        ))}
      </div>

      {/* ALL ROOMS */}
      <h2 className="text-xl font-semibold text-[#00B8E6] mt-8 mb-2">
        📋 ห้องทั้งหมด
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
        {filteredRooms.map((room) => (
          <RoomCard room={room} joinRoom={joinRoom} key={room.id} />
        ))}
      </div>

      {/* PRIVATE PASSWORD MODAL */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-xl text-center">

            <h3 className="text-xl font-bold mb-4">
              ห้อง {selectedRoom.name} ต้องการรหัสเข้าร่วม
            </h3>

            <input
              type="password"
              maxLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-center text-xl tracking-widest"
              placeholder="••••"
            />

            <div className="flex gap-3 mt-6">
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

          </div>
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      {createModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-xl">

            <h3 className="text-2xl font-bold text-[#00B8E6] mb-4">
              สร้างห้องแชทใหม่
            </h3>

            <input
              placeholder="ชื่อห้องแชท"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 mb-4"
            />

            <label className="font-semibold">ประเภทห้อง</label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 mb-4"
            >
              <option value="public">สาธารณะ (Public)</option>
              <option value="private">ส่วนตัว (Private)</option>
            </select>

            {roomType === "private" && (
              <>
                <label className="font-semibold">รหัสเข้าห้อง (4 หลัก)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 mb-4 text-center tracking-widest"
                  placeholder="••••"
                />
              </>
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

          </div>
        </div>
      )}

    </div>
  );
}

// Room Card Component
function RoomCard({ room, joinRoom }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow border border-[#d4f7ff]">

      <h3 className="text-lg font-bold text-[#00B8E6]">
        {room.name}
      </h3>

      <p className="text-gray-600 text-sm mt-1">
        สมาชิก: {room.members} คน
      </p>

      <p className="text-sm mt-1">
        ประเภท:{" "}
        {room.type === "public" ? (
          <span className="text-green-600 font-semibold">Public</span>
        ) : (
          <span className="text-red-500 font-semibold">Private</span>
        )}
      </p>

      <button
        className="w-full mt-4 bg-[#00B8E6] hover:bg-[#009ccc] text-white py-2 rounded-xl font-semibold"
        onClick={() => joinRoom(room)}
      >
        เข้าร่วม
      </button>

    </div>
  );
}
