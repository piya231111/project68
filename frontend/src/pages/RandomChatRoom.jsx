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

    const me = JSON.parse(localStorage.getItem("user"));
    const bottomRef = useRef(null);

    const [showDetail, setShowDetail] = useState(false);
    const [partner, setPartner] = useState(null);

    /** ⭐ GIF System */
    const {
        gifModalOpen,
        setGifModalOpen,
        gifSearch,
        setGifSearch,
        gifResults,
        searchGIF,
        sendGif,
    } = useGifSearch(roomId);

    /** โหลดข้อความจาก cache */
    useEffect(() => {
        const saved = localStorage.getItem(`random_chat_${roomId}`);
        if (saved) setMessages(JSON.parse(saved));
    }, [roomId]);

    /** JOIN ROOM */
    useEffect(() => {
        if (!roomId) return;

        socket.emit("join_room", { roomId, userId: me.id });
        socket.emit("randomChat:rejoin", { roomId, userId: me.id });

        const handleMessage = (msg) => setMessages((prev) => [...prev, msg]);

        const handleEnd = () => {
            alert("คู่สนทนาออกจากห้องแล้ว");
            localStorage.removeItem(`random_chat_${roomId}`);
            navigate("/home");
        };

        socket.on("randomChat:message", handleMessage);
        socket.on("randomChat:end", handleEnd);

        return () => {
            socket.off("randomChat:message", handleMessage);
            socket.off("randomChat:end", handleEnd);
        };
    }, [roomId, me.id, navigate]);

    /** Auto-save */
    useEffect(() => {
        localStorage.setItem(`random_chat_${roomId}`, JSON.stringify(messages));
    }, [messages, roomId]);

    /** ส่งข้อความ */
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

    /** ส่งไฟล์ */
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
            return;
        }

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

        } catch (err) {
            console.error(err);
            alert("อัปโหลดไฟล์ไม่สำเร็จ");
        }
    };

    /** โหลดข้อมูลคู่สนทนาเมื่อ match */
    useEffect(() => {
        socket.on("randomChat:matched", async ({ users }) => {

            const partnerId = users.find((id) => id !== me.id);

            const res = await fetch(`http://localhost:7000/api/friends/${partnerId}`);
            const json = await res.json();
            const data = json.friend;

            /** ⭐ ดึงข้อมูลครบ */
            setPartner({
                id: data.id,
                display_name: data.display_name,
                avatar_id: data.avatar_id || null,
                item_id: data.item_id || null,
                country: data.country || "—",
                interests: data.interests || [],
                is_online: data.is_online || false,

                isFriend: false,
                isIncomingRequest: false,
                isSentRequest: false
            });

            console.log(">>> PARTNER LOADED (FULL):", data);
        });

        return () => socket.off("randomChat:matched");
    }, []);

    useEffect(() => {
        socket.emit("randomChat:joinQueue", {
            userId: me.id,
            country: me.country || "Thailand",
            interests: me.interests || ["chat"],
            friends: [],
            isOnline: true
        });
    }, []);

    /** Leave room */
    const leaveRoom = () => {
        socket.emit("randomChat:leave", roomId);
        localStorage.removeItem(`random_chat_${roomId}`);
        navigate("/home");
    };

    /** Auto scroll bottom */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex flex-col h-screen bg-[#E9FBFF]">

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-white shadow-md">
                <h1 className="text-xl font-bold text-[#00B8E6]">ห้องแชทสุ่ม</h1>
                <button onClick={leaveRoom} className="text-red-500 font-semibold">
                    ออกจากห้อง
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((msg, i) => {
                    const isMine = msg.sender === me.id;
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
                        <div key={i} className={`flex flex-col my-2 ${isMine ? "items-end" : "items-start"}`}>

                            {/* ชื่อผู้ส่ง */}
                            {!isMine && (
                                <p
                                    className="text-[11px] text-blue-500 font-medium mb-1 ml-1 cursor-pointer hover:underline"
                                    onClick={() => setShowDetail(true)}
                                >
                                    {partner?.display_name || "คู่สนทนา"}
                                </p>
                            )}

                            {/* MEDIA */}
                            {isMedia && (
                                <div className="my-1">
                                    {msg.type !== "video" ? (
                                        <img src={msg.fileUrl} className="max-w-[260px] rounded-lg shadow" />
                                    ) : (
                                        <video src={msg.fileUrl} controls className="max-w-[260px] rounded-lg shadow" />
                                    )}
                                </div>
                            )}

                            {/* TEXT */}
                            {!isMedia && (
                                <div className={`${base} ${isMine ? myBubble : otherBubble}`}>
                                    <p>{msg.text}</p>
                                </div>
                            )}

                            {/* TIME */}
                            <p className={`text-[10px] text-gray-400 mt-1 ${isMine ? "text-right" : "text-left"}`}>
                                {time}
                            </p>
                        </div>
                    );
                })}

                <div ref={bottomRef}></div>
            </div>

            {/* Input */}
            <div className="bg-white p-4 border-t flex items-center gap-3">

                <input
                    type="file"
                    accept="image/*,video/*,.gif"
                    className="hidden"
                    id="fileUploadRandom"
                    onChange={handleFileUpload}
                />
                <label
                    htmlFor="fileUploadRandom"
                    className="p-3 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300"
                >
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

            {/* GIF Modal */}
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

            {/* Friend Detail Modal */}
            {showDetail && partner && (
                <FriendDetailModal
                    friend={partner}
                    onClose={() => setShowDetail(false)}
                    onAddFriend={(id) => console.log("add friend", id)}
                    onRemoveFriend={(id) => console.log("remove friend", id)}
                    onToggleFavorite={(id) => console.log("toggle fav", id)}
                    onBlockUser={(id) => console.log("block user", id)}
                    onChat={(id) => console.log("go chat", id)}
                />
            )}
        </div>
    );
}
