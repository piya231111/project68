// src/pages/setup/Avatar.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function Avatar() {
  const navigate = useNavigate();

  const [avatars, setAvatars] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6; // แสดง 6 ตัวต่อหน้า

  useEffect(() => {
    (async () => {
      try {
        const [a, me] = await Promise.all([
          api.get("/avatars"),
          api.get("/me").catch(() => null),
        ]);
        const list = a.data?.avatars || [];
        setAvatars(list);

        const currentAvatarId = me?.data?.me?.profile?.avatarId;
        if (currentAvatarId) {
          const found = list.find((x) => x.id === currentAvatarId);
          if (found) setSelected(found);
        }
      } catch (e) {
        console.error("load avatars failed:", e);
        setError(e?.response?.data?.error || "โหลดอวตาร์ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const goBack = () => navigate("/setup/country", { state: { fromBack: true } });

  const submit = async () => {
    if (!selected) {
      alert("กรุณาเลือกอวตาร์");
      return;
    }
    setSaving(true);
    try {
      await api.post("/me/profile", { avatarId: selected.id });
      localStorage.setItem("sel_avatar", JSON.stringify(selected));
      navigate("/setup/items", { replace: true });
    } catch (e) {
      console.error("save avatar failed:", e);
      alert(e?.response?.data?.error || "บันทึกอวตาร์ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // คำนวณรายการที่จะโชว์ตามหน้าปัจจุบัน
  const totalPages = Math.ceil(avatars.length / perPage);
  const startIdx = (currentPage - 1) * perPage;
  const currentAvatars = avatars.slice(startIdx, startIdx + perPage);

  return (
    <main
      className="min-h-screen w-screen flex items-center justify-center"
      style={{ backgroundColor: "#E9FBFF" }}
    >
      <div className="flex flex-col md:flex-row w-full max-w-7xl bg-white rounded-3xl shadow-lg border border-[#d0f6ff] overflow-hidden">
        
        {/* ฝั่งซ้าย - Preview */}
        <aside className="md:w-1/2 bg-[#F8FEFF] flex flex-col items-center justify-center p-10 border-b md:border-b-0 md:border-r border-[#d0f6ff]">
          <h2 className="text-2xl font-bold mb-6 text-[#00B8E6]">
            สิ่งที่คุณเลือก
          </h2>

          {selected ? (
            <div className="relative w-[300px] h-[420px] mx-auto rounded-3xl shadow-xl border-4 border-[#a5e8f7] bg-[#f0fdff]">
              <img
                src={selected.image_url || selected.imageUrl}
                alt={selected.name}
                className="absolute inset-0 w-full h-full object-contain z-10"
              />
            </div>
          ) : (
            <div className="w-[300px] h-[420px] rounded-3xl shadow-inner border-2 border-dashed border-[#a5e8f7] flex items-center justify-center text-gray-400 text-lg">
              ยังไม่ได้เลือก
            </div>
          )}

          {selected && (
            <p className="mt-6 text-xl font-bold text-[#00B8E6]">
              {selected.name}
            </p>
          )}
        </aside>

        {/* ฝั่งขวา - เลือกอวตาร์ */}
        <section className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-[#00B8E6]">
              เลือกอวตาร์ของคุณ
            </h1>
            <div className="flex gap-2">
              <button
                onClick={goBack}
                className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={submit}
                disabled={saving || !selected}
                className={`px-6 py-2 rounded-xl text-white font-semibold shadow-md transition
                  ${
                    saving
                      ? "opacity-70 cursor-not-allowed bg-[#00DDFF]"
                      : "bg-[#00DDFF] hover:bg-[#00B8E6]"
                  }`}
              >
                {saving ? "กำลังบันทึก..." : "ถัดไป"}
              </button>
            </div>
          </div>

          {loading && <p className="text-gray-500">กำลังโหลด...</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && (
            <>
              {/* Grid แสดงอวตาร์ 6 ตัวต่อหน้า */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {currentAvatars.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`cursor-pointer rounded-2xl bg-white border-2 p-4 shadow-sm hover:shadow-md transition
                      ${
                        selected?.id === a.id
                          ? "border-[#00B8E6] ring-2 ring-[#00DDFF]"
                          : "border-transparent hover:border-[#a5e8f7]"
                      }`}
                  >
                    <img
                      src={a.image_url || a.imageUrl}
                      alt={a.name}
                      className="h-36 w-auto mx-auto object-contain"
                    />
                    <p className="mt-3 text-center font-medium text-gray-700">
                      {a.name}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pagination ปุ่มเปลี่ยนหน้า */}
              <div className="flex justify-center mt-10 gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`px-4 py-2 rounded-lg font-semibold border transition
                      ${
                        num === currentPage
                          ? "bg-[#00B8E6] text-white border-[#00B8E6]"
                          : "bg-white border-[#a5e8f7] text-[#00B8E6] hover:bg-[#E9FBFF]"
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
