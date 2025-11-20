import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { api } from "../api"; // ✅ ดึงจาก backend

export default function Layout() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [me, setMe] = useState(null);   // ✅ เก็บข้อมูลผู้ใช้
    const [loading, setLoading] = useState(true);

    // ✅ โหลดข้อมูลผู้ใช้จาก /me
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/me");
                setMe(res.data?.me);
            } catch (err) {
                console.error("โหลดข้อมูลผู้ใช้ไม่สำเร็จ:", err);
                // ถ้า token หมดอายุ → กลับไปหน้า login
                navigate("/login", { replace: true });
            } finally {
                setLoading(false);
            }
        })();
    }, [navigate]);

    const logout = () => {
        localStorage.removeItem("token");
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
        <main className="min-h-screen w-screen flex flex-col bg-[#E9FBFF]">
            {/* ✅ Header */}
            <header className="w-full bg-white/90 shadow-sm backdrop-blur-sm py-4 px-8 flex justify-between items-center relative">
                <h1
                    onClick={() => navigate("/home")}
                    className="text-2xl font-bold text-[#00B8E6] cursor-pointer hover:text-[#008bb8] transition"
                >
                    Star World
                </h1>

                <div className="flex items-center gap-2 relative">
                    {/* ✅ ชื่อผู้ใช้ */}
                    <p
                        onClick={() => navigate("/profile")}
                        className="text-gray-700 font-medium cursor-pointer hover:text-[#00B8E6] transition"
                        title="ดูโปรไฟล์"
                    >
                        {me?.display_name || me?.email || "ผู้ใช้"}
                    </p>

                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 rounded-full hover:bg-gray-100 transition"
                        title="เมนูเพิ่มเติม"
                    >
                        ⋮
                    </button>

                    {menuOpen && (
                        <div className="absolute top-10 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-30 w-44 text-sm animate-fadeIn">
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    navigate("/profile");
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#E9FBFF]"
                            >
                                👤 โปรไฟล์
                            </button>
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    alert("🔔 แจ้งเตือน (ยังไม่เปิดใช้งาน)");
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#E9FBFF]"
                            >
                                🔔 แจ้งเตือน
                            </button>
                            <hr />
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    logout();
                                }}
                                className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50"
                            >
                                🚪 ออกจากระบบ
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* ✅ ส่วนเนื้อหาแต่ละหน้า */}
            <div className="flex-1">
                <Outlet />
            </div>
        </main>
    );
}
