import React, { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import { useNavigate } from "react-router-dom";

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

    me.friends = [...new Set(fr.friends.map(f => f.id))];
    me.blocked = [...new Set(bl.blocked.map(b => b.id))];

    localStorage.setItem("user", JSON.stringify(me));
    return me;
  } catch (err) {
    console.error("โหลด friends/blocked ไม่สำเร็จ:", err);
    return me;
  }
}

export default function RandomChatWaiting() {
  const navigate = useNavigate();

  const [status, setStatus] = useState("กำลังค้นหาคู่...");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const joinedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const me = await loadUserRelationsFresh();
      if (!me?.id) return;

      if (joinedRef.current) return;
      joinedRef.current = true;

      socket.emit("randomChat:joinQueue", {
        userId: me.id,
        country: me.country,
        interests: me.interests || [],
        friends: me.friends || [],
        blocked: me.blocked || [],
        isOnline: true,
      });

      socket.on("randomChat:waiting", () => {
        if (isMounted) {
          setStatus("กำลังหาเพื่อนคุยที่เข้ากันได้...");
        }
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
  }, [navigate]);

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

      {/* ปุ่มยกเลิก */}
      <button
        onClick={() => setShowLeaveConfirm(true)}
        className="px-6 py-3 bg-red-500 text-white rounded-xl text-lg font-semibold hover:bg-red-600 transition shadow"
      >
        ยกเลิก
      </button>

      {/* CONFIRM MODAL */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-[320px] p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              ยืนยันการยกเลิก
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              คุณต้องการยกเลิกการค้นหาเพื่อนคุยใช่หรือไม่?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                ไม่ยกเลิก
              </button>

              <button
                onClick={() => {
                  setShowLeaveConfirm(false);
                  cancelRandomChat();  
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                ยืนยันยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
