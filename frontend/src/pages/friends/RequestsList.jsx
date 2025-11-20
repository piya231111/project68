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
    <ul className="divide-y bg-white/70 rounded-xl">
      {requests.map((r) => (
        <FriendRow
          key={r.id}
          friend={r}
          isIncomingRequest={true}
          onClick={() => onOpenDetail(r)}
          onAcceptRequest={onAccept}
          onDeclineRequest={onDecline}
        />
      ))}
    </ul>
  );
}
