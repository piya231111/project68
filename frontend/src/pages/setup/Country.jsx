// src/pages/setup/Country.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { countries } from "countries-list";
import { api } from "../../api";

const ALL_COUNTRIES = Object.values(countries)
    .map((c) => c.name)
    .sort();

export default function SelectCountry() {
    const [country, setCountry] = useState("");
    const [filtered, setFiltered] = useState(ALL_COUNTRIES);
    const [showList, setShowList] = useState(false);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();
    const listRef = useRef(null);

    // ด้านบนสุดของ component
    const location = useLocation();

    // ✅ ถ้ามีประเทศอยู่แล้วให้เด้งกลับหน้า avatar (เว้นแต่กดย้อนกลับมาจาก avatar)
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/me");
                const user = res.data?.me;

                // ถ้ามาจากปุ่มย้อนกลับ (state.fromBack = true) → ไม่ redirect
                if (!location.state?.fromBack && user?.country) {
                    navigate("/setup/avatar", { replace: true });
                    return;
                }
            } catch (e) {
                console.error("Error fetching user:", e);
            }
        })();
    }, [navigate, location.state]);

    // ✅ ค้นหาประเทศแบบ realtime
    const handleSearch = (value) => {
        setCountry(value);
        if (value.trim() === "") {
            setFiltered(ALL_COUNTRIES);
        } else {
            const matches = ALL_COUNTRIES.filter((c) =>
                c.toLowerCase().startsWith(value.toLowerCase())
            );
            setFiltered(matches);
        }
        setShowList(true);
    };

    // ✅ เลือกประเทศจากรายการ
    const handleSelect = (name) => {
        setCountry(name);
        setShowList(false);
    };

    // ✅ ปิด dropdown เมื่อคลิกนอกกล่อง
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (listRef.current && !listRef.current.contains(event.target)) {
                setShowList(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ✅ บันทึกประเทศ
    const submit = async () => {
        if (!country.trim()) return alert("กรุณาเลือกประเทศก่อน");
        setSaving(true);
        try {
            await api.post("/me/profile", { country });
            localStorage.setItem("sel_country", country);
            navigate("/setup/avatar", { replace: true });
        } catch (err) {
            console.error("Save country failed:", err);
            alert(err?.response?.data?.error || "บันทึกไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    };

    return (
        <main
            className="min-h-screen w-screen flex items-center justify-center"
            style={{ backgroundColor: "#E9FBFF" }}
        >
            <div className="w-full max-w-xl bg-white rounded-3xl shadow-lg p-10 border border-[#d0f6ff] text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[#00B8E6]">
                    เลือกประเทศของคุณ
                </h1>
                <p className="text-gray-600 mb-8">
                    เพื่อให้ระบบรู้จักคุณมากขึ้น — โปรดเลือกประเทศที่คุณอยู่
                </p>

                <div ref={listRef} className="relative mx-auto w-full max-w-xs text-left">
                    <input
                        type="text"
                        placeholder="พิมพ์ชื่อประเทศ เช่น Thailand..."
                        value={country}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => setShowList(true)}
                        className="w-full border border-[#a5e8f7] rounded-xl px-4 py-3 text-lg font-medium text-gray-700
              focus:ring-2 focus:ring-[#00DDFF] outline-none shadow-sm placeholder-gray-400"
                    />

                    {showList && filtered.length > 0 && (
                        <ul className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto bg-white border border-[#a5e8f7] rounded-xl shadow-lg">
                            {filtered.map((c) => (
                                <li
                                    key={c}
                                    onClick={() => handleSelect(c)}
                                    className="px-4 py-2 hover:bg-[#E9FBFF] cursor-pointer text-[#00B8E6] font-medium"
                                >
                                    {c}
                                </li>
                            ))}
                        </ul>
                    )}

                    {showList && filtered.length === 0 && (
                        <div className="absolute mt-2 w-full bg-white border border-[#a5e8f7] rounded-xl shadow-lg px-4 py-2 text-gray-500">
                            ไม่พบประเทศที่ค้นหา
                        </div>
                    )}
                </div>

                <button
                    onClick={submit}
                    disabled={saving}
                    className={`mt-10 w-full max-w-xs mx-auto block rounded-xl text-white text-lg font-semibold py-3 transition shadow-md
            ${saving
                            ? "opacity-70 cursor-not-allowed bg-[#00DDFF]"
                            : "bg-[#00DDFF] hover:bg-[#00B8E6]"
                        }`}
                >
                    {saving ? "กำลังบันทึก..." : "ถัดไป"}
                </button>
            </div>
        </main>
    );
}
