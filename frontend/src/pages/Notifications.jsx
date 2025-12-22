import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const [list, setList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await api.get("/notifications");
    setList(res.data.notifications);

    // mark read
    res.data.notifications.forEach((n) => {
      if (!n.is_read) api.post(`/notifications/${n.id}/read`);
    });
  };

  const handleClick = (n) => {
    if (n.type === "chat_message") navigate(`/chat/${n.friend_id}`);
    if (n.type === "friend_request") navigate("/friends");
    if (n.type === "group_invite") navigate(`/chat/group/${n.group_room_id}`);
  };

  const deleteItem = async (id) => {
    await api.delete(`/notifications/${id}`);
    setList((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = async () => {
    if (!window.confirm("ต้องการลบแจ้งเตือนทั้งหมดหรือไม่?")) return;

    await api.delete("/notifications");
    setList([]);
  };

  // ไอคอนตามประเภทแจ้งเตือน
  const getIcon = (type) => {
    switch (type) {
      case "chat_message":
        return "💬";
      case "friend_request":
        return "👥";
      case "group_invite":
        return "📢";
      default:
        return "🔔";
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#00B8E6]">แจ้งเตือนของคุณ</h1>

        {list.length > 0 && (
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-red-500 text-white rounded-xl shadow hover:bg-red-600"
          >
            ลบทั้งหมด
          </button>
        )}
      </div>

      {/* ไม่มีแจ้งเตือน */}
      {list.length === 0 && (
        <p className="text-gray-500 text-center mt-12">ยังไม่มีการแจ้งเตือน</p>
      )}

      {/* Scroll container */}
      <div className="max-h-[640px] overflow-y-auto pr-2 space-y-3">

        {list.map((n) => (
          <div
            key={n.id}
            onClick={() => handleClick(n)}
            className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition shadow 
              ${n.is_read ? "bg-white hover:bg-gray-50" : "bg-[#E9FBFF] border border-[#b3efff]"}`}
          >
            {/* ไอคอน */}
            <div className="text-3xl">
              {getIcon(n.type)}
            </div>

            {/* ข้อความ */}
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{n.title}</p>
              <p className="text-gray-600 text-sm">{n.body}</p>

              <p className="text-gray-400 text-xs mt-1">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>

            {/* unread dot */}
            {!n.is_read && (
              <div className="w-3 h-3 bg-blue-400 rounded-full mt-2"></div>
            )}

            {/* ปุ่มลบ */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteItem(n.id);
              }}
              className="text-red-500 hover:text-red-700 text-sm ml-2"
            >
              ลบ
            </button>
          </div>
        ))}

      </div>
    </div>
  );
}
