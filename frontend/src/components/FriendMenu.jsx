export default function FriendMenu({
  friend,
  isFavorite,
  menuPos,              // ← ต้องรับตำแหน่ง
  onToggleFavorite,
  onRemoveFriend,
  onClose,
}) {
  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-xl shadow-lg w-40 z-[9999] animate-fadeIn"
      style={{
        top: menuPos.y,    // ← ใช้ตำแหน่งที่ส่งมาจาก FriendRow
        left: menuPos.x,
      }}
    >
      {/* ปักดาว / เอาดาวออก */}
      <button
        onClick={() => {
          onToggleFavorite(friend.id);
          onClose();
        }}
        className="w-full text-left px-4 py-2 hover:bg-yellow-50 text-yellow-600 rounded-t-xl"
      >
        {isFavorite ? "เอาดาวออก" : "ปักดาวเพื่อน"}
      </button>

      {/* ลบเพื่อน */}
      <button
        onClick={() => {
          if (window.confirm(`ต้องการลบเพื่อน ${friend.display_name} ใช่ไหม?`)) {
            onRemoveFriend(friend.id);
          }
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded-b-xl"
      >
        ลบเพื่อน
      </button>
    </div>
  );
}
