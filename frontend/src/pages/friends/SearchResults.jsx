import FriendRow from "../../components/FriendRow";

export default function SearchResults({
  loading,
  results,
  sentRequests,
  onSendRequest,
  onOpenDetail,
}) {
  if (loading) return <p className="text-gray-500">กำลังค้นหา...</p>;

  if (!results.length)
    return <p className="text-gray-500">ไม่พบผลลัพธ์</p>;

  return (
    <ul
      className="
        divide-y bg-white/70 rounded-xl
        max-h-[400px]           /* ⭐ สูงสุดประมาณ 5 รายชื่อ */
        overflow-y-auto         /* ⭐ เปิดให้เลื่อนดู */
        pr-2                    /* ⭐ กัน scrollbar ทับ */
      "
    >
      {results.map((u) => (
        <FriendRow
          key={u.id}
          friend={u}
          isFriend={u.isFriend}
          isSentRequest={sentRequests.includes(u.id)}
          onClick={() => onOpenDetail(u)}
          onSendRequest={onSendRequest}
        />
      ))}
    </ul>
  );
}
