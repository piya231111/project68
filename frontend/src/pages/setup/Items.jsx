// src/pages/setup/Items.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function Items() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const perPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    const savedAvatar = localStorage.getItem("sel_avatar");
    if (savedAvatar) setAvatar(JSON.parse(savedAvatar));

    (async () => {
      try {
        const res = await api.get("/items");
        setItems(res.data.items || []);
      } catch (err) {
        console.error("โหลดไอเท็มไม่สำเร็จ:", err);
        setError("โหลดไอเท็มไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const goBack = () => navigate("/setup/avatar", { replace: true });

  const goNext = async () => {
    if (!selectedItem) return alert("กรุณาเลือกไอเท็ม");
    setSaving(true);
    try {
      await api.post("/me/profile", { itemId: selectedItem.id });
      localStorage.setItem("sel_item", JSON.stringify(selectedItem));
      navigate("/setup/category", { replace: true });
    } catch (err) {
      console.error("บันทึกไอเท็มไม่สำเร็จ:", err);
      alert("บันทึกไอเท็มไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // ✅ pagination
  const totalPages = Math.ceil(items.length / perPage);
  const startIdx = (currentPage - 1) * perPage;
  const currentItems = items.slice(startIdx, startIdx + perPage);

  return (
    <main
      className="min-h-screen w-screen flex items-center justify-center"
      style={{ backgroundColor: "#E9FBFF" }}
    >
      <div className="flex flex-col md:flex-row w-full max-w-7xl bg-white rounded-3xl shadow-lg border border-[#d0f6ff] overflow-hidden">
        
        {/* ✅ ฝั่งซ้าย - Preview */}
        <aside className="md:w-1/2 bg-[#F8FEFF] flex flex-col items-center justify-center p-10 border-b md:border-b-0 md:border-r border-[#d0f6ff]">
          <h2 className="text-2xl font-bold mb-6 text-[#00B8E6]">
            สิ่งที่คุณเลือก
          </h2>

          <div className="relative w-[300px] h-[420px] mx-auto rounded-3xl shadow-xl border-4 border-[#a5e8f7] bg-[#f0fdff]">
            {/* ไอเท็มอยู่ด้านหลัง */}
            {selectedItem && (
              <img
                src={selectedItem.image_url || selectedItem.imageUrl}
                alt={selectedItem.name}
                className="absolute inset-0 w-full h-full object-contain z-10 opacity-95"
              />
            )}
            {/* อวาตาร์อยู่ด้านหน้า */}
            {avatar && (
              <img
                src={avatar.image_url || avatar.imageUrl}
                alt={avatar.name}
                className="absolute inset-0 w-full h-full object-contain z-20"
              />
            )}
          </div>

          {avatar && (
            <p className="mt-6 text-xl font-bold text-[#00B8E6]">{avatar.name}</p>
          )}
          {selectedItem && (
            <p className="text-gray-600 text-md mt-1">{selectedItem.name}</p>
          )}
          {!selectedItem && (
            <p className="text-gray-400 text-md mt-1">ยังไม่ได้เลือก</p>
          )}
        </aside>

        {/* ✅ ฝั่งขวา - เลือกไอเท็ม */}
        <section className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-[#00B8E6]">
              เลือกไอเท็มของคุณ
            </h1>
            <div className="flex gap-2">
              <button
                onClick={goBack}
                className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={goNext}
                disabled={saving}
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
              {/* ✅ Grid แสดงไอเท็ม 6 ตัวต่อหน้า */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {currentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`cursor-pointer rounded-2xl bg-white border-2 p-4 shadow-sm hover:shadow-md transition
                      ${
                        selectedItem?.id === item.id
                          ? "border-[#00B8E6] ring-2 ring-[#00DDFF]"
                          : "border-transparent hover:border-[#a5e8f7]"
                      }`}
                  >
                    <img
                      src={item.image_url || item.imageUrl}
                      alt={item.name}
                      className="h-36 w-auto mx-auto object-contain"
                    />
                    <p className="mt-3 text-center font-medium text-gray-700">
                      {item.name}
                    </p>
                  </div>
                ))}
              </div>

              {/* ✅ Pagination */}
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
