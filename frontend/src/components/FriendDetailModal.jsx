// src/components/FriendDetailModal.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function FriendDetailModal({
  friend,
  onClose,
  onAddFriend,
  onRemoveFriend,
  onToggleFavorite,
  onBlockUser,
  onChat,
}) {
  if (!friend) return null;

  const navigate = useNavigate();

  const [avatar, setAvatar] = useState(null);
  const [item, setItem] = useState(null);

  useEffect(() => {
    if (!friend) return;

    if (friend.avatar_id) {
      api.get(`/avatars/${friend.avatar_id}`).then((res) => setAvatar(res.data));
    }

    if (friend.item_id) {
      api.get(`/items/${friend.item_id}`).then((res) => setItem(res.data));
    }
  }, [friend]);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn"
      onClick={onClose}   // ⭐ คลิกพื้นหลังเพื่อปิด
    >
      <div
        className="bg-white/95 rounded-3xl shadow-2xl w-full max-w-md p-8 relative border border-[#bcecff] animate-slideUp"
        onClick={(e) => e.stopPropagation()}  // ❗ กันไม่ให้คลิกปิดเวลาอยู่ใน modal
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
                className="absolute inset-0 w-full h-full object-contain opacity-95 z-10"
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

        {/* ชื่อ */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-extrabold text-gray-800 flex items-center justify-center gap-2">
            {friend.display_name}
            {friend.is_favorite && <span className="text-yellow-400">⭐</span>}
          </h2>

          <p
            className={`text-sm font-medium ${friend.is_online ? "text-green-500" : "text-gray-400"
              }`}
          >
            {friend.is_online ? "🟢 ออนไลน์" : "⚪ ออฟไลน์"}
          </p>
        </div>

        {/* รายละเอียด */}
        <div className="space-y-4 bg-[#F4FBFF] p-4 rounded-xl border border-[#d4f6ff]">
          <div className="flex justify-between text-gray-700">
            <span className="font-semibold">🌍 ประเทศ:</span>
            <span className="font-medium">{friend.country || "—"}</span>
          </div>

          <div>
            <span className="font-semibold text-gray-700">🎯 ความสนใจ:</span>
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

        {/* ปุ่ม Action */}
        <div className="mt-8 flex flex-col gap-3">

          {/* ⭐ คำขอเข้ามา → ยอมรับ / ปฏิเสธ */}
          {friend.isIncomingRequest ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddFriend(friend.id); // ใช้ accept request
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
              >
                ยอมรับคำขอ
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFriend(friend.id); // ใช้ decline request
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
              >
                ปฏิเสธคำขอ
              </button>
            </>
          ) : !friend.isFriend ? (
            /* ⭐ ยังไม่เป็นเพื่อน → เพิ่มเพื่อน / บล็อค */
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddFriend(friend.id);
                }}
                className="bg-[#00B8E6] hover:bg-[#009ecc] text-white px-6 py-3 rounded-xl font-semibold shadow-md"
              >
                เพิ่มเพื่อน
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBlockUser(friend.id); // ยิง API บล็อคผู้ใช้
                  onClose();              // ปิด modal
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
              >
                บล็อค
              </button>
            </>
          ) : (
            /* ⭐ เป็นเพื่อนแล้ว → แชท / ดาว / ลบ */
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChat(friend.id);
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
              >
                แชท
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(friend.id);
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
              >
                {friend.is_favorite ? "⭐ เอาดาวออก" : "⭐ ปักดาวเพื่อน"}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`ต้องการลบเพื่อน ${friend.display_name}?`)) {
                    onRemoveFriend(friend.id);
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
              >
                ลบเพื่อน
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
