import { useState, useEffect } from "react";
import FriendMenu from "./FriendMenu";
import { api } from "../api.js";

export default function FriendRow({
  friend,
  isFriend = false,
  isFavorite = false,
  isIncomingRequest = false,
  isSentRequest = false,
  onClick,
  onToggleFavorite,
  onRemoveFriend,
  onAcceptRequest,
  onDeclineRequest,
  onSendRequest,
}) {
  const [openMenu, setOpenMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const [avatar, setAvatar] = useState(null);
  const [item, setItem] = useState(null);

  // 🔥 สถานะออนไลน์แบบสด
  const [isOnline, setIsOnline] = useState(friend.is_online);

  useEffect(() => {
    if (!friend) return;

    // โหลด Avatar
    if (friend.avatar_id) {
      api.get(`/avatars/${friend.avatar_id}`).then((res) => {
        setAvatar(res.data);
      });
    }

    // โหลด Item
    if (friend.item_id) {
      api.get(`/items/${friend.item_id}`).then((res) => {
        setItem(res.data);
      });
    }

    // 🔥 โหลดสถานะออนไลน์ real-time
    api.get(`/friends/${friend.id}/status`)
      .then((res) => setIsOnline(res.data.is_online))
      .catch(() => { });

  }, [friend]);

  return (
    <li
      className="py-4 px-3 flex justify-between items-center hover:bg-[#E9FBFF] transition-all rounded-xl cursor-pointer relative"
      onClick={onClick}
    >
      <div className="flex items-center flex-1 gap-3">

        {/* Avatar + Item */}
        <div className="relative w-14 h-14">
          {item && (
            <img
              src={item.imageUrl || item.image_url}
              className="absolute inset-0 w-full h-full object-contain z-10 opacity-95"
              alt="item"
            />
          )}

          {avatar ? (
            <img
              src={avatar.image_url || avatar.imageUrl}
              className="absolute inset-0 w-full h-full object-contain z-20"
              alt="avatar"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold text-lg z-20">
              {friend.display_name?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </div>

        {/* ข้อมูลเพื่อน */}
        <div>
          <p className="font-medium text-gray-800 flex items-center gap-2">
            {friend.display_name}
            {isFavorite && <span className="text-yellow-400">⭐</span>}
          </p>

          {/* 🟢 ออนไลน์ / ⚪ ออฟไลน์ */}
          <p className="text-sm">
            {isOnline ? (
              <span className="text-green-500">🟢 ออนไลน์</span>
            ) : (
              <span className="text-gray-400">⚪ ออฟไลน์</span>
            )}
          </p>

          <p className="text-sm text-gray-500">
            {friend.country || "ไม่ระบุประเทศ"} —{" "}
            {friend.interests?.join(", ") || "ไม่มีข้อมูลความสนใจ"}
          </p>
        </div>
      </div>

      {/* ปุ่มต่าง ๆ */}
      <div className="flex items-center gap-3">

        {/* คำขอเข้ามา */}
        {isIncomingRequest && (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onAcceptRequest(friend.id)}
              className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600"
            >
              ยอมรับ
            </button>
            <button
              onClick={() => onDeclineRequest(friend.id)}
              className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600"
            >
              ปฏิเสธ
            </button>
          </div>
        )}

        {/* ยังไม่ใช่เพื่อน */}
        {!isFriend && !isIncomingRequest && (
          <div onClick={(e) => e.stopPropagation()}>
            {isSentRequest ? (
              <span className="text-gray-500 italic">ส่งคำขอแล้ว ...</span>
            ) : (
              <button
                onClick={() => onSendRequest(friend.id)}
                className="bg-[#00B8E6] text-white px-4 py-2 rounded-xl hover:bg-[#009ecc]"
              >
                เพิ่มเพื่อน
              </button>
            )}
          </div>
        )}

        {/* เพื่อนแล้ว → มีเมนู */}
        {isFriend && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.target.getBoundingClientRect();

                setMenuPos({
                  x: rect.left - 120,
                  y: rect.bottom + 5,
                });

                setOpenMenu(!openMenu);
              }}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              ⋮
            </button>

            {openMenu && (
              <FriendMenu
                friend={friend}
                isFavorite={isFavorite}
                menuPos={menuPos}
                onToggleFavorite={onToggleFavorite}
                onRemoveFriend={onRemoveFriend}
                onClose={() => setOpenMenu(false)}
              />
            )}
          </div>
        )}
      </div>
    </li>
  );
}
