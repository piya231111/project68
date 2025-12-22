// src/pages/setup/Category.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

const ALL_CATEGORIES = [
  "Music", "Movies", "Books", "Gaming", "Sports", "Travel", "Food", "Art",
  "Technology", "Science", "Fashion", "Fitness", "Photography", "Pets",
  "Education", "Finance", "Health", "DIY", "Cars", "Nature",
];

export default function Category() {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const toggleCategory = (cat) => {
    if (selected.includes(cat)) {
      setSelected(selected.filter((x) => x !== cat));
    } else if (selected.length < 5) {
      setSelected([...selected, cat]);
    } else {
      alert("เลือกได้ไม่เกิน 5 หมวดหมู่");
    }
  };

  const goBack = () => navigate("/setup/items", { replace: true });

  const submit = async () => {
    if (selected.length < 3)
      return alert("กรุณาเลือกอย่างน้อย 3 หมวดหมู่");
    setSaving(true);
    try {
      await api.post("/me/profile", { interests: selected });
      navigate("/lobby", { replace: true });
    } catch (err) {
      console.error("บันทึกหมวดหมู่ไม่สำเร็จ:", err);
      alert("บันทึกหมวดหมู่ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      className="min-h-screen w-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: "#E9FBFF" }}
    >
      <div className="flex flex-col md:flex-row w-full max-w-7xl bg-white rounded-3xl shadow-lg border border-[#d0f6ff] overflow-hidden">
        
        {/* ด้านซ้าย: Preview */}
        <aside className="md:w-[45%] bg-[#F8FEFF] flex flex-col items-center justify-center p-14 border-b md:border-b-0 md:border-r border-[#d0f6ff]">
          <h2 className="text-3xl font-bold mb-6 text-[#00B8E6]">
            หมวดหมู่ที่คุณเลือก
          </h2>

          <div className="flex flex-wrap gap-4 justify-center max-w-md">
            {selected.length > 0 ? (
              selected.map((cat) => (
                <span
                  key={cat}
                  className="bg-[#00B8E6] text-white px-5 py-3 rounded-full shadow-md text-base font-semibold"
                >
                  {cat}
                </span>
              ))
            ) : (
              <p className="text-gray-400 text-lg">ยังไม่ได้เลือก</p>
            )}
          </div>

          <p className="mt-10 text-gray-600 text-md">
            เลือกได้ไม่ต่ำกว่า <b>3</b> และไม่เกิน <b>5</b> หมวดหมู่
          </p>
        </aside>

        {/* ด้านขวา: ตัวเลือก */}
        <section className="flex-1 p-12">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-3xl font-bold text-[#00B8E6]">
              เลือกหมวดหมู่ที่คุณสนใจ
            </h1>
            <div className="flex gap-3">
              <button
                onClick={goBack}
                className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium text-base transition"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={submit}
                disabled={saving}
                className={`px-7 py-3 rounded-xl text-white text-base font-semibold shadow-md transition
                  ${
                    saving
                      ? "opacity-70 cursor-not-allowed bg-[#00DDFF]"
                      : "bg-[#00DDFF] hover:bg-[#00B8E6]"
                  }`}
              >
                {saving ? "กำลังบันทึก..." : "เสร็จสิ้น"}
              </button>
            </div>
          </div>

          {/* ปุ่มหมวดหมู่แบบใหญ่และโปร */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`py-5 px-6 rounded-2xl text-lg font-semibold border transition-all transform
                  ${
                    selected.includes(cat)
                      ? "bg-[#00B8E6] text-white shadow-md scale-105"
                      : "bg-white text-[#00B8E6] border-[#a5e8f7] hover:bg-[#E9FBFF] hover:shadow-lg hover:scale-[1.02]"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
