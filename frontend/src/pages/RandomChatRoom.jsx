// src/pages/RandomChatRoom.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";

import GifModal from "./chat/GifModal";
import useGifSearch from "./chat/hooks/useGifSearchRandom";
import FriendDetailModal from "../components/FriendDetailModal";

export default function RandomChatRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [partner, setPartner] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const me = JSON.parse(localStorage.getItem("user"));
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
        if (!roomId) return;

        socket.emit("join_room", { roomId, userId: me.id });
        socket.emit("randomChat:rejoin", { roomId, userId: me.id });

        // ขอข้อมูล room ทันที
        socket.emit("randomChat:getRoomInfo", { roomId });

        const loadPartner = async ({ users }) => {
            console.log(">>> ROOM INFO USERS =", users);
            console.log(">>> CURRENT USER =", me.id);

            const partnerId = users.find((id) => id !== me.id);
            console.log(">>> PARTNER ID =", partnerId);

            if (!partnerId) return;

            const token = localStorage.getItem("token");

            // ดึง user data
            const res = await fetch(`http://localhost:7000/api/users/${partnerId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            console.log(">>> PARTNER DATA =", data);

            // ดึง friend status
            const statusRes = await fetch(
                `http://localhost:7000/api/friends/${partnerId}/status`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const status = await statusRes.json();
            console.log(">>> PARTNER STATUS =", status);

            const relation = {
                isFriend: false,
                isIncomingRequest: false,
                isSentRequest: false,
                isFavorite: false,
            };

            if (status.status === "friend") relation.isFriend = true;
            if (status.status === "incoming") relation.isIncomingRequest = true;
            if (status.status === "sent") relation.isSentRequest = true;

            relation.isFavorite = Boolean(status.isFavorite);

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

            console.log(">>> FINAL PARTNER =", {
                id: data.id,
                display_name: data.display_name,
                ...relation
            });
        };

        const onMessage = (msg) => {
            const isMine = String(msg.sender) === String(me.id);

            setMessages(prev => [
                ...prev,
                {
                    ...msg,
                    senderName: isMine ? me.display_name : (partner?.display_name || msg.senderName)
                }
            ]);
        };

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
    }, [roomId, me.id]);

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
        if (!token) return alert("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");

        const form = new FormData();
        form.append("file", file);

        try {
            const res = await fetch("http://localhost:7000/api/upload/chat-file", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });

            const data = await res.json();

            socket.emit("randomChat:message", {
                roomId,
                sender: me.id,
                fileUrl: data.url,
                type: "image",
                time: Date.now(),
            });

        } catch {
            alert("อัปโหลดไฟล์ไม่สำเร็จ");
        }
    };

    // ===============================
    // ออกจากห้อง
    // ===============================
    const leaveRoom = () => {
        socket.emit("randomChat:leave", roomId);
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

    return (
        <div className="flex flex-col h-screen bg-[#E9FBFF]">

            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4 bg-white shadow-md">
                <h1 className="text-xl font-bold text-[#00B8E6]">ห้องแชทสุ่ม</h1>
                <button onClick={leaveRoom} className="text-red-500 font-semibold">
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

                    const base = "max-w-[260px] px-4 py-2 rounded-2xl shadow text-sm";
                    const myBubble = "bg-[#00B8E6] text-white rounded-br-none";
                    const otherBubble = "bg-white text-gray-700 rounded-bl-none border";

                    return (
                        <div
                            key={i}
                            className={`flex flex-col my-2 ${isMine ? "items-end" : "items-start"}`}
                        >
                            {!isMine && partner && (
                                <p
                                    className="text-[11px] text-blue-500 font-medium mb-1 ml-1 cursor-pointer hover:underline"
                                    onClick={() => setShowDetail(true)}
                                >
                                    {msg.senderName || partner?.display_name || "คู่สนทนา"}
                                </p>
                            )}

                            {isMedia ? (
                                <div className="my-1">
                                    {msg.type !== "video" ? (
                                        <img src={msg.fileUrl} className="max-w-[260px] rounded-lg shadow" />
                                    ) : (
                                        <video src={msg.fileUrl} controls className="max-w-[260px] rounded-lg shadow" />
                                    )}
                                </div>
                            ) : (
                                <div className={`${base} ${isMine ? myBubble : otherBubble}`}>
                                    <p>{msg.text}</p>
                                </div>
                            )}

                            <p
                                className={`text-[10px] text-gray-400 mt-1 ${isMine ? "text-right" : "text-left"}`}
                            >
                                {time}
                            </p>
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
        </div>
    );
}
