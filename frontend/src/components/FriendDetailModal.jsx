// src/components/FriendDetailModal.jsx
import React, { useState, useEffect } from "react";
import { api } from "../api";

export default function FriendDetailModal({
  friend,
  onClose,
  onAddFriend,
  onRemoveFriend,
  onToggleFavorite,
  onBlockUser,
  onChat,
  onAcceptRequest,
  onDeclineRequest,
}) {
  if (!friend) return null;

  const me = JSON.parse(localStorage.getItem("user"));
  const isMe = me && friend.id === me.id;   // เช็กว่าเป็นตัวเองไหม

  const [avatar, setAvatar] = useState(null);
  const [item, setItem] = useState(null);
  const [isOnline, setIsOnline] = useState(friend.is_online);

  useEffect(() => {
    if (!friend) return;

    if (friend.avatar_id) {
      api.get(`/avatars/${friend.avatar_id}`)
        .then((res) => setAvatar(res.data))
        .catch(() => { });
    }

    if (friend.item_id) {
      api.get(`/items/${friend.item_id}`)
        .then((res) => setItem(res.data))
        .catch(() => { });
    }

    api.get(`/friends/${friend.id}/status`)
      .then((res) => setIsOnline(res.data.is_online))
      .catch(() => { });
  }, [friend]);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white/95 rounded-3xl shadow-2xl w-full max-w-md p-8 relative border border-[#bcecff] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ปุ่มปิด */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
        >
          ✖
        </button>

        {/* Avatar + Item */}
        <div className="flex justify-center mb-6">
          <div className="relative w-36 h-36 drop-shadow-md">
            {item && (
              <img
                src={item.image_url || item.imageUrl}
                alt="item"
                className="absolute inset-0 w-full h-full object-contain opacity-90 z-10"
              />
            )}

            {avatar && (
              <img
                src={avatar.image_url}
                alt="avatar"
                className="absolute inset-0 w-full h-full object-contain z-20"
              />
            )}
          </div>
        </div>

        {/* ชื่อ + สถานะ */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-extrabold text-gray-800 flex items-center justify-center gap-2">
            {friend.display_name}
            {friend.is_favorite && <span className="text-yellow-400">⭐</span>}
          </h2>

          <p
            className={`text-sm font-medium ${isOnline ? "text-green-500" : "text-gray-400"
              }`}
          >
            {isOnline ? "🟢 ออนไลน์" : "⚪ ออฟไลน์"}
          </p>
        </div>

        {/* รายละเอียด */}
        <div className="space-y-4 bg-[#F4FBFF] p-4 rounded-xl border border-[#d4f6ff]">
          <div className="flex justify-between text-gray-700">
            <span className="font-semibold">ประเทศ:</span>
            <span className="font-medium">{friend.country || "—"}</span>
          </div>

          <div>
            <span className="font-semibold text-gray-700">ความสนใจ:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(friend.interests || []).length > 0 ? (
                friend.interests.map((cat) => (
                  <span
                    key={cat}
                    className="bg-[#E9FBFF] text-[#00B8E6] px-3 py-1 rounded-full text-sm shadow-sm"
                  >
                    {cat}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 italic">ไม่มีข้อมูล</span>
              )}
            </div>
          </div>
        </div>

        {/*เงื่อนไข: ถ้าเป็นตัวเอง → ไม่มีปุ่มให้กด */}
        {isMe ? (
          <div className="mt-6 text-center text-gray-400 italic">
            โปรไฟล์ของคุณ
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3">

            {/* ✅ อยู่ในห้องแล้ว */}
            {friend.isInRoom ? (
              <div className="text-center text-green-600 font-semibold py-3 rounded-xl bg-green-50">
                เพื่อนของคุณอยู่ในห้องนี้แล้ว
              </div>

            ) : friend.isIncomingRequest ? (
              <>
                <button
                  onClick={() => onAcceptRequest?.(friend.id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold"
                >
                  ยอมรับคำขอ
                </button>

                <button
                  onClick={() => onDeclineRequest?.(friend.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold"
                >
                  ปฏิเสธคำขอ
                </button>
              </>

            ) : friend.isFriend ? (
              <>
                <button
                  onClick={() => onChat?.(friend.id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold"
                >
                  แชท
                </button>

                <button
                  onClick={() => onToggleFavorite?.(friend.id)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-xl font-semibold"
                >
                  {friend.is_favorite ? "เอาดาวออก" : "ปักดาวเพื่อน"}
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`ต้องการลบเพื่อน ${friend.display_name}?`)) {
                      onRemoveFriend?.(friend.id);
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold"
                >
                  ลบเพื่อน
                </button>
              </>

            ) : (
              <>
                {!friend.isSentRequest ? (
                  <button
                    onClick={() => onAddFriend?.(friend.id)}
                    className="bg-[#00B8E6] hover:bg-[#009ecc] text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    เพิ่มเพื่อน
                  </button>
                ) : (
                  <p className="text-center text-gray-500">📨 ส่งคำขอแล้ว</p>
                )}

                <button
                  onClick={() => {
                    onBlockUser?.(friend.id);
                    onClose();
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold"
                >
                  บล็อคผู้ใช้
                </button>
              </>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
