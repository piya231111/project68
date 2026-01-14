import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function AvatarSelect() {
  const [avatars, setAvatars] = useState([]);
  const [selected, setSelected] = useState(null);
  const [item, setItem] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [a, m] = await Promise.all([
          api.get("/avatars"),
          api.get("/auth/me"),
        ]);

        const list = a.data?.avatars || [];
        const user = m.data?.me;
        setAvatars(list);
        setMe(user);

        // โหลด item ปัจจุบัน
        if (user?.item_id) {
          const itemRes = await api.get(`/items/${user.item_id}`);
          setItem(itemRes.data);
        }

        // โหลด avatar ปัจจุบันโดยตรง (ไม่พึ่ง list)
        if (user?.avatar_id) {
          try {
            const avatarRes = await api.get(`/avatars/${user.avatar_id}`);
            setSelected(avatarRes.data);
          } catch {
            // ถ้าหาไม่เจอใน db ให้ลองหาจาก list แทน
            const found = list.find((x) => x.id === user.avatar_id);
            if (found) setSelected(found);
          }
        }
      } catch (e) {
        console.error("โหลดข้อมูลล้มเหลว:", e);
        setError("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const goBack = () => navigate("/profile", { replace: true });

  const submit = async () => {
    if (!selected) return alert("กรุณาเลือกอวตาร์ก่อน");
    setSaving(true);
    try {
      await api.patch("/auth/me", { avatar_id: selected.id });
      alert("เปลี่ยนอวตาร์เรียบร้อย");
      navigate("/profile");
    } catch (e) {
      console.error("บันทึกอวตาร์ไม่สำเร็จ:", e);
      alert("ไม่สามารถบันทึกอวตาร์ได้");
    } finally {
      setSaving(false);
    }
  };

  // pagination logic
  const totalPages = Math.ceil(avatars.length / perPage);
  const startIdx = (currentPage - 1) * perPage;
  const currentAvatars = avatars.slice(startIdx, startIdx + perPage);

  return (
    <main className="flex flex-1 justify-center items-center px-16 py-12 gap-16 bg-[#E9FBFF]">
      <div className="flex flex-col md:flex-row w-full max-w-7xl bg-white rounded-3xl shadow-lg border border-[#d0f6ff] overflow-hidden">

        {/* ฝั่งซ้าย - Preview */}
        <aside className="md:w-1/2 bg-[#F8FEFF] flex flex-col items-center justify-center p-10 border-b md:border-b-0 md:border-r border-[#d0f6ff]">
          <h2 className="text-2xl font-bold mb-6 text-[#00B8E6]">
            ตัวละครของคุณ
          </h2>

          <div className="relative w-[300px] h-[420px] rounded-3xl shadow-lg border-4 border-[#a5e8f7] bg-[#f0fdff] flex items-center justify-center">
            {item && (
              <img
                src={item.image_url || item.imageUrl}
                alt="item"
                className="absolute inset-0 w-full h-full object-contain z-10 opacity-95"
              />
            )}

            {selected ? (
              <img
                src={selected.image_url || selected.imageUrl}
                alt={selected.name}
                className="absolute inset-0 w-full h-full object-contain z-20"
              />
            ) : (
              <p className="text-gray-400 text-lg z-30">ยังไม่ได้เลือกอวตาร์</p>
            )}
          </div>

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
              เลือกอวตาร์ใหม่
            </h1>
            <div className="flex gap-3">
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
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>

          {loading && <p className="text-gray-500">กำลังโหลด...</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && (
            <>
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
