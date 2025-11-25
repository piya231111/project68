import FriendRow from "../../components/FriendRow";

export default function SearchResults({
  loading,
  results,
  sentRequests,
  incomingRequests,
  onSendRequest,
  onAccept,
  onDecline,
  onOpenDetail,
}) {
  if (loading) return <p className="text-gray-500">กำลังค้นหา...</p>;

  // ⭐ กรองเอาคนที่ส่งคำขอมาให้เราออกเลย
  const filteredResults = results.filter(
    (u) => !incomingRequests.includes(u.id)
  );

  if (!filteredResults.length)
    return <p className="text-gray-500">ไม่พบผลลัพธ์</p>;

  return (
    <ul
      className="
        divide-y bg-white/70 rounded-xl
        max-h-[400px]
        overflow-y-auto
        pr-2
      "
    >
      {filteredResults.map((u) => {
        const isSent = sentRequests.includes(u.id); // เราเป็นคนส่งคำขอ

        return (
          <FriendRow
            key={u.id}
            friend={u}

            isFriend={false}
            isIncomingRequest={false}  // ⭐ ไม่ต้องแสดง ยอมรับ/ปฏิเสธในค้นหาอีกต่อไป
            isSentRequest={isSent}

            onAcceptRequest={onAccept}
            onDeclineRequest={onDecline}
            onSendRequest={onSendRequest}

            onClick={() =>
              onOpenDetail({
                ...u,
                isFriend: false,
              })
            }
          />
        );
      })}
    </ul>
  );
}
