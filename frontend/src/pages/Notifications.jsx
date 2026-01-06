import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const [list, setList] = useState([]);
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await api.get("/notifications");
    setList(res.data.notifications);
  };

  const handleClick = async (n) => {
    try {
      // mark read เฉพาะอันที่กด
      if (!n.is_read) {
        await api.post(`/notifications/${n.id}/read`);
        setList((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, is_read: true } : x
          )
        );
      }

      if (n.type === "chat_message") {
        navigate(`/chat/${n.friend_id}`);
        return;
      }

      if (n.type === "friend_request") {
        navigate("/friends");
        return;
      }

      if (n.type === "group_invite") {
        const res = await api.get(
          `/chat/group/${n.group_room_id}/exists`
        );

        if (!res.data.exists) {
          alert("ห้องแชทนี้ถูกลบไปแล้ว");

          await api.delete(`/notifications/${n.id}`);
          setList((prev) => prev.filter((x) => x.id !== n.id));
          return;
        }

        navigate(`/chat/group/${n.group_room_id}`);
      }

    } catch (err) {
      console.error(err);
      alert("ไม่สามารถเข้าห้องแชทได้ (ห้องอาจถูกลบแล้ว)");

      await api.delete(`/notifications/${n.id}`);
      setList((prev) => prev.filter((x) => x.id !== n.id));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "one") {
      await api.delete(`/notifications/${deleteTarget.id}`);
      setList((prev) =>
        prev.filter((n) => n.id !== deleteTarget.id)
      );
    }

    if (deleteTarget.type === "all") {
      await api.delete("/notifications");
      setList([]);
    }

    setShowDeleteConfirm(false);
    setDeleteTarget(null);
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
            onClick={() => {
              setDeleteTarget({ type: "all" });
              setShowDeleteConfirm(true);
            }}
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
                setDeleteTarget({ type: "one", id: n.id });
                setShowDeleteConfirm(true);
              }}
              className="text-red-500 hover:text-red-700 text-sm ml-2"
            >
              ลบ
            </button>
          </div>
        ))}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm shadow-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-3">
                ยืนยันการลบ
              </h2>

              <p className="text-gray-600 mb-6">
                {deleteTarget?.type === "all"
                  ? "คุณต้องการลบแจ้งเตือนทั้งหมดใช่หรือไม่?"
                  : "คุณต้องการลบแจ้งเตือนนี้ใช่หรือไม่?"}
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  ยกเลิก
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
