import React, { useEffect, useState } from "react";
import { socket } from "../socket";
import { useNavigate } from "react-router-dom";

let joined = false;

export default function RandomChatWaiting() {
    const navigate = useNavigate();
    const [status, setStatus] = useState("กำลังค้นหาคู่...");

    useEffect(() => {
        const me = JSON.parse(localStorage.getItem("user"));

        if (!me || joined) return;
        joined = true;

        // ส่งเข้าคิวสุ่ม
        socket.emit("randomChat:joinQueue", {
            userId: me.id,
            country: me.country || "",
            interests: me.interests || [],
            friends: me.friends || [],
            isOnline: me.is_online ?? true,
        });

        socket.on("randomChat:waiting", () =>
            setStatus("กำลังหาเพื่อนคุยที่เข้ากันได้...")
        );

        socket.on("randomChat:matched", ({ roomId }) => {
            navigate(`/chat/random/room/${roomId}`);
        });

        return () => {
            socket.off("randomChat:waiting");
            socket.off("randomChat:matched");
        };
    }, []);

    /* ======================================================
          ปุ่มยกเลิก → กลับหน้าเดิม และออกจากคิวสุ่ม
    ====================================================== */
    const cancelRandomChat = () => {
        joined = false; // 🔥 reset allow re-enter queue
        try {
            socket.emit("randomChat:leaveQueue"); // เผื่อจะรองรับในอนาคต
        } catch { }

        navigate("/home");
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#E9FBFF]">
            <div className="text-center mb-10">
                <p className="text-2xl font-semibold text-[#00B8E6]">{status}</p>
                <div className="mt-6 animate-spin w-12 h-12 border-4 border-[#00B8E6] border-t-transparent rounded-full mx-auto"></div>
            </div>

            {/* ปุ่มยกเลิก */}
            <button
                onClick={cancelRandomChat}
                className="px-6 py-3 bg-red-500 text-white rounded-xl text-lg font-semibold hover:bg-red-600 transition shadow"
            >
                ยกเลิก
            </button>
        </div>
    );
}
