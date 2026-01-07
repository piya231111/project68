import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import FriendDetailModal from "../../components/FriendDetailModal";

export default function ChatHeader({ friend }) {
  const navigate = useNavigate();

  const [avatarObj, setAvatarObj] = useState(null);
  const [itemObj, setItemObj] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [friendStatus, setFriendStatus] = useState(null);

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

  useEffect(() => {
    if (!friend?.id) return;

    api.get(`/friends/${friend.id}/status`)
      .then((res) => {
        setFriendStatus(res.data);
      })
      .catch(() => { });
  }, [friend]);

  return (
    <>
      <div className="flex items-center gap-3 bg-white px-6 py-4 shadow">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
        >
          กลับ
        </button>

        {/* ===== AVATAR (คลิกเปิดดีเทล) ===== */}
        <button
          onClick={() => setShowDetail(true)}
          className="relative w-20 h-20 rounded-full overflow-hidden border bg-white flex-shrink-0 focus:outline-none"
        >
          {/* ITEM : ซ้อนหลัง */}
          {itemUrl && (
            <img
              src={itemUrl}
              alt="item"
              className="absolute inset-0 w-full h-full object-contain z-10 scale-[1.05] translate-y-[2%] pointer-events-none"
            />
          )}

          {/* AVATAR */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              className="absolute inset-0 w-full h-full object-contain z-20"
            />
          ) : (
            <div className="absolute inset-0 flex justify-center items-center text-white font-semibold bg-gray-300 z-20">
              {friend?.display_name?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </button>

        {/* ===== NAME + STATUS ===== */}
        <div>
          <p
            onClick={() => setShowDetail(true)}
            className="font-semibold text-gray-800 cursor-pointer hover:underline"
          >
            {friend?.display_name}
          </p>

          <p className="text-sm">
            {friend?.is_online ? (
              <span className="text-green-500">🟢 ออนไลน์</span>
            ) : (
              <span className="text-gray-400">⚪ ออฟไลน์</span>
            )}
          </p>
        </div>
      </div>

      {/* ===== FRIEND DETAIL MODAL ===== */}
      {showDetail && (
        <FriendDetailModal
          friend={{
            ...friend,
            isFriend: friendStatus?.isFriend,
            isIncomingRequest: friendStatus?.isIncomingRequest,
            isSentRequest: friendStatus?.isSentRequest,
            isInRoom: friendStatus?.isInRoom,
          }}
          onClose={() => setShowDetail(false)}
        />
      )}

    </>
  );
}
