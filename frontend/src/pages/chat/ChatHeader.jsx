import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function ChatHeader({ friend }) {
  const navigate = useNavigate();

  const [avatarObj, setAvatarObj] = useState(null);
  const [itemObj, setItemObj] = useState(null);

  // โหลด item + avatar จาก backend
  useEffect(() => {
    if (friend?.avatar_id) {
      api.get(`/avatars/${friend.avatar_id}`).then((res) => {
        setAvatarObj(res.data);
      });
    }

    if (friend?.item_id) {
      api.get(`/items/${friend.item_id}`).then((res) => {
        setItemObj(res.data);
      });
    }
  }, [friend]);

  const avatarUrl =
    avatarObj?.image_url ||
    avatarObj?.imageUrl ||
    (friend?.avatar_id
      ? `/uploads/avatars/avatar${String(friend.avatar_id).padStart(2, "0")}.png`
      : null);

  const itemUrl =
    itemObj?.image_url ||
    itemObj?.imageUrl ||
    (friend?.item_id
      ? `/uploads/items/item${String(friend.item_id).padStart(2, "0")}.png`
      : null);

  console.log("item =", itemObj);
  console.log("itemUrl =", itemUrl);

  return (
    <div className="flex items-center gap-3 bg-white px-6 py-4 shadow">
      <button
        onClick={() => navigate(-1)}
        className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
      >
        กลับ
      </button>

      <div className="relative w-20 h-20 rounded-full overflow-hidden border bg-white flex-shrink-0">

        {/* ITEM ด้านหลัง avatar */}
        {itemUrl && (
          <img
            src={itemUrl}
            alt="item"
            className="
      absolute inset-0 
      w-full h-full 
      object-contain
      z-10
      scale-110       
      -translate-y-1 
    "
          />
        )}

        {/* AVATAR อยู่ด้านหน้า ถูกครอปพร้อม item */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="avatar"
            className="
        absolute inset-0 
        w-full h-full 
        object-contain
        z-20
      "
          />
        ) : (
          <div className="absolute inset-0 flex justify-center items-center text-white font-semibold bg-gray-300 z-20">
            {friend?.display_name?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>

      <div>
        <p className="font-semibold text-gray-800">{friend?.display_name}</p>
        <p className="text-sm">
          {friend?.is_online ? (
            <span className="text-green-500">🟢 ออนไลน์</span>
          ) : (
            <span className="text-gray-400">⚪ ออฟไลน์</span>
          )}
        </p>
      </div>
    </div>
  );
}
