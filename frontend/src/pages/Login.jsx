import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, setToken } from "../api";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

async function loadUserRelations(me) {
  try {
    const token = localStorage.getItem("token");

    const fr = await fetch("http://localhost:7000/api/friends", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());

    const bl = await fetch("http://localhost:7000/api/friends/blocked", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());

    // ⭐ ลบข้อมูลซ้ำด้วย Set()
    me.friends = [...new Set(fr.friends.map(f => f.id))];
    me.blocked = [...new Set(bl.blocked.map(b => b.id))];

    localStorage.setItem("user", JSON.stringify(me));
  } catch (err) {
    console.error("โหลด friends/blocked ไม่สำเร็จ:", err);
  }
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // =====================================================
  //  LOGIN แบบปกติ
  // =====================================================
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔹 Login
      const r = await api.post("/auth/login", {
        identifier: form.email.trim(),
        password: form.password,
      });

      const token = r.data?.token;
      if (!token) throw new Error("No token returned");

      // 🔹 เก็บ token
      setToken(token);

      // รอ backend อัปเดตสถานะ online
      await new Promise((res) => setTimeout(res, 150));

      const meRes = await api.get("/auth/me");
      const me = meRes.data?.me;

      // โหลดเพื่อน + บล็อค
      await loadUserRelations(me);

      localStorage.setItem("userId", me.id);
      localStorage.setItem("user", JSON.stringify(me));

      // 🔹 เช็คว่า setup ครบไหม
      if (me?.country && me?.avatar_id && me?.item_id && me?.interests?.length > 0) {
        navigate("/home", { replace: true });
      } else {
        navigate("/setup/country", { replace: true });
      }

    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  //  LOGIN ด้วย Google OAuth
  // =====================================================
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      jwtDecode(credentialResponse.credential); // debug only

      const r = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      const token = r.data?.token;
      if (!token) throw new Error("No token returned");

      setToken(token);

      // รอ backend อัปเดต online
      await new Promise((res) => setTimeout(res, 150));

      const meRes = await api.get("/auth/me");
      const me = meRes.data?.me;

      // โหลดเพื่อน + บล็อค
      await loadUserRelations(me);

      localStorage.setItem("userId", me.id);
      localStorage.setItem("user", JSON.stringify(me));

      if (me?.country && me?.avatar_id && me?.item_id && me?.interests?.length > 0) {
        navigate("/home", { replace: true });
      } else {
        navigate("/setup/country", { replace: true });
      }

    } catch (err) {
      console.error("Google login error:", err);
      alert("Google login failed");
    }
  };

  // =====================================================
  //  UI LOGIN
  // =====================================================
  return (
    <main className="min-h-screen w-screen flex items-center justify-center bg-[#E9FBFF]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-10 border border-[#d0f6ff] text-center">

        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#00B8E6" }}>
          เข้าสู่ระบบ
        </h1>

        <p className="text-gray-600 mb-8">
          ยินดีต้อนรับกลับ! โปรดเข้าสู่ระบบเพื่อดำเนินการต่อ
        </p>

        {/* ฟอร์ม login */}
        <form onSubmit={submit} className="space-y-5 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมลหรือชื่อผู้ใช้
            </label>
            <input
              className="w-full border border-[#a5e8f7] rounded-xl px-4 py-3 text-gray-700
                         focus:ring-2 focus:ring-[#00DDFF] outline-none shadow-sm placeholder-gray-400"
              placeholder="กรอกอีเมลหรือชื่อผู้ใช้"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่าน
            </label>
            <input
              type="password"
              className="w-full border border-[#a5e8f7] rounded-xl px-4 py-3 text-gray-700
                         focus:ring-2 focus:ring-[#00DDFF] outline-none shadow-sm placeholder-gray-400"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl text-white text-lg font-semibold py-3 transition shadow-md
              ${loading
                ? "opacity-70 cursor-not-allowed bg-[#00DDFF]"
                : "bg-[#00DDFF] hover:bg-[#00B8E6]"
              }`}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        {/* เส้นคั่น */}
        <div className="my-6 text-sm text-gray-500 relative">
          <div className="absolute left-0 right-0 h-px bg-gray-200 top-1/2"></div>
          <span className="relative bg-white px-3 text-gray-500">หรือ</span>
        </div>

        {/* ปุ่ม Google Login */}
        <div className="flex justify-center mb-4">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert("Google login failed")}
          />
        </div>

        <p className="text-sm text-center text-gray-600 mt-6">
          ยังไม่มีบัญชี?{" "}
          <Link to="/register" className="text-[#00B8E6] hover:text-[#00DDFF] font-medium">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </main>
  );
}
