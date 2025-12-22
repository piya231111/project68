import React, { useEffect, useState } from "react";
import FriendDetailModal from "./FriendDetailModal";

export default function InviteFriendModal({ roomId, onClose }) {
    const [friends, setFriends] = useState([]);
    const [memberIds, setMemberIds] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    useEffect(() => {
        loadFriends();
        loadRoomMembers();
    }, []);

    /* =========================
        LOAD FRIENDS
    ========================== */
    async function loadFriends() {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:7000/api/friends", {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        // 🔥 ป้องกันเพื่อนซ้ำ
        const uniqueFriends = [
            ...new Map((data.friends || []).map((f) => [f.id, f])).values(),
        ];

        setFriends(uniqueFriends);
    }

    /* =========================
        LOAD ROOM MEMBERS
    ========================== */
    async function loadRoomMembers() {
        const token = localStorage.getItem("token");

        const res = await fetch(
            `http://localhost:7000/api/chat/group/${roomId}/members`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();

        const ids = (data.members || []).map((m) => m.id);
        setMemberIds(ids);
    }

    /* =========================
        SEND INVITE
    ========================== */
    async function sendInvite(friendId) {
        const token = localStorage.getItem("token");

        await fetch("http://localhost:7000/api/invite-group", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                targetUserId: friendId,
                roomId,
            }),
        });

        alert("ส่งคำเชิญแล้ว");
        onClose();
    }

    return (
        <>
            {/* INVITE MODAL */}
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-xl w-[360px]">

                    <h2 className="text-lg font-semibold text-[#00B8E6] mb-4">
                        ชวนเพื่อนเข้าห้อง
                    </h2>

                    <div className="max-h-[280px] overflow-y-auto space-y-2">
                        {friends.map((f) => {
                            const isInRoom = memberIds.includes(f.id);

                            const avatarFile =
                                Number(f.avatar_id) < 10
                                    ? `avatar0${f.avatar_id}.png`
                                    : `avatar${f.avatar_id}.png`;

                            const itemFile =
                                Number(f.item_id) < 10
                                    ? `item0${f.item_id}.png`
                                    : `item${f.item_id}.png`;

                            return (
                                <div
                                    key={f.id}
                                    className="flex items-center justify-between p-3 border rounded-xl hover:bg-[#F4FBFF]"
                                >
                                    {/* LEFT: AVATAR + ITEM + NAME */}
                                    <div
                                        className="flex items-center gap-3 cursor-pointer"
                                        onClick={() => {
                                            setSelectedUser({
                                                ...f,
                                                isInRoom: memberIds.includes(f.id), // สำคัญ
                                            });
                                            setShowDetail(true);
                                        }}
                                    >
                                        <div className="relative w-12 h-12">
                                            {/* ITEM */}
                                            {f.item_id && (
                                                <img
                                                    src={`http://localhost:7000/uploads/items/${itemFile}`}
                                                    className="absolute inset-0 w-full h-full object-contain opacity-70"
                                                    onError={(e) => (e.target.style.display = "none")}
                                                />
                                            )}

                                            {/* AVATAR */}
                                            <img
                                                src={`http://localhost:7000/uploads/avatars/${avatarFile}`}
                                                className="relative w-full h-full object-contain z-10"
                                                onError={(e) =>
                                                    (e.target.src = "/default-avatar.png")
                                                }
                                            />
                                        </div>

                                        <span className="font-semibold text-gray-800">
                                            {f.display_name}
                                        </span>
                                    </div>

                                    {/* RIGHT: INVITE BUTTON / STATUS */}
                                    {isInRoom ? (
                                        <span className="text-sm text-gray-400 italic">
                                            อยู่ในห้องแล้ว
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => sendInvite(f.id)}
                                            className="bg-[#00B8E6] hover:bg-[#009ccc] text-white px-4 py-2 rounded-lg font-semibold"
                                        >
                                            เชิญ
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-4 text-gray-600 w-full py-2 border rounded-lg"
                    >
                        ปิด
                    </button>
                </div>
            </div>

            {/* FRIEND DETAIL MODAL */}
            {showDetail && selectedUser && (
                <FriendDetailModal
                    friend={selectedUser}
                    onClose={() => setShowDetail(false)}
                    onAddFriend={() => { }}
                    onRemoveFriend={() => { }}
                    onToggleFavorite={() => { }}
                    onBlockUser={() => { }}
                    onChat={() => { }}
                />
            )}
        </>
    );
}
