import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Lobby() {
  const [me, setMe] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [item, setItem] = useState(null);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/me");
        const user = res.data?.me;
        setMe(user);

        // โหลดจาก localStorage
        const storedAvatar = localStorage.getItem("sel_avatar");
        const storedItem = localStorage.getItem("sel_item");
        const storedCats = localStorage.getItem("sel_categories");

        if (storedAvatar) setAvatar(JSON.parse(storedAvatar));
        if (storedItem) setItem(JSON.parse(storedItem));
        if (storedCats) setInterests(JSON.parse(storedCats));

        // ใช้ข้อมูลจาก backend ถ้ามี
        if (user?.avatar_id && storedAvatar)
          setAvatar(JSON.parse(storedAvatar));
        if (user?.item_id && storedItem)
          setItem(JSON.parse(storedItem));
        if (user?.interests?.length)
          setInterests(user.interests);
      } catch (e) {
        console.error("โหลดข้อมูลไม่สำเร็จ:", e);
        navigate("/setup/country", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#E9FBFF]">
        <p className="text-gray-500 text-lg">กำลังโหลด...</p>
      </main>
    );
  }

  const country = me?.country || "-";

  return (
    <main
      className="min-h-screen w-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#E9FBFF" }}
    >
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-lg border border-[#d0f6ff] p-10 text-center">
        {/* Title */}
        <h1 className="text-3xl font-bold text-[#00B8E6] mb-1">
          ยินดีต้อนรับ {me?.display_name || "ผู้ใช้ใหม่"}!
        </h1>
        <p className="text-gray-600 mb-8 text-base">
          โปรไฟล์ของคุณถูกตั้งค่าเรียบร้อยแล้ว 
        </p>

        {/* Avatar + Item */}
        <div className="relative mx-auto w-[200px] h-[280px] mb-8 rounded-2xl border-4 border-[#a5e8f7] bg-[#f0fdff] shadow-md flex items-center justify-center">
          {item && (
            <img
              src={item.image_url || item.imageUrl}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-contain z-10 opacity-95"
            />
          )}
          {avatar && (
            <img
              src={avatar.image_url || avatar.imageUrl}
              alt={avatar.name}
              className="absolute inset-0 w-full h-full object-contain z-20"
            />
          )}
        </div>

        {/* User Info */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#00B8E6] mb-3">ข้อมูลของคุณ</h2>
          <div className="text-gray-700 text-sm space-y-1">
            <p><b>ประเทศ:</b> {country}</p>
            <p><b>อวตาร์:</b> {avatar?.name || "-"}</p>
            <p><b>ไอเท็ม:</b> {item?.name || "-"}</p>
          </div>
        </div>

        {/* Interests */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-[#00B8E6] mb-4">หมวดหมู่ที่คุณสนใจ</h3>
          {interests.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-3">
              {interests.map((cat, idx) => (
                <span
                  key={idx}
                  className="bg-[#00B8E6] text-white px-5 py-2 rounded-full shadow-md text-sm font-semibold"
                >
                  {cat}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">ยังไม่ได้เลือกหมวดหมู่</p>
          )}
        </div>

        {/* ปุ่มย้อนกลับ + เริ่มต้นใช้งาน */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate("/setup/category", { replace: true })}
            className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium text-base transition"
          >
            ย้อนกลับ
          </button>
          <button
            onClick={() => navigate("/home")}
            className="px-8 py-3 text-base rounded-xl text-white font-semibold bg-[#00DDFF] hover:bg-[#00B8E6] shadow-md transition"
          >
            เริ่มต้นใช้งาน
          </button>
        </div>
      </div>
    </main>
  );
}
