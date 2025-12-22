// src/pages/profile/ItemSelect.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../api";

export default function ItemSelect() {
  const [items, setItems] = useState([]);
  const [me, setMe] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

useEffect(() => {
  (async () => {
    try {
      // โหลดข้อมูล items และ me พร้อมกัน
      const [iRes, uRes] = await Promise.all([api.get("/items"), api.get("/me")]);
      const itemsList = iRes.data.items || [];
      const user = uRes.data.me;

      setItems(itemsList);
      setMe(user);

      // โหลดอวตาร์
      if (user?.avatar_id) {
        const av = await api.get(`/avatars/${user.avatar_id}`);
        setAvatar(av.data);
      }

      // ตรวจว่ามี item_id เดิมไหม
      if (user?.item_id) {
        const currentItem = itemsList.find((x) => x.id === user.item_id);

        if (currentItem) {
          // เจอใน list → ใช้เลย
          setSelected(currentItem);
        } else {
          // ถ้าไม่เจอ (เช่นมีใน DB แต่ไม่มีใน items list)
          // ดึงจาก API โดยตรง
          const fallback = await api.get(`/items/${user.item_id}`).catch(() => null);
          if (fallback?.data) setSelected(fallback.data);
        }
      }
    } catch (err) {
      console.error("❌ โหลดข้อมูลไม่สำเร็จ:", err);
    } finally {
      setLoading(false);
    }
  })();
}, []);


  const selectItem = (item) => {
    setSelected(item);
  };

  const saveItem = async () => {
    if (!selected) return alert("กรุณาเลือกไอเทมก่อน");
    setSaving(true);
    try {
      await api.patch("/auth/me", { item_id: selected.id });
      alert("เปลี่ยนไอเทมเรียบร้อย");
      navigate("/profile");
    } catch (err) {
      console.error("❌ เปลี่ยนไม่สำเร็จ:", err);
      alert("❌ เปลี่ยนไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#E9FBFF]">
        <p className="text-gray-500">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 justify-center items-center px-16 py-12 gap-16 bg-[#E9FBFF]">
      <div className="flex flex-col md:flex-row w-full max-w-7xl bg-white rounded-3xl shadow-lg border border-[#d0f6ff] overflow-hidden">
        {/* ฝั่งซ้าย: Preview อวตาร์ + ไอเทม */}
        <aside className="md:w-[45%] bg-[#F8FEFF] flex flex-col items-center justify-center p-12 border-b md:border-b-0 md:border-r border-[#d0f6ff]">
          <h2 className="text-2xl font-bold mb-6 text-[#00B8E6]">ตัวละครของคุณ</h2>

          <div className="relative w-[340px] h-[460px] flex justify-center items-center bg-[#f0fdff] rounded-3xl border-4 border-[#a5e8f7] shadow-xl overflow-hidden">
            {/* แสดงไอเทม (ล่าง) */}
            {selected ? (
              <img
                src={selected.image_url || selected.imageUrl}
                alt={selected.name}
                className="absolute inset-0 w-full h-full object-contain z-10 opacity-95"
              />
            ) : me?.item_id ? (
              <img
                src={items.find((x) => x.id === me.item_id)?.image_url}
                alt="current item"
                className="absolute inset-0 w-full h-full object-contain z-10 opacity-95"
              />
            ) : null}

            {/* แสดงอวตาร์ (บนสุด) */}
            {avatar && (
              <img
                src={avatar.image_url || avatar.imageUrl}
                alt="avatar"
                className="absolute inset-0 w-full h-full object-contain z-20"
              />
            )}
          </div>

          {/* แสดงชื่อไอเทมที่เลือก */}
          {selected && (
            <p className="mt-6 text-lg font-semibold text-[#00B8E6]">{selected.name}</p>
          )}
        </aside>

        {/* ฝั่งขวา: เลือกไอเทม */}
        <section className="flex-1 p-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-[#00B8E6]">เลือกไอเทมของคุณ</h1>
            <div className="flex gap-3">
              <Link
                to="/profile"
                className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition"
              >
                ย้อนกลับ
              </Link>
              <button
                onClick={saveItem}
                disabled={saving}
                className={`px-6 py-2 rounded-xl text-white font-semibold shadow-md transition ${
                  saving
                    ? "opacity-70 cursor-not-allowed bg-[#00DDFF]"
                    : "bg-[#00DDFF] hover:bg-[#00B8E6]"
                }`}
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>

          {/* Grid แสดงไอเทมทั้งหมด */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {items.map((it) => (
              <div
                key={it.id}
                onClick={() => selectItem(it)}
                className={`cursor-pointer rounded-2xl bg-white border-2 p-4 shadow-sm hover:shadow-md transition-all transform ${
                  selected?.id === it.id
                    ? "border-[#00B8E6] ring-2 ring-[#00DDFF] scale-105"
                    : "border-transparent hover:border-[#a5e8f7]"
                }`}
              >
                <img
                  src={it.imageUrl || it.image_url}
                  alt={it.name}
                  className="h-36 w-auto mx-auto object-contain"
                />
                <p className="mt-3 text-center font-medium text-gray-700">{it.name}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
