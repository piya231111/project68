import { useState } from "react";
import { api } from "../../api";
import FriendDetailModal from "../../components/FriendDetailModal";

const BACKEND_URL = "http://localhost:7000";

export default function MessageBubble({ message }) {
  const me = JSON.parse(localStorage.getItem("user"));
  const userId = me?.id;

  const senderId = message.sender_id ?? message.sender;
  const isMine = String(senderId) === String(userId);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const openDetail = async () => {
    if (isMine) return;

    try {
      const userRes = await api.get(`/users/${senderId}`);
      const statusRes = await api.get(`/friends/${senderId}/status`);

      setSelectedUser({
        ...userRes.data,
        isFriend: statusRes.data.isFriend,
        isIncomingRequest: statusRes.data.isIncomingRequest,
        isSentRequest: statusRes.data.isSentRequest,
      });

      setShowDetail(true);
    } catch (e) {
      console.error(e);
      alert("โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
    }
  };

  const timeValue = message.created_at || message.time;
  const time = timeValue
    ? new Date(timeValue).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
    : "";

  const isMedia =
    message.type === "image" ||
    message.type === "gif" ||
    message.type === "video";

  const avatar =
    message.avatar_id
      ? `${BACKEND_URL}/uploads/avatars/avatar${String(
        message.avatar_id
      ).padStart(2, "0")}.png`
      : isMine
        ? `${BACKEND_URL}/uploads/avatars/avatar${String(me.avatar_id).padStart(2, "0")}.png`
        : "/default-avatar.png";

  const item =
    message.item_id
      ? `${BACKEND_URL}/uploads/items/item${String(message.item_id).padStart(2, "0")}.png`
      : isMine
        ? `${BACKEND_URL}/uploads/items/item${String(me.item_id).padStart(2, "0")}.png`
        : null;

  const mediaUrlRaw = message.file_url || message.fileUrl;

  const mediaUrl = mediaUrlRaw
    ? mediaUrlRaw.startsWith("http")
      ? mediaUrlRaw
      : `${BACKEND_URL}${mediaUrlRaw}`
    : null;


  return (
    <>
      {/* ===== MESSAGE ===== */}
      <div className={`flex my-4 ${isMine ? "justify-end" : "justify-start"}`}>
        <div
          className={`flex gap-2 ${isMine ? "flex-row-reverse items-end" : "items-start"
            }`}
        >
          {/* ===== AVATAR (CLICKABLE) ===== */}
          <button
            onClick={openDetail}
            className="relative shrink-0 w-14 h-14 rounded-full overflow-hidden border shadow bg-white focus:outline-none"
          >
            {item && (
              <img
                src={item}
                alt="item"
                className="absolute inset-0 w-full h-full object-contain scale-[1.08] translate-y-[3%] opacity-75 z-0 pointer-events-none"
              />
            )}

            <img
              src={avatar}
              onError={(e) => (e.target.src = "/default-avatar.png")}
              className="absolute inset-0 w-full h-full object-contain scale-[1.05] translate-y-[2%] z-10"
              alt="avatar"
            />
          </button>

          {/* ===== MESSAGE BLOCK ===== */}
          <div
            className={`flex flex-col max-w-xs ${isMine ? "items-end" : "items-start"
              }`}
          >
            <p
              onClick={openDetail}
              className={`text-[11px] font-medium mb-1 cursor-pointer hover:underline ${isMine ? "text-gray-500" : "text-blue-500"
                }`}
            >
              {isMine
                ? "คุณ"
                : message.sender_name || message.senderName || "ไม่ทราบชื่อ"}
            </p>

            {isMedia && mediaUrl && (
              <div className="my-1">
                {message.type === "video" ? (
                  <video
                    src={mediaUrl}
                    controls
                    className="max-w-[260px] rounded-2xl shadow"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    className="max-w-[260px] rounded-2xl shadow"
                    alt="media"
                  />
                )}
              </div>
            )}

            {!isMedia && (
              <div
                className={`px-4 py-2 rounded-2xl shadow text-sm ${isMine
                  ? "bg-[#00B8E6] text-white rounded-br-md"
                  : "bg-white border text-gray-800 rounded-bl-md"
                  }`}
              >
                {message.text}
              </div>
            )}

            <span className="text-[10px] text-gray-400 mt-1">{time}</span>
          </div>
        </div>
      </div>

      {/* ===== FRIEND DETAIL MODAL ===== */}
      {showDetail && selectedUser && (
        <FriendDetailModal
          friend={selectedUser}
          onClose={() => {
            setShowDetail(false);
            setSelectedUser(null);
          }}
        />
      )}
    </>
  );
}
