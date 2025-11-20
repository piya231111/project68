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
}) {
  if (!friend) return null;

  const [avatar, setAvatar] = useState(null);
  const [item, setItem] = useState(null);

  // โหลดรูป avatar + item จาก API เหมือนหน้า Home
  useEffect(() => {
    if (!friend) return;

    console.log("FRIEND DATA:", friend);

    if (friend.avatar_id) {
      api.get(`/avatars/${friend.avatar_id}`).then((res) => {
        console.log("Avatar API:", res.data);
        setAvatar(res.data);
      });
    }

    if (friend.item_id) {
      api.get(`/items/${friend.item_id}`).then((res) => {
        console.log("Item API:", res.data);
        setItem(res.data);
      });
    }
  }, [friend]);

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative border border-[#a5e8f7]">

        {/* ปิด */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl"
        >
          ✖
        </button>

        {/* Avatar + Item */}
        <div className="relative flex justify-center mb-6">
          <div className="relative w-32 h-32">

            {/* item */}
            {(item?.image_url || item?.imageUrl) && (
              <img
                src={item.image_url || item.imageUrl}
                alt="item"
                className="absolute inset-0 w-full h-full object-contain z-10 opacity-95"
              />
            )}

            {/* avatar */}
            {avatar?.image_url && (
              <img
                src={avatar.image_url}
                alt="avatar"
                className="absolute inset-0 w-full h-full object-contain z-20"
              />
            )}
          </div>
        </div>

        {/* ชื่อ */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            {friend.display_name}
            {friend.is_favorite && <span className="text-yellow-400">⭐</span>}
          </h2>

          <p className={`text-sm ${friend.is_online ? "text-green-500" : "text-gray-400"}`}>
            {friend.is_online ? "🟢 ออนไลน์" : "⚪ ออฟไลน์"}
          </p>
        </div>

        {/* รายละเอียด */}
        <div className="space-y-3 text-gray-700">
          <div className="flex justify-between">
            <span className="font-semibold">🌍 ประเทศ:</span>
            <span>{friend.country || "—"}</span>
          </div>

          <div>
            <span className="font-semibold">🎯 ความสนใจ:</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {(friend.interests || []).map((cat) => (
                <span
                  key={cat}
                  className="bg-[#E9FBFF] text-[#00B8E6] px-3 py-1 rounded-full text-sm"
                >
                  {cat}
                </span>
              ))}

              {(!friend.interests || friend.interests.length === 0) && (
                <span className="text-gray-400 italic">ไม่มีข้อมูล</span>
              )}
            </div>
          </div>
        </div>

        {/* ปุ่ม action */}
        <div className="text-center mt-8 flex flex-col gap-3">
          {!friend.isFriend ? (
            <>
              <button
                onClick={() => onAddFriend(friend.id)}
                className="bg-[#00B8E6] hover:bg-[#009ecc] text-white px-6 py-2 rounded-xl"
              >
                ➕ เพิ่มเพื่อน
              </button>

              <button
                onClick={() => onBlockUser(friend.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl"
              >
                🚫 บล็อค
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onChat(friend.id)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl"
              >
                💬 แชท
              </button>

              <button
                onClick={() => onToggleFavorite(friend.id)}
                className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-2 rounded-xl"
              >
                {friend.is_favorite ? "⭐ เอาดาวออก" : "⭐ ปักดาวเพื่อน"}
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`คุณต้องการลบเพื่อน ${friend.display_name} ใช่ไหม?`)) {
                    onRemoveFriend(friend.id);
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl"
              >
                ❌ ลบเพื่อน
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
