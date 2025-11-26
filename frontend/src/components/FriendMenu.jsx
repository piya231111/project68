export default function FriendMenu({
  friend,
  isFavorite,
  onToggleFavorite,
  onRemoveFriend,
  onClose,
}) {
  return (
    <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg w-40 z-50 animate-fadeIn">
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
