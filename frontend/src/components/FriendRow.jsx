import { useState } from "react";
import FriendMenu from "./FriendMenu";

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

  return (
    <li
      className="py-4 px-3 flex justify-between items-center hover:bg-[#E9FBFF] transition-all rounded-xl cursor-pointer relative"
      onClick={onClick}
    >
      {/* 🔹 ซ้าย: ชื่อ + ประเทศ/หมวดหมู่ */}
      <div className="flex-1">
        <p className="font-medium text-gray-800">
          {friend.display_name}
          {isFavorite && <span className="text-yellow-400 ml-1">⭐</span>}
        </p>
        <p className="text-sm text-gray-500">
          {friend.country || "ไม่ระบุประเทศ"} —{" "}
          {friend.interests?.join(", ") || "ไม่มีข้อมูลความสนใจ"}
        </p>
      </div>

      {/* 🔹 ขวา: ปุ่มจุดเมนู หรือ ปุ่มยอมรับ/ปฏิเสธ */}
      <div className="flex items-center gap-3">

        {/* กรณี: คำขอเข้ามา */}
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

        {/* กรณี: ผลการค้นหาที่ยังไม่เป็นเพื่อน */}
        {!isFriend && !isIncomingRequest && (
          <>
            {isSentRequest ? (
              <span className="text-gray-500 italic">📨 ส่งคำขอแล้ว</span>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendRequest(friend.id);
                }}
                className="bg-[#00B8E6] text-white px-4 py-2 rounded-xl hover:bg-[#009ecc]"
              >
                เพิ่มเพื่อน
              </button>
            )}
          </>
        )}

        {/* กรณี: เป็นเพื่อนแล้ว → แสดงเมนู ⋮ */}
        {isFriend && (
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              ⋮
            </button>

            {/* Popup Menu */}
            {openMenu && (
              <FriendMenu
                friend={friend}
                isFavorite={isFavorite}
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
