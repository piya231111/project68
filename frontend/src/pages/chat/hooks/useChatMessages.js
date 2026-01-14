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

        api.post(`/chat/get-or-create-room/${friendId}`)
            .then(res => setRoomId(res.data.room_id))
            .catch(console.error);
    }, [friendId]);

    /* ============================================
       2) JOIN ROOM (ใหม่!!) + load history
    ============================================ */
    useEffect(() => {
        if (!roomId) return;

        setRoomReady(false);

        socket.emit("join_room", {
            roomId,
            userId
        });

        socket.on("room_joined", (joinedId) => {
            if (String(joinedId) === String(roomId)) {
                setRoomReady(true);
            }
        });

        api.get(`/chat/room/${roomId}`).then((res) => {
            setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
        });

        const handleReceive = (msg) => {
            if (String(msg.room_id) !== String(roomId)) return;

            setMessages(prev => {
                // ลบ temp message ของตัวเอง
                const filtered = prev.filter(
                    m => !(m.optimistic && String(m.sender_id) === String(msg.sender_id))
                );

                // กันซ้ำ
                if (filtered.some(m => m.id === msg.id)) return filtered;

                return [...filtered, msg];
            });
        };

        socket.on("receive_message", handleReceive);

        const handleUpdate = (update) => {
            setMessages(prev =>
                prev.map(m => m.id === update.id ? { ...m, text: update.text } : m)
            );
        };
        socket.on("message_updated", handleUpdate);

        // ตรงนี้คือหัวใจ
        return () => {
            socket.emit("leave_room", {
                roomId,
                userId
            });

            socket.off("room_joined");
            socket.off("receive_message", handleReceive);
            socket.off("message_updated", handleUpdate);
        };
    }, [roomId]);

    /* ============================================
       3) ส่งข้อความ text
    ============================================ */
    const sendTextMessage = (text) => {
        if (!text.trim() || !roomId || !roomReady) return;

        const tempMessage = {
            id: `temp-${Date.now()}`,   // id ชั่วคราว
            room_id: roomId,
            sender_id: userId,
            text,
            type: "text",
            created_at: new Date().toISOString(),
            sender_name: me.display_name,
            avatar_id: me.avatar_id,
            item_id: me.item_id,
            optimistic: true,
        };

        // ✅ 1) แสดงข้อความทันที
        setMessages(prev => [...prev, tempMessage]);

        // ✅ 2) ส่งไป backend
        socket.emit("send_message", {
            room_id: roomId,
            sender_id: userId,
            type: "text",
            text,
        });
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
