import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../api";

export default function ProfileView() {
  const [me, setMe] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/me");
        const user = res.data?.me;
        setMe(user);

        if (user?.avatar_id) {
          const av = await api.get(`/avatars/${user.avatar_id}`);
          setAvatar(av.data);
        }
        if (user?.item_id) {
          const it = await api.get(`/items/${user.item_id}`);
          setItem(it.data);
        }
      } catch (err) {
        console.error("โหลดข้อมูลไม่สำเร็จ:", err);
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#E9FBFF]">
        <p className="text-gray-500">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <section className="flex flex-1 justify-center items-center px-16 py-12 gap-16 bg-[#E9FBFF]">
      {/* ฝั่งซ้าย: อวตาร์ */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="relative w-[420px] h-[560px] flex items-center justify-center">
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

        <h2 className="mt-6 text-2xl font-bold text-[#00B8E6]">
          {me?.display_name || "ผู้ใช้ใหม่"}
        </h2>
        <p className="text-gray-600 text-lg">{me?.email}</p>
      </div>

      {/* ฝั่งขวา: กล่องข้อมูล */}
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-white rounded-3xl shadow-lg border border-[#d0f6ff] p-10 w-full max-w-md">
          <h2 className="text-2xl font-bold text-[#00B8E6] mb-6 text-center">
            ข้อมูลส่วนตัว
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">ชื่อ:</span>
              <span className="font-semibold text-gray-800">{me?.display_name || "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">ประเทศ:</span>
              <span className="font-semibold text-gray-800">{me?.country || "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">หมวดหมู่ความสนใจ:</span>
              <span className="font-semibold text-gray-800">
                {me?.interests?.length ? me.interests.join(", ") : "-"}
              </span>
            </div>
          </div>

          <div className="text-center mt-8 flex flex-col gap-3">
            <Link
              to="/profile/edit"
              className="px-8 py-3 bg-[#00B8E6] text-white rounded-xl hover:bg-[#009ecc] transition"
            >
              แก้ไขโปรไฟล์
            </Link>

            <button
              onClick={() => navigate("/home")}
              className="px-8 py-3 bg-white border border-[#00B8E6] text-[#00B8E6] rounded-xl hover:bg-[#E9FBFF] transition"
            >
              กลับหน้าแรก
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
