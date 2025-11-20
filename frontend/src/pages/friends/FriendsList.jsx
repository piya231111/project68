import FriendRow from "../../components/FriendRow";

export default function FriendsList({
  friends,
  onOpenDetail,
  onToggleFavorite,
  onRemoveFriend,
}) {
  if (!friends.length)
    return <p className="text-gray-500 text-center">ยังไม่มีเพื่อน</p>;

  const fav = friends.filter((f) => f.is_favorite);
  const normal = friends.filter((f) => !f.is_favorite);

  return (
    <>
      {/* ⭐ Favorite */}
      <h3 className="text-xl text-yellow-500 font-semibold mb-3">
        ⭐ เพื่อนที่ปักดาว ({fav.length})
      </h3>
      <ul className="mb-8 divide-y bg-white/70 rounded-xl">
        {fav.map((f) => (
          <FriendRow
            key={f.id}
            friend={f}
            isFriend={true}
            isFavorite={true}
            onClick={() => onOpenDetail(f)}
            onToggleFavorite={onToggleFavorite}
            onRemoveFriend={onRemoveFriend}
          />
        ))}
      </ul>

      <hr className="my-6 border-dashed border-[#a5e8f7]" />

      {/* ⭐ Normal Friends */}
      <h3 className="text-xl text-gray-700 font-semibold mb-3">
        เพื่อนทั้งหมด ({normal.length})
      </h3>
      <ul className="divide-y bg-white/70 rounded-xl">
        {normal.map((f) => (
          <FriendRow
            key={f.id}
            friend={f}
            isFriend={true}
            isFavorite={false}
            onClick={() => onOpenDetail(f)}
            onToggleFavorite={onToggleFavorite}
            onRemoveFriend={onRemoveFriend}
          />
        ))}
      </ul>
    </>
  );
}
