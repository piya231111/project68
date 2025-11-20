import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../api";
import { countries } from "countries-list";

const ALL_COUNTRIES = Object.values(countries)
  .map((c) => c.name)
  .sort();

const ALL_CATEGORIES = [
  "Music", "Movies", "Books", "Gaming", "Sports", "Travel", "Food", "Art",
  "Technology", "Science", "Fashion", "Fitness", "Photography", "Pets",
  "Education", "Finance", "Health", "DIY", "Cars", "Nature",
];

export default function ProfileEdit() {
  const [me, setMe] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [item, setItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // ✅ ประเทศ autocomplete
  const [country, setCountry] = useState("");
  const [filteredCountries, setFilteredCountries] = useState(ALL_COUNTRIES);
  const [showCountryList, setShowCountryList] = useState(false);
  const countryRef = useRef(null);

  // ✅ หมวดหมู่ popup
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const navigate = useNavigate();

  // โหลดข้อมูลผู้ใช้
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/me");
        const user = res.data.me;
        setMe(user);
        setCountry(user?.country || "");
        setSelectedCategories(user?.interests || [user?.category].filter(Boolean));

        if (user?.avatar_id) {
          const av = await api.get(`/avatars/${user.avatar_id}`);
          setAvatar(av.data);
        }
        if (user?.item_id) {
          const it = await api.get(`/items/${user.item_id}`);
          setItem(it.data);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // ✅ ค้นหาประเทศ
  const handleCountrySearch = (value) => {
    setCountry(value);
    if (value.trim() === "") setFilteredCountries(ALL_COUNTRIES);
    else {
      const matches = ALL_COUNTRIES.filter((c) =>
        c.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCountries(matches);
    }
    setShowCountryList(true);
  };

  const handleCountrySelect = (name) => {
    setCountry(name);
    setShowCountryList(false);
  };

  // ✅ ปิด dropdown เมื่อคลิกนอกกล่อง
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryRef.current && !countryRef.current.contains(event.target)) {
        setShowCountryList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Toggle category selection
  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((x) => x !== cat));
    } else if (selectedCategories.length < 5) {
      setSelectedCategories([...selectedCategories, cat]);
    } else {
      alert("เลือกได้ไม่เกิน 5 หมวดหมู่");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/me", {
        display_name: me.display_name,
        country,
        interests: selectedCategories,
      });
      alert("✅ บันทึกข้อมูลสำเร็จ");
      navigate("/profile");
    } catch (err) {
      alert("❌ เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  if (!me)
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#E9FBFF]">
        <p className="text-gray-500">กำลังโหลด...</p>
      </main>
    );

  return (
    <main className="flex flex-1 justify-center items-center px-16 py-12 gap-16 bg-[#E9FBFF]">
      {/* ✅ ฝั่งซ้าย: อวตาร์ */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="relative w-[420px] h-[560px] flex justify-center items-center">
          {item && (
            <img
              src={item.imageUrl || item.image_url}
              alt="item"
              className="absolute inset-0 w-full h-full object-contain z-10 opacity-95"
            />
          )}
          {avatar && (
            <img
              src={avatar.imageUrl || avatar.image_url}
              alt="avatar"
              className="absolute inset-0 w-full h-full object-contain z-20"
            />
          )}
        </div>

        <div className="flex gap-5 mt-4">
          <Link
            to="/profile/avatar"
            className="text-sm text-[#00B8E6] hover:underline flex items-center gap-1"
          >
            เปลี่ยนอวตาร์
          </Link>
          <Link
            to="/profile/item"
            className="text-sm text-[#FF4D94] hover:underline flex items-center gap-1"
          >
            เปลี่ยนไอเทม
          </Link>
        </div>
      </div>

      {/* ✅ ฝั่งขวา: ฟอร์ม */}
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-white rounded-3xl shadow-lg border border-[#d0f6ff] p-10 w-full max-w-md">
          <h2 className="text-2xl font-bold text-[#00B8E6] mb-6 text-center">
            แก้ไขข้อมูลส่วนตัว
          </h2>

          <div className="space-y-6">
            {/* ชื่อ */}
            <div>
              <label className="block text-gray-600 mb-1">ชื่อที่แสดง</label>
              <input
                className="w-full border border-[#a5e8f7] rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#00B8E6]"
                value={me.display_name || ""}
                onChange={(e) =>
                  setMe({ ...me, display_name: e.target.value })
                }
              />
            </div>

            {/* ประเทศ */}
            <div ref={countryRef} className="relative">
              <label className="block text-gray-600 mb-1">ประเทศ</label>
              <input
                type="text"
                value={country}
                onChange={(e) => handleCountrySearch(e.target.value)}
                onFocus={() => setShowCountryList(true)}
                placeholder="พิมพ์ชื่อประเทศ เช่น Thailand..."
                className="w-full border border-[#a5e8f7] rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#00B8E6] outline-none"
              />
              {showCountryList && filteredCountries.length > 0 && (
                <ul className="absolute z-10 mt-2 w-full max-h-56 overflow-y-auto bg-white border border-[#a5e8f7] rounded-xl shadow-md">
                  {filteredCountries.map((c) => (
                    <li
                      key={c}
                      onClick={() => handleCountrySelect(c)}
                      className="px-4 py-2 hover:bg-[#E9FBFF] cursor-pointer text-[#00B8E6] font-medium"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ✅ หมวดหมู่ (เปิด popup) */}
            <div>
              <label className="block text-gray-600 mb-1">
                หมวดหมู่ความสนใจ
              </label>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="w-full border border-[#a5e8f7] rounded-xl px-4 py-2 text-left hover:bg-[#E9FBFF] transition"
              >
                {selectedCategories.length > 0
                  ? selectedCategories.join(", ")
                  : "-- คลิกเพื่อเลือกหมวดหมู่ --"}
              </button>
            </div>
          </div>

          {/* ปุ่มบันทึก */}
          <div className="flex justify-center gap-6 mt-10">
            <button
              onClick={() => navigate("/profile")}
              className="px-6 py-3 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400"
            >
              ยกเลิก
            </button>
            <button
              onClick={save}
              disabled={saving}
              className={`px-8 py-3 rounded-lg text-white font-semibold ${
                saving
                  ? "bg-[#00B8E6]/60 cursor-not-allowed"
                  : "bg-[#00B8E6] hover:bg-[#009ecc]"
              }`}
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Popup modal สำหรับเลือกหมวดหมู่ */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-10 relative">
            <h2 className="text-2xl font-bold text-[#00B8E6] mb-6 text-center">
              เลือกหมวดหมู่ที่คุณสนใจ
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`py-3 px-4 rounded-xl text-lg font-semibold border transition-all ${
                    selectedCategories.includes(cat)
                      ? "bg-[#00B8E6] text-white shadow-md scale-105"
                      : "bg-white text-[#00B8E6] border-[#a5e8f7] hover:bg-[#E9FBFF] hover:shadow-md"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <p className="mt-6 text-gray-600 text-center">
              เลือกได้ไม่ต่ำกว่า <b>3</b> และไม่เกิน <b>5</b> หมวดหมู่
            </p>

            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl text-gray-700 font-medium"
              >
                ปิด
              </button>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-6 py-2 bg-[#00B8E6] hover:bg-[#009ecc] text-white rounded-xl font-medium"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
