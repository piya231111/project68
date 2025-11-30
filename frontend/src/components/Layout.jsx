import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { api } from "../api";
import { socket } from "../socket";

export default function Layout() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);

    const [notificationCount, setNotificationCount] = useState(0);

    /* ======================================================
       1) โหลดข้อมูล user ครั้งแรก
    ====================================================== */
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/me");
                setMe(res.data?.me);
            } catch (err) {
                navigate("/login", { replace: true });
            } finally {
                setLoading(false);
            }
        })();
    }, [navigate]);

    /* ======================================================
       2) Connect Socket.IO แค่ครั้งเดียวตอน Layout สร้าง
    ====================================================== */
    useEffect(() => {
        if (!socket.connected) {
            socket.connect();  // ⭐ connect แค่ครั้งเดียว
        }

        return () => {
            // ❗ ห้าม disconnect ที่นี่เด็ดขาด
        };
    }, []);

    /* ======================================================
       3) เมื่อ me โหลดเสร็จ → แจ้งว่า user ออนไลน์
    ====================================================== */
    useEffect(() => {
        if (!me) return;
        socket.emit("online", me.id);
    }, [me]);

    /* ======================================================
       4) โหลดตัวนับแจ้งเตือน
    ====================================================== */
    useEffect(() => {
        const loadCount = async () => {
            try {
                const res = await api.get("/notifications/count");
                setNotificationCount(res.data.count);
            } catch (err) {
                console.error("notification count error:", err);
            }
        };

        loadCount();
        const interval = setInterval(loadCount, 5000);

        return () => clearInterval(interval);
    }, []);

    /* ======================================================
       5) Logout → Disconnect socket ที่นี่เท่านั้น
    ====================================================== */
    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (err) {
            console.error("logout error:", err);
        }

        socket.disconnect();  // ⭐ ถูกต้อง

        localStorage.removeItem("token");
        navigate("/login", { replace: true });
    };

    /* ======================================================
       Loading UI
    ====================================================== */
    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#E9FBFF]">
                <p className="text-gray-500">กำลังโหลด...</p>
            </main>
        );
    }

    /* ======================================================
       UI Layout
    ====================================================== */
    return (
        <main className="min-h-screen w-full overflow-x-hidden bg-[#E9FBFF]">

            {/* Header */}
            <header className="w-full bg-white/90 shadow-sm backdrop-blur-sm py-4 px-8 flex justify-between items-center relative z-[1000]">
                <h1
                    onClick={() => navigate("/home")}
                    className="text-2xl font-bold text-[#00B8E6] cursor-pointer hover:text-[#008bb8]"
                >
                    Star World
                </h1>

                <div className="flex items-center gap-3 relative">

                    {/* Notification Button */}
                    <button
                        onClick={() => navigate("/notifications")}
                        className="relative p-2 rounded-full hover:bg-gray-100 transition"
                        title="แจ้งเตือน"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="#555"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.25 18.75h-4.5m8.25-6c0 3.182-1.318 5.25-6 5.25s-6-2.068-6-5.25V10.5a6 6 0 1112 0v2.25z"
                            />
                        </svg>

                        {notificationCount > 0 && (
                            <span className="
                                absolute -top-1 -right-1 
                                bg-red-500 text-white 
                                text-xs px-1.5 py-0.5
                                rounded-full">
                                {notificationCount}
                            </span>
                        )}
                    </button>

                    {/* Username */}
                    <p
                        onClick={() => navigate("/profile")}
                        className="text-gray-700 font-medium cursor-pointer hover:text-[#00B8E6]"
                    >
                        {me?.display_name || me?.email}
                    </p>

                    {/* Menu Button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 rounded-full hover:bg-gray-100"
                    >
                        ⋮
                    </button>

                    {menuOpen && (
                        <div className="absolute top-10 right-0 bg-white border rounded-xl shadow-lg w-48 z-30">
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    navigate("/profile");
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#E9FBFF]"
                            >
                                โปรไฟล์
                            </button>

                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    setSettingsOpen(true);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#E9FBFF]"
                            >
                                การตั้งค่า
                            </button>

                            <button
                                onClick={logout}
                                className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50"
                            >
                                ออกจากระบบ
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex-1 w-full">
                <Outlet />
            </div>

            {/* Settings Modal */}
            {settingsOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[2000]"
                    onClick={() => setSettingsOpen(false)}
                >
                    <div
                        className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-3 right-3 text-xl text-gray-500 hover:text-gray-800"
                            onClick={() => setSettingsOpen(false)}
                        >
                            ✖
                        </button>

                        <h2 className="text-xl font-bold mb-4 text-gray-700">
                            ตั้งค่า
                        </h2>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setSettingsOpen(false);
                                    navigate("/friends/manage");
                                }}
                                className="w-full bg-[#00B8E6] text-white py-3 rounded-xl hover:bg-[#009ecc]"
                            >
                                จัดการรายชื่อ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
