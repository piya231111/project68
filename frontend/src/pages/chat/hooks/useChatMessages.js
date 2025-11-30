// frontend/src/components/chat/hooks/useChatMessages.js
import { useEffect, useState } from "react";
import { api } from "../../../api";
import { socket } from "../../../socket";

export default function useChatMessages(friendId) {
    const me = JSON.parse(localStorage.getItem("user"));
    const userId = String(me?.id || "");

    const [roomId, setRoomId] = useState(null);
    const [roomReady, setRoomReady] = useState(false);
    const [messages, setMessages] = useState([]);

    /* ============================================
       1) Get/Create room
    ============================================ */
    useEffect(() => {
        if (!friendId) return;

        api
            .post(`/chat/get-or-create-room/${friendId}`)
            .then((res) => setRoomId(res.data.room_id))
            .catch(console.error);
    }, [friendId]);

    /* ============================================
       2) JOIN ROOM + LOAD HISTORY
    ============================================ */
    useEffect(() => {
        if (!roomId) return;

        setRoomReady(false);
        socket.emit("join_room", roomId);

        // Backend บอกว่า join สำเร็จ
        const handleJoinConfirm = (joinedRoomId) => {
            if (String(joinedRoomId) === String(roomId)) {
                setRoomReady(true);
            }
        };
        socket.on("room_joined", handleJoinConfirm);

        // โหลดข้อความเก่า
        api.get(`/chat/room/${roomId}`).then((res) => {
            const arr = Array.isArray(res.data.messages) ? res.data.messages : [];
            setMessages(arr);
        });

        // ⭐ รับข้อความใหม่
        const handleReceive = (msg) => {
            if (String(msg.room_id) !== String(roomId)) return;
            setMessages((prev) => [...prev, msg]);
        };
        socket.on("receive_message", handleReceive);

        // ⭐⭐ รับการอัปเดตข้อความหลัง AI moderation
        const handleUpdate = (update) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === update.id ? { ...m, text: update.text } : m
                )
            );
        };
        socket.on("message_updated", handleUpdate);

        return () => {
            socket.off("room_joined", handleJoinConfirm);
            socket.off("receive_message", handleReceive);
            socket.off("message_updated", handleUpdate);   // ⭐ cleanup
        };
    }, [roomId]);

    /* ============================================
       3) ส่งข้อความ TEXT แบบเร็ว ไม่อั้น
    ============================================ */
    const sendTextMessage = (text) => {
        if (!text.trim() || !roomId || !roomReady) return;

        socket.emit(
            "send_message",
            {
                room_id: roomId,
                sender_id: userId,
                type: "text",
                text,
            },
            (res) => {
                // backend จะใส่ msg มาให้ถ้าบันทึกสำเร็จ
                if (res?.ok && res.msg) {
                    setMessages((prev) => [...prev, res.msg]);
                }
            }
        );
    };

    /* ============================================
       4) ส่งรูป / วิดีโอ / GIF
    ============================================ */
    const sendMediaMessage = async (file) => {
        if (!file || !roomId || !roomReady) return;

        const form = new FormData();
        form.append("file", file);

        try {
            const upload = await api.post("/upload/chat-file", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            let type = "file";
            if (file.type.includes("image")) type = "image";
            if (file.type.includes("video")) type = "video";
            if (file.name.toLowerCase().endsWith(".gif")) type = "gif";

            socket.emit(
                "send_message",
                {
                    room_id: roomId,
                    sender_id: userId,
                    type,
                    file_url: upload.data.url,
                },
                (res) => {
                    if (res?.ok && res.msg) {
                        setMessages((prev) => [...prev, res.msg]);
                    }
                }
            );
        } catch (err) {
            console.error("Media upload error:", err);
        }
    };

    return {
        roomId,
        roomReady,
        messages,
        sendTextMessage,
        sendMediaMessage,
    };
}
