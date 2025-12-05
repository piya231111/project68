import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { socket } from "../socket";


export default function Home() {
  const [me, setMe] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // ⭐ ประกาศ state modal
  const [showChatModal, setShowChatModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await api.get("/auth/me");
        const user = res.data?.me;

        if (!isMounted) return;
        setMe(user);

        if (user?.avatar_id) {
          api.get(`/avatars/${user.avatar_id}`).then((a) => {
            if (isMounted) setAvatar(a.data);
          });
        }

        if (user?.item_id) {
          api.get(`/items/${user.item_id}`).then((i) => {
            if (isMounted) setItem(i.data);
          });
        }
      } catch (err) {
        navigate("/login", { replace: true });
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (me?.id) {
      socket.emit("online", me.id);
    }
  }, [me]);


  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#E9FBFF]">
        <p className="text-gray-500">กำลังโหลด...</p>
      </main>
    );
  }

  const menuItems = [
    { name: "เพื่อน", path: "/friends" },
    { name: "ห้องแชท", isChat: true },
    { name: "โปรไฟล์", path: "/profile" },
    { name: "แจ้งเตือน", path: "/notifications" },
  ];

  return (
    <>
      {/* ---------- MAIN PAGE ---------- */}
      <section className="flex flex-1 justify-center items-center px-16 py-12 gap-16 bg-[#E9FBFF]">

        {/* User Info */}
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="relative w-[420px] h-[560px] flex items-center justify-center">

            {item && (
              <img
                src={item.image_url || item.imageUrl}
                alt="item"
                className="absolute inset-0 w-full h-full object-contain z-10 opacity-95"
              />
            )}

            {avatar && (
              <img
                src={avatar.image_url || avatar.imageUrl}
                alt="avatar"
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
                onClick={() => {
                  if (m.isChat) setShowChatModal(true);
                  else if (m.path) navigate(m.path);
                }}
                className="bg-white rounded-3xl shadow-lg px-10 py-8 w-56 text-center 
                  hover:scale-105 transition-transform border border-[#c8f2ff]"
              >
                <div className="text-[#00B8E6] font-bold text-2xl tracking-wide">
                  {m.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CHAT SELECT MODAL ---------- */}
      {showChatModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={() => setShowChatModal(false)}
        >
          <div
            className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-[#bcecff] text-center animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#00B8E6] mb-6">
              เลือกห้องแชท
            </h2>

            <button
              className="w-full bg-[#00B8E6] hover:bg-[#009ecc] text-white font-semibold py-3 rounded-xl mb-4"
              onClick={() => {
                setShowChatModal(false);
                navigate("/chat/random/wait");
              }}
            >
              ห้องแชทสุ่ม
            </button>

            <button
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl"
              onClick={() => {
                setShowChatModal(false);
                navigate("/chat/group");
              }}
            >
              ห้องแชทกลุ่ม
            </button>

            <button
              className="mt-6 text-gray-500 hover:text-gray-700"
              onClick={() => setShowChatModal(false)}
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </>
  );
}
