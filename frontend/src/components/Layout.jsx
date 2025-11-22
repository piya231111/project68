import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Layout() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
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
        <main className="min-h-screen w-full overflow-x-hidden bg-[#E9FBFF]">
            {/* Header */}
            <header className="w-full bg-white/90 shadow-sm backdrop-blur-sm py-4 px-8 flex justify-between items-center relative">
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
                        <div className="absolute top-10 right-0 bg-white border rounded-xl shadow-lg w-44 z-30">
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
        </main>
    );
}
