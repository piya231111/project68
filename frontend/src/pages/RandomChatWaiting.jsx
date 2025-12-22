import React, { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import { useNavigate } from "react-router-dom";

/* -------------------------------------------
   โหลด friends + blocked ใหม่จาก backend
------------------------------------------- */
async function loadUserRelationsFresh() {
  const token = localStorage.getItem("token");
  const me = JSON.parse(localStorage.getItem("user"));

  try {
    const fr = await fetch("http://localhost:7000/api/friends", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());

    const bl = await fetch("http://localhost:7000/api/friends/blocked", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());

    //  ลบข้อมูลซ้ำออก (สำคัญมาก)
    me.friends = [...new Set(fr.friends.map((f) => f.id))];
    me.blocked = [...new Set(bl.blocked.map((b) => b.id))];

    localStorage.setItem("user", JSON.stringify(me));

    return me;
  } catch (err) {
    console.error("โหลด friends/blocked ไม่สำเร็จ:", err);
    return me; // fallback
  }
}

export default function RandomChatWaiting() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("กำลังค้นหาคู่...");

  const joinedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const me = await loadUserRelationsFresh(); // ⭐ โหลด relations ใหม่ทุกครั้ง

      if (!me || !me.id) return;

      console.log("🔥 DEBUG ME =", me);

      if (joinedRef.current) return;
      joinedRef.current = true;

      // ส่งข้อมูลเข้าสู่คิวแบบใหม่ที่ถูกต้อง
      socket.emit("randomChat:joinQueue", {
        userId: me.id,
        country: me.country,
        interests: me.interests || [],
        friends: me.friends || [],
        blocked: me.blocked || [],
        isOnline: true,
      });

      socket.on("randomChat:waiting", () => {
        if (!isMounted) return;
        setStatus("กำลังหาเพื่อนคุยที่เข้ากันได้...");
      });

      socket.on("randomChat:matched", ({ roomId }) => {
        navigate(`/chat/random/room/${roomId}`);
      });
    })();

    return () => {
      isMounted = false;
      socket.off("randomChat:waiting");
      socket.off("randomChat:matched");
    };
  }, []);

  const cancelRandomChat = () => {
    joinedRef.current = false;
    socket.emit("randomChat:leaveQueue");
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#E9FBFF]">
      <div className="text-center mb-10">
        <p className="text-2xl font-semibold text-[#00B8E6]">{status}</p>
        <div className="mt-6 animate-spin w-12 h-12 border-4 border-[#00B8E6] border-t-transparent rounded-full mx-auto"></div>
      </div>

      <button
        onClick={cancelRandomChat}
        className="px-6 py-3 bg-red-500 text-white rounded-xl text-lg font-semibold hover:bg-red-600 transition shadow"
      >
        ยกเลิก
      </button>
    </div>
  );
}
