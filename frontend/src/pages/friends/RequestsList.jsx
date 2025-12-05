import FriendRow from "../../components/FriendRow";

export default function RequestsList({
  requests,
  onAccept,
  onDecline,
  onOpenDetail,
}) {
  if (!requests.length)
    return <p className="text-gray-500 text-center">ยังไม่มีคำขอ</p>;

  return (
    <div className="max-h-[480px] overflow-y-auto pr-2">
      <ul className="divide-y bg-white/70 rounded-xl">
        {requests.map((r) => (
          <FriendRow
            key={r.id}
            friend={r}
            isIncomingRequest={true}
            onClick={() =>
              onOpenDetail({
                ...r,
                isFriend: false,
                isIncomingRequest: true,
              })
            }
            onAcceptRequest={onAccept}
            onDeclineRequest={onDecline}
          />
        ))}
      </ul>
    </div>
  );
}
