import React, { useEffect, useState } from "react";
import { api } from "../../api";

export default function ManageFriends() {
    const [blocked, setBlocked] = useState([]);
    const [avatars, setAvatars] = useState({});
    const [items, setItems] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBlocked();
    }, []);

    const loadBlocked = async () => {
        try {
            setLoading(true);

            const res = await api.get("/friends/blocked");
            const list = res.data.blocked || [];
            setBlocked(list);

            // โหลด avatar + item
            list.forEach(async (u) => {
                if (u.avatar_id) {
                    const avatarRes = await api.get(`/avatars/${u.avatar_id}`);
                    setAvatars((prev) => ({ ...prev, [u.id]: avatarRes.data }));
                }

                if (u.item_id) {
                    const itemRes = await api.get(`/items/${u.item_id}`);
                    setItems((prev) => ({ ...prev, [u.id]: itemRes.data }));
                }
            });
        } catch (err) {
            console.error("loadBlocked error:", err);
        } finally {
            setLoading(false);
        }
    };

    const unblock = async (id) => {
        try {
            await api.delete(`/friends/${id}/block`);
            setBlocked((prev) => prev.filter((x) => x.id !== id));
        } catch (err) {
            console.error("unblock error:", err);
        }
    };

    return (
        <main className="flex justify-center items-start px-16 py-12 bg-[#E9FBFF] min-h-screen">
            <div className="bg-white p-10 rounded-3xl shadow-xl max-w-3xl w-full border border-[#ccefff]">

                {/* Title */}
                <div className="flex items-center gap-3 mb-8">
                    <h2 className="text-3xl font-bold text-[#00B8E6]">
                        จัดการรายชื่อที่บล็อก
                    </h2>
                </div>

                {loading ? (
                    <p className="text-gray-500 text-center">กำลังโหลด...</p>
                ) : blocked.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500 text-lg">ไม่มีรายชื่อที่ถูกบล็อก</p>
                    </div>
                ) : (
                    <ul className="space-y-2">

                        {blocked.map((u) => (
                            <li
                                key={u.id}
                                className="flex justify-between items-center py-4 px-6 hover:bg-[#E9FBFF] transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative w-14 h-14">
                                        {/* item (ด้านหลัง) */}
                                        {items[u.id] && (
                                            <img
                                                src={
                                                    items[u.id].image_url ||
                                                    items[u.id].imageUrl ||
                                                    "/default-item.png"
                                                }
                                                className="absolute inset-0 w-full h-full object-contain opacity-95"
                                                alt=""
                                            />
                                        )}

                                        {/* avatar (ด้านหน้า) */}
                                        {avatars[u.id]?.image_url ? (
                                            <img
                                                src={avatars[u.id].image_url}
                                                className="absolute inset-0 w-full h-full object-contain z-20"
                                                alt=""
                                            />
                                        ) : (
                                            <div className="absolute inset-0 w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold text-lg z-20">
                                                {u.display_name?.charAt(0)?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <p className="font-semibold text-gray-800 text-lg">
                                            {u.display_name}
                                        </p>
                                        <p className="text-sm text-gray-500">{u.email}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => unblock(u.id)}
                                    className="
                                        bg-green-500 hover:bg-green-600 text-white 
                                        px-5 py-2 rounded-xl font-semibold shadow
                                        active:scale-95 transition-all
                                    "
                                >
                                    ปลดบล็อก
                                </button>
                            </li>
                        ))}

                    </ul>
                )}
            </div>
        </main>
    );
}
