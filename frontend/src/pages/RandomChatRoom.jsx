// src/pages/RandomChatRoom.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { api } from "../api";

import GifModal from "./chat/GifModal";
import useGifSearch from "./chat/hooks/useGifSearchRandom";
import FriendDetailModal from "../components/FriendDetailModal";

const BACKEND = "http://localhost:7000";

const avatarSrc = (id) => {
    if (!id) return "/default-avatar.png";
    return `${BACKEND}/uploads/avatars/avatar${String(id).padStart(2, "0")}.png`;
};

const itemSrc = (id) => {
    if (!id) return null;
    return `${BACKEND}/uploads/items/item${String(id).padStart(2, "0")}.png`;
};

export default function RandomChatRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [me, setMe] = useState(null);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [partner, setPartner] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const bottomRef = useRef(null);

    /** GIF system */
    const {
        gifModalOpen,
        setGifModalOpen,
        gifSearch,
        setGifSearch,
        gifResults,
        searchGIF,
        sendGif,
    } = useGifSearch(roomId);

    //  โหลด me สดจาก backend
    useEffect(() => {
        const loadMe = async () => {
            try {
                const meRes = await api.get("/auth/me");
                const fresh = meRes.data?.me;
                setMe(fresh);
                localStorage.setItem("user", JSON.stringify(fresh));
                localStorage.setItem("userId", fresh.id);
            } catch (e) {
                console.error("load me failed", e);
            }
        };
        loadMe();
    }, []);

    // ===============================
    // โหลดข้อความเก่า (cache)
    // ===============================
    useEffect(() => {
        const saved = localStorage.getItem(`random_chat_${roomId}`);
        if (saved) setMessages(JSON.parse(saved));
    }, [roomId]);

    // ===============================
    // JOIN ROOM + LISTEN
    // ===============================
    useEffect(() => {
        if (!roomId || !me?.id) return;

        socket.emit("join_room", { roomId });
        socket.emit("randomChat:rejoin", { roomId, userId: me.id });
        socket.emit("randomChat:getRoomInfo", { roomId });

        const loadPartner = async ({ users }) => {
            const partnerId = users.find((id) => String(id) !== String(me.id));
            if (!partnerId) return;

            const token = localStorage.getItem("token");

            const res = await fetch(`http://localhost:7000/api/users/${partnerId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            const statusRes = await fetch(
                `http://localhost:7000/api/friends/${partnerId}/status`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const status = await statusRes.json();

            const relation = {
                isFriend: status.status === "friend",
                isIncomingRequest: status.status === "incoming",
                isSentRequest: status.status === "sent",
                isFavorite: Boolean(status.isFavorite),
            };

            setPartner({
                id: data.id,
                display_name: data.display_name,
                avatar_id: data.avatar_id,
                item_id: data.item_id,
                country: data.country,
                interests: data.interests,
                is_online: data.is_online,
                ...relation,
            });
        };

        const onMessage = (msg) => setMessages((prev) => [...prev, msg]);

        const onEnd = () => {
            alert("คู่สนทนาออกจากห้องแล้ว");
            localStorage.removeItem(`random_chat_${roomId}`);
            navigate("/home");
        };

        socket.on("randomChat:roomInfo", loadPartner);
        socket.on("randomChat:message", onMessage);
        socket.on("randomChat:end", onEnd);

        return () => {
            socket.off("randomChat:roomInfo", loadPartner);
            socket.off("randomChat:message", onMessage);
            socket.off("randomChat:end", onEnd);
        };
    }, [roomId, me?.id, navigate]);

    // ===============================
    // Auto-save
    // ===============================
    useEffect(() => {
        localStorage.setItem(`random_chat_${roomId}`, JSON.stringify(messages));
    }, [messages, roomId]);

    // ===============================
    // ส่งข้อความ
    // ===============================
    const sendMessage = () => {
        if (!me?.id) return;
        if (!input.trim()) return;

        socket.emit("randomChat:message", {
            roomId,
            sender: me.id,
            text: input.trim(),
            type: "text",
            time: Date.now(),
        });

        setInput("");
    };

    // ===============================
    // ส่งไฟล์
    // ===============================
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const token = localStorage.getItem("token");
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("http://localhost:7000/api/upload/chat-file", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        });

        const data = await res.json();

        // จุดสำคัญ
        const fileType = file.type.startsWith("video")
            ? "video"
            : "image";

        socket.emit("randomChat:message", {
            roomId,
            sender: me.id,
            fileUrl: data.url,
            type: fileType,   // video / image
            time: Date.now(),
        });
    };

    // ===============================
    // ออกจากห้อง
    // ===============================
    const leaveRoom = () => {
        socket.emit("randomChat:leave", roomId);
        socket.emit("randomChat:leaveQueue"); 
        localStorage.removeItem(`random_chat_${roomId}`);
        navigate("/home");
    };

    // Scroll bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ================================
    // Friend API handlers
    // ================================
    const token = localStorage.getItem("token");

    const handleAddFriend = async (id) => {
        if (!token) return alert("กรุณาเข้าสู่ระบบใหม่");

        const res = await fetch(`http://localhost:7000/api/friends/request/${id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) return alert(data.error || "ส่งคำขอไม่สำเร็จ");

        alert("ส่งคำขอเป็นเพื่อนแล้ว!");
    };

    const handleBlockUser = async (id) => {
        if (!token) return alert("กรุณาเข้าสู่ระบบใหม่");

        const res = await fetch(`http://localhost:7000/api/friends/${id}/block`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) return alert(data.error || "บล็อคไม่สำเร็จ");

        alert("บล็อคผู้ใช้งานแล้ว");
    };

    const handleRemoveFriend = async (id) => {
        if (!token) return alert("กรุณาเข้าสู่ระบบใหม่");

        const res = await fetch(`http://localhost:7000/api/friends/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) return alert("ลบเพื่อนล้มเหลว");
        alert("ลบเพื่อนแล้ว");
    };

    const handleToggleFavorite = async (id) => {
        if (!token) return alert("กรุณาเข้าสู่ระบบใหม่");

        const res = await fetch(`http://localhost:7000/api/friends/${id}/favorite`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) return alert("อัปเดตสถานะโปรดปรานไม่สำเร็จ");
        alert("อัปเดตสถานะโปรดปรานแล้ว");
    };

    // ================================
    //  API: ยอมรับคำขอ
    // ================================
    const handleAcceptRequest = async (id) => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`http://localhost:7000/api/friends/accept/${id}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (!res.ok) return alert(data.error || "ยอมรับคำขอไม่สำเร็จ");

            alert("ยอมรับคำขอแล้ว!");

            // อัปเดตสถานะใน modal
            setPartner((prev) => ({
                ...prev,
                isFriend: true,
                isIncomingRequest: false,
                isSentRequest: false
            }));

        } catch (err) {
            console.error(err);
        }
    };

    // ================================
    //  API: ปฏิเสธคำขอ
    // ================================
    const handleDeclineRequest = async (id) => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`http://localhost:7000/api/friends/decline/${id}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (!res.ok) return alert(data.error || "ปฏิเสธไม่สำเร็จ");

            alert("ปฏิเสธคำขอแล้ว");

            setPartner((prev) => ({
                ...prev,
                isIncomingRequest: false,
                isSentRequest: false,
            }));

        } catch (err) {
            console.error(err);
        }
    };

    const handleGoChat = async (id) => {
        if (!token) return alert("กรุณาเข้าสู่ระบบใหม่");

        const res = await fetch(
            `http://localhost:7000/api/chat/get-or-create-room/${id}`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        const data = await res.json();

        if (!res.ok) {
            console.error("Error:", data);
            return alert(data.error || "เปิดห้องแชทไม่สำเร็จ");
        }

        navigate(`/chat/room/${data.roomId}`);
    };

    if (!me) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#E9FBFF]">
                กำลังโหลด...
            </div>
        );
    }
    return (
        <div className="flex flex-col h-screen bg-[#E9FBFF]">

            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4 bg-white shadow-md">
                <div className="flex items-center gap-3">
                    {partner && (
                        <button
                            onClick={() => partner && setShowDetail(true)}
                            className="relative w-20 h-20 rounded-full overflow-hidden border bg-white flex-shrink-0 focus:outline-none"
                        >
                            {/* ITEM : ซ้อนหลัง */}
                            {partner.item_id && (
                                <img
                                    src={itemSrc(partner.item_id)}
                                    alt="item"
                                    className="absolute inset-0 w-full h-full object-contain z-10 scale-[1.05] translate-y-[2%] pointer-events-none"
                                />
                            )}

                            {/* AVATAR */}
                            <img
                                src={avatarSrc(partner.avatar_id)}
                                alt="avatar"
                                className=" absolute inset-0 w-full h-full object-contain z-20"
                            />
                        </button>
                    )}

                    <div>
                        <p
                            onClick={() => partner && setShowDetail(true)}
                            className="font-semibold text-gray-800">
                            {partner?.display_name || "กำลังจับคู่..."}
                        </p>
                        <p className="text-xs text-gray-400">
                            ห้องแชทสุ่ม
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowLeaveConfirm(true)}
                    className="text-red-500 font-semibold hover:underline"
                >
                    ออกจากห้อง
                </button>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((msg, i) => {
                    const isMine = String(msg.sender) === String(me.id);

                    const isMedia =
                        msg.type === "image" ||
                        msg.type === "gif" ||
                        msg.type === "video";

                    const time = new Date(msg.time).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                    });

                    return (
                        <div
                            key={i}
                            className={`flex items-end gap-3 ${isMine ? "justify-end" : "justify-start"}`}
                        >
                            {/* ===== AVATAR ซ้าย (คู่สนทนา) ===== */}
                            {!isMine && partner && (
                                <button
                                    onClick={() => partner && setShowDetail(true)}
                                    className="relative w-12 h-12 shrink-0 rounded-full overflow-hidden border bg-white shadow focus:outline-none"
                                >

                                    {partner.item_id && (
                                        <img
                                            src={itemSrc(partner.item_id)}
                                            className="absolute inset-0 w-full h-full object-contain
                                                       scale-[1.08] translate-y-[3%] opacity-70 z-0"
                                        />
                                    )}
                                    <img
                                        src={avatarSrc(partner.avatar_id)}
                                        className="absolute inset-0 w-full h-full object-contain
                                                   scale-[1.05] translate-y-[2%] z-10"
                                    />
                                </button>
                            )}

                            {/* ===== MESSAGE ===== */}
                            <div className={`flex flex-col max-w-[260px] ${isMine ? "items-end" : "items-start"}`}>
                                {!isMine && (
                                    <p
                                        className="text-[11px] text-blue-500 font-medium ml-1 mb-1 cursor-pointer hover:underline"
                                        onClick={() => partner && setShowDetail(true)}
                                    >
                                        {partner?.display_name || "กำลังเชื่อมต่อ..."}
                                    </p>
                                )}

                                {isMedia ? (
                                    msg.type === "video" ? (
                                        <video src={msg.fileUrl} controls className="rounded-2xl shadow max-w-[260px]" />
                                    ) : (
                                        <img src={msg.fileUrl} className="rounded-2xl shadow max-w-[260px]" />
                                    )
                                ) : (
                                    <div
                                        className={`px-4 py-2 rounded-2xl shadow text-sm ${isMine
                                            ? "bg-[#00B8E6] text-white rounded-br-md"
                                            : "bg-white border text-gray-700 rounded-bl-md"
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                )}

                                <p className="text-[10px] text-gray-400 mt-1">
                                    {time}
                                </p>
                            </div>

                            {/* ===== AVATAR ขวา (เรา) ===== */}
                            {isMine && (
                                <div className="relative w-12 h-12 shrink-0 rounded-full overflow-hidden border bg-white shadow">
                                    {me.item_id && (
                                        <img
                                            src={itemSrc(me.item_id)}
                                            className="absolute inset-0 w-full h-full object-contain
                     scale-[1.08] translate-y-[3%] opacity-70 z-0"
                                        />
                                    )}
                                    <img
                                        src={avatarSrc(me.avatar_id)}
                                        className="absolute inset-0 w-full h-full object-contain
                   scale-[1.05] translate-y-[2%] z-10"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}

                <div ref={bottomRef}></div>
            </div>

            {/* INPUT */}
            <div className="bg-white p-4 border-t flex items-center gap-3">
                <input
                    type="file"
                    accept="image/*,video/*,.gif"
                    id="fileUploadRandom"
                    className="hidden"
                    onChange={handleFileUpload}
                />

                <label htmlFor="fileUploadRandom"
                    className="p-3 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300">
                    📎
                </label>

                <button
                    onClick={() => setGifModalOpen(true)}
                    className="p-3 bg-yellow-300 rounded-full hover:bg-yellow-400"
                >
                    GIF
                </button>

                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 px-4 py-2 rounded-full border bg-gray-50 focus:ring-2 focus:ring-[#00B8E6]"
                />

                <button
                    onClick={sendMessage}
                    className="bg-[#00B8E6] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#009ccc]"
                >
                    ส่ง
                </button>
            </div>

            {/* GIF MODAL */}
            {gifModalOpen && (
                <GifModal
                    gifSearch={gifSearch}
                    setGifSearch={setGifSearch}
                    gifResults={gifResults}
                    searchGIF={searchGIF}
                    sendGif={sendGif}
                    close={() => setGifModalOpen(false)}
                />
            )}

            {/* DETAIL MODAL */}
            {showDetail && partner && (
                <FriendDetailModal
                    friend={partner}
                    onClose={() => setShowDetail(false)}
                    onAddFriend={() => handleAddFriend(partner.id)}
                    onRemoveFriend={() => handleRemoveFriend(partner.id)}
                    onToggleFavorite={() => handleToggleFavorite(partner.id)}
                    onBlockUser={() => handleBlockUser(partner.id)}
                    onChat={() => handleGoChat(partner.id)}
                    onAcceptRequest={() => handleAcceptRequest(partner.id)}
                    onDeclineRequest={() => handleDeclineRequest(partner.id)}
                />
            )}
            {showLeaveConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-lg w-[320px] p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            ยืนยันการออกจากห้อง
                        </h3>

                        <p className="text-sm text-gray-600 mb-6">
                            คุณต้องการออกจากห้องแชทสุ่มนี้ใช่หรือไม่?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowLeaveConfirm(false)}
                                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                            >
                                ยกเลิก
                            </button>

                            <button
                                onClick={() => {
                                    setShowLeaveConfirm(false);
                                    leaveRoom();
                                }}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                            >
                                ออกจากห้อง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
