import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Layout() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);   // ⭐ ป็อปอัปการตั้งค่า
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const logout = async () => {
        try {
            await api.post("/auth/logout");   // ⭐ แจ้ง backend ว่า user ออกจากระบบ
        } catch (err) {
            console.error("logout error:", err);
        }

        // ⭐ ล้าง token ออกจาก frontend
        localStorage.removeItem("token");

        // ⭐ เปลี่ยนหน้าไป login
        navigate("/login", { replace: true });
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#E9FBFF]">
                <p className="text-gray-500">กำลังโหลด...</p>
            </main>
        );
    }

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

                <div className="flex items-center gap-2 relative">
                    <p
                        onClick={() => navigate("/profile")}
                        className="text-gray-700 font-medium cursor-pointer hover:text-[#00B8E6]"
                    >
                        {me?.display_name || me?.email}
                    </p>

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
                                👤 โปรไฟล์
                            </button>

                            {/* ⭐ เมนูใหม่: การตั้งค่า */}
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    setSettingsOpen(true);    // ⭐ เปิดป็อปอัป
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#E9FBFF]"
                            >
                                ⚙️ การตั้งค่า
                            </button>

                            <button
                                onClick={logout}
                                className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50"
                            >
                                🚪 ออกจากระบบ
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex-1 w-full">
                <Outlet />
            </div>

            {/* ⭐ Modal ตั้งค่า */}
            {settingsOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[2000]"
                    onClick={() => setSettingsOpen(false)}
                >
                    <div
                        className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ปิด */}
                        <button
                            className="absolute top-3 right-3 text-xl text-gray-500 hover:text-gray-800"
                            onClick={() => setSettingsOpen(false)}
                        >
                            ✖
                        </button>

                        <h2 className="text-xl font-bold mb-4 text-gray-700">
                            ⚙️ ตั้งค่า
                        </h2>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setSettingsOpen(false);
                                    navigate("/friends/manage"); // เส้นทางไปหน้าจัดการรายชื่อ
                                }}
                                className="w-full bg-[#00B8E6] text-white py-3 rounded-xl hover:bg-[#009ecc]"
                            >
                                จัดการรายชื่อ
                            </button>

                            {/* สามารถเพิ่มเมนูอื่นในอนาคต */}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
