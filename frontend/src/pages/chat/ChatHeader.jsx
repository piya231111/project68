import React from "react";
import { useNavigate } from "react-router-dom";

export default function ChatHeader({ friend, avatar, item, isOnline }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 bg-white px-6 py-4 shadow">

      <button
        onClick={() => navigate(-1)}
        className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
      >
        กลับ
      </button>

      <div className="relative w-14 h-14">
        {item?.image_url && (
          <img src={item.image_url}
               className="absolute inset-0 w-full h-full z-10" />
        )}

        {avatar?.image_url ? (
          <img src={avatar.image_url}
               className="absolute inset-0 w-full h-full z-20" />
        ) : (
          <div className="absolute inset-0 w-full h-full rounded-full bg-gray-300 flex justify-center items-center">
            {friend?.display_name?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>

      <div>
        <p className="font-semibold text-gray-800">{friend?.display_name}</p>
        <p className="text-sm">
          {isOnline ? (
            <span className="text-green-500">🟢 ออนไลน์</span>
          ) : (
            <span className="text-gray-400">⚪ ออฟไลน์</span>
          )}
        </p>
      </div>
    </div>
  );
}
