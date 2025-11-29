import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { socket } from "../socket";   // ⭐ เพิ่มตรงนี้

export default function Home() {
  const [me, setMe] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await api.get("/auth/me");
        const user = res.data?.me;

        console.log("HOME: /auth/me =", user);

        if (!isMounted) return;

        setMe(user);

        // Load avatar
        if (user?.avatar_id) {
          api.get(`/avatars/${user.avatar_id}`).then(a => {
            if (isMounted) setAvatar(a.data);
          });
        }

        // Load item
        if (user?.item_id) {
          api.get(`/items/${user.item_id}`).then(i => {
            if (isMounted) setItem(i.data);
          });
        }

        // ⭐⭐⭐ CONNECT SOCKET.IO หลังจากโหลด user สำเร็จ ⭐⭐⭐
        if (user) {
          console.log("🔌 Connecting WebSocket...");
          socket.connect();                 // เชื่อม socket
          socket.emit("online", user.id);   // แจ้ง backend ว่า user ออนไลน์
        }

      } catch (err) {
        console.error("โหลดข้อมูลไม่สำเร็จ:", err);
        navigate("/login", { replace: true });
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;

      // ⭐⭐⭐ Disconnect WebSocket เมื่อออกจาก Home ⭐⭐⭐
      if (socket.connected) {
        console.log("🔌 Disconnect WebSocket (leave Home)");
        socket.disconnect();
      }
    };
  }, [navigate]);

  // ------------ UI ------------
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#E9FBFF]">
        <p className="text-gray-500">กำลังโหลด...</p>
      </main>
    );
  }

  const menuItems = [
    { name: "ห้องแชท", icon: "🎉" },
    { name: "เพื่อน", icon: "🤝", path: "/friends" },
    { name: "ข้อความ", icon: "💬" },
    { name: "ตั้งค่า", icon: "⚙️" },
  ];

  return (
    <section className="flex flex-1 justify-center items-center px-16 py-12 gap-16 bg-[#E9FBFF]">

      {/* User info */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="relative w-[420px] h-[560px] flex items-center justify-center">

          {item && (
            <img
              src={item.image_url || item.imageUrl}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-contain z-10 opacity-95"
            />
          )}

          {avatar && (
            <img
              src={avatar.image_url || avatar.imageUrl}
              alt={avatar.name}
              className="absolute inset-0 w-full h-full object-contain z-20"
            />
          )}
        </div>

        <h2 className="mt-6 text-2xl font-bold text-[#00B8E6] flex items-center gap-3">
          {me?.display_name}

          {me?.is_online ? (
            <span className="text-green-500 text-base">🟢 ออนไลน์</span>
          ) : (
            <span className="text-gray-400 text-base">⚪ ออฟไลน์</span>
          )}
        </h2>

        <p className="text-gray-600 text-lg">{me?.country || "-"}</p>
      </div>

      {/* Menu */}
      <div className="flex flex-1 items-center justify-center">
        <div className="grid grid-cols-2 gap-6">
          {menuItems.map((m) => (
            <button
              key={m.name}
              onClick={() => m.path && navigate(m.path)}
              className="bg-white rounded-2xl shadow px-8 py-6 w-48 text-center hover:scale-105 transition border border-[#d0f6ff]"
            >
              <div className="text-4xl mb-2">{m.icon}</div>
              <div className="text-[#00B8E6] font-semibold text-base">{m.name}</div>
            </button>
          ))}
        </div>
      </div>

    </section>
  );
}
