import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, setToken } from "../api";
import { connectAsUser } from "../socket"; // เพิ่ม

export default function Register() {
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    const displayName = form.displayName.trim();
    const email = form.email.trim();
    const password = form.password;

    if (!displayName || !email || !password || !form.confirmPassword) {
      alert("กรอกข้อมูลให้ครบ");
      return;
    }
    if (password !== form.confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      alert("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      // 1) สมัครสมาชิก
      await api.post("/auth/register", { displayName, email, password });

      // 2) ล็อกอินทันที
      const r = await api.post("/auth/login", { identifier: email, password });
      const token = r.data?.token;
      if (!token) throw new Error("No token returned");

      // เก็บ token “ทางเดียว”
      setToken(token);

      // 3) ดึง me ให้ได้ id จริง
      const meRes = await api.get("/auth/me");
      const me = meRes.data?.me;

      // เซ็ต user ลง localStorage (ไว้ให้หน้าอื่นใช้)
      localStorage.setItem("userId", me.id);
      localStorage.setItem("user", JSON.stringify(me));

      // ต่อ socket “ในนาม user นี้” ทันที (แก้บัคหลังสมัคร)
      const ok = await connectAsUser(me.id);
      console.log("connectAsUser ok?", ok);

      // 4) ไปหน้าเลือกประเทศ
      navigate("/setup/country", { replace: true });
    } catch (e) {
      alert(e?.response?.data?.error || "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen w-screen flex items-center justify-center"
      style={{ backgroundColor: "#E9FBFF" }}
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-10 border border-[#d0f6ff] text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#00B8E6" }}>
          สมัครสมาชิก
        </h1>
        <p className="text-gray-600 mb-8">สร้างบัญชีใหม่เพื่อเริ่มใช้งานระบบ</p>

        <form onSubmit={submit} className="space-y-5 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้</label>
            <input
              className="w-full border border-[#a5e8f7] rounded-xl px-4 py-3 text-gray-700
                         focus:ring-2 focus:ring-[#00DDFF] outline-none shadow-sm placeholder-gray-400"
              placeholder="เช่น mewmew"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input
              className="w-full border border-[#a5e8f7] rounded-xl px-4 py-3 text-gray-700
                         focus:ring-2 focus:ring-[#00DDFF] outline-none shadow-sm placeholder-gray-400"
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <input
              className="w-full border border-[#a5e8f7] rounded-xl px-4 py-3 text-gray-700
                         focus:ring-2 focus:ring-[#00DDFF] outline-none shadow-sm placeholder-gray-400"
              type="password"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
            <input
              className="w-full border border-[#a5e8f7] rounded-xl px-4 py-3 text-gray-700
                         focus:ring-2 focus:ring-[#00DDFF] outline-none shadow-sm placeholder-gray-400"
              type="password"
              placeholder="กรอกซ้ำอีกครั้ง"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl text-white text-lg font-semibold py-3 transition shadow-md
              ${loading ? "opacity-70 cursor-not-allowed bg-[#00DDFF]" : "bg-[#00DDFF] hover:bg-[#00B8E6]"}`}
          >
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-6">
          มีบัญชีอยู่แล้ว?{" "}
          <Link to="/login" className="text-[#00B8E6] hover:text-[#00DDFF] font-medium">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </main>
  );
}