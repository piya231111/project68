import { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { countries } from "countries-list";
import FriendDetailModal from "../components/FriendDetailModal";


const ALL_COUNTRIES = Object.values(countries)
  .map((c) => c.name)
  .sort();

const ALL_CATEGORIES = [
  "Music", "Movies", "Books", "Gaming", "Sports", "Travel", "Food", "Art",
  "Technology", "Science", "Fashion", "Fitness", "Photography", "Pets",
  "Education", "Finance", "Health", "DIY", "Cars", "Nature",
];

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [sentRequests, setSentRequests] = useState([]); // ✅ รายชื่อ id ที่ส่งคำขอแล้ว
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState("friends");
  const [loading, setLoading] = useState(false);

  const [countryFilter, setCountryFilter] = useState("");
  const [filteredCountries, setFilteredCountries] = useState(ALL_COUNTRIES);
  const [showCountryList, setShowCountryList] = useState(false);
  const countryRef = useRef(null);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [mode, setMode] = useState("similar");

  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showFriendModal, setShowFriendModal] = useState(false);

  const [openMenu, setOpenMenu] = useState({ id: null, group: null });

  const openFriendDetail = (friend) => {
    setSelectedFriend(friend);
    setShowFriendModal(true);
  };

  const closeFriendDetail = () => {
    setSelectedFriend(null);
    setShowFriendModal(false);
  };

  useEffect(() => {
    loadData();

    const handleClickOutside = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setShowCountryList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      const [f, r, s] = await Promise.all([
        api.get("/friends"),
        api.get("/friends/requests"),
        api.get("/friends/sent"),
      ]);

      console.log("✅ โหลดข้อมูลเพื่อน:", f.data.friends);
      console.log("✅ โหลดคำขอเพื่อน:", r.data.requests);
      console.log("✅ คำขอที่ส่งออก:", s.data.sent);

      // ✅ แปลงค่าที่ได้จาก backend ให้แน่ใจว่า is_favorite เป็น boolean
      const normalizedFriends = (f.data.friends || []).map((fr) => ({
        ...fr,
        is_favorite: fr.is_favorite === true || fr.is_favorite === "true",
      }));

      // ✅ อัปเดต state ด้วยข้อมูลที่ผ่านการ normalize แล้ว
      setFriends(normalizedFriends);
      setRequests(r.data.requests || []);
      setSentRequests(s.data.sent || []);

    } catch (e) {
      console.error("โหลดเพื่อนไม่สำเร็จ:", e);
    }
  };

  const accept = async (id) => {
    try {
      await api.post(`/friends/accept/${id}`);
      setRequests(requests.filter((r) => r.id !== id));
      await loadData();
    } catch (e) {
      console.error("ยอมรับคำขอไม่สำเร็จ:", e);
    }
  };

  const handleCountrySearch = (value) => {
    setCountryFilter(value);
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
    setCountryFilter(name);
    setShowCountryList(false);
  };

  const toggleCategory = (cat) => {
    let updated;
    if (selectedCategories.includes(cat)) {
      updated = selectedCategories.filter((x) => x !== cat);
    } else if (selectedCategories.length < 5) {
      updated = [...selectedCategories, cat];
    } else {
      alert("เลือกได้ไม่เกิน 5 หมวดหมู่");
      return;
    }
    setSelectedCategories(updated);
  };

  const sendRequest = async (id) => {
    try {
      const res = await api.post(`/friends/request/${id}`);
      console.log("sendFriendRequest success:", res.data);
      alert("✅ ส่งคำขอเป็นเพื่อนแล้ว!");

      // ✅ เพิ่ม id ลงใน state เพื่ออัปเดตปุ่มทันที
      setSentRequests((prev) => [...prev, id]);

    } catch (e) {
      const msg = e.response?.data?.error || "❌ ไม่สามารถส่งคำขอได้";
      console.warn("sendFriendRequest error:", msg);

      // ✅ ถ้ามีคำขออยู่แล้ว ให้แสดงเป็น "กำลังส่งคำขอแล้ว"
      if (msg.includes("มีคำขอ") || msg.includes("เพื่อนอยู่แล้ว")) {
        setSentRequests((prev) => [...prev, id]);
      }

      alert(msg);
    }
  };

  // ✅ ยอมรับคำขอเพื่อน
  const acceptRequest = async (id) => {
    try {
      await api.post(`/friends/accept/${id}`);
      alert("✅ ยอมรับคำขอแล้ว!");
      await loadData(); // โหลดข้อมูลใหม่หลังยอมรับ
    } catch (e) {
      console.error("acceptRequest error:", e);
      alert("❌ ยอมรับคำขอไม่สำเร็จ");
    }
  };

  // ✅ ปฏิเสธคำขอเพื่อน
  const declineRequest = async (id) => {
    try {
      await api.post(`/friends/decline/${id}`);
      alert("ปฏิเสธคำขอแล้ว");

      // ✅ เอาคนนั้นออกจากรายการคำขอทันที
      setRequests((prev) => prev.filter((r) => r.id !== id));

      // ✅ รีโหลดข้อมูลที่จำเป็น (sent/friends)
      const [f, s] = await Promise.all([
        api.get("/friends"),
        api.get("/friends/sent"),
      ]);
      setFriends(f.data.friends || []);
      setSentRequests(s.data.sent || []);
    } catch (e) {
      console.error("declineRequest error:", e);
      alert("ไม่สามารถปฏิเสธคำขอได้");
    }
  };

  // ✅ ฟังก์ชันบล็อคผู้ใช้
  const blockUser = async (id) => {
    try {
      const res = await api.post(`/friends/${id}/block`);
      alert("🚫 บล็อคผู้ใช้เรียบร้อยแล้ว");

      // โหลดข้อมูลใหม่หลังบล็อค (จะหายไปจากรายชื่อ)
      await loadData();
      closeFriendDetail();
    } catch (err) {
      console.error("blockUser error:", err);
      alert("❌ ไม่สามารถบล็อคได้");
    }
  };

  // ฟังก์ชันลบเพื่อน
  const removeFriend = async (friendId) => {
    try {
      await api.delete(`/friends/${friendId}`);
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      alert("ลบเพื่อนสำเร็จ ✅");
    } catch (err) {
      console.error("ลบเพื่อนไม่สำเร็จ:", err);
      alert("เกิดข้อผิดพลาดในการลบเพื่อน ❌");
    }
  };

  const toggleFavorite = async (friendId) => {
    try {
      const res = await api.put(`/friends/${friendId}/favorite`);
      const updated =
        res.data.is_favorite === true || res.data.is_favorite === "true";

      // ✅ โหลดข้อมูลเพื่อนใหม่จาก backend เพื่อ sync state
      await loadData();

      alert(res.data.message || (updated ? "ปักดาวเพื่อนแล้ว ⭐" : "เอาดาวออกแล้ว"));
    } catch (err) {
      console.error("toggleFavorite error:", err);
      alert("เกิดข้อผิดพลาดในการปักดาวเพื่อน ❌");
    }
  };

  // ✅ กรองเพื่อนซ้ำก่อนใช้งาน
  const uniqueFriends = friends.filter(
    (f, i, arr) => i === arr.findIndex((x) => x.id === f.id)
  );

  // ✅ แยกกลุ่มอย่างชัดเจน
  const favoriteFriends = uniqueFriends.filter(
    (f) => f.is_favorite === true || f.is_favorite === "true" || f.is_favorite === 1
  );
  const normalFriends = uniqueFriends.filter(
    (f) => !f.is_favorite || f.is_favorite === false || f.is_favorite === "false" || f.is_favorite === 0
  );

  const doSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("q", searchTerm);
      if (countryFilter) params.append("country", countryFilter);

      if (mode === "similar") {
        const me = await api.get("/me");
        if (me.data.me?.interests?.length >= 3) {
          me.data.me.interests.forEach((cat) => params.append("category", cat));
        } else {
          alert("คุณต้องเลือกความสนใจอย่างน้อย 3 หมวดหมู่ในโปรไฟล์ก่อนใช้โหมดนี้");
          setLoading(false);
          return;
        }
      } else if (mode === "manual") {
        if (selectedCategories.length === 0) {
          alert("กรุณาเลือกหมวดหมู่ก่อนค้นหา");
          setLoading(false);
          return;
        }
        selectedCategories.forEach((cat) => params.append("category", cat));
      }

      const res = await api.get(`/friends/search?${params.toString()}`);
      const results = res.data.results || [];

      const friendIds = new Set(friends.map((f) => f.id));
      const withStatus = results.map((u) => ({
        ...u,
        isFriend: friendIds.has(u.id),
      }));

      withStatus.sort((a, b) => {
        if (a.isFriend === b.isFriend)
          return a.display_name.localeCompare(b.display_name);
        return a.isFriend ? -1 : 1;
      });

      setSearchResults(withStatus);
    } catch (e) {
      console.error("ค้นหาเพื่อนล้มเหลว:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 justify-center items-center px-16 py-12 gap-16 bg-[#E9FBFF]">
      <div className="bg-white shadow-lg rounded-3xl w-full max-w-4xl p-8 border border-[#d0f6ff]">
        {/* ✅ ปุ่มแท็บ */}
        <div className="flex justify-center mb-8 gap-4 flex-wrap">
          {[
            { key: "friends", label: "รายชื่อเพื่อน" },
            { key: "requests", label: "คำขอเป็นเพื่อน" },
            { key: "search", label: "ค้นหารายชื่อ" },
          ].map((b) => (
            <button
              key={b.key}
              onClick={() => setTab(b.key)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${tab === b.key
                ? "bg-[#00B8E6] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {tab === "friends" && (
          <div className="text-center relative">
            <h2 className="text-2xl font-bold text-[#00B8E6] mb-6">
              รายชื่อเพื่อนของคุณ
            </h2>

            {friends.length === 0 ? (
              <p className="text-gray-500 italic">ยังไม่มีเพื่อนในขณะนี้</p>
            ) : (
              <>
                {(() => {
                  // ✅ กรองเพื่อนซ้ำก่อนใช้งาน
                  const uniqueFriends = friends.filter(
                    (f, i, arr) => i === arr.findIndex((x) => x.id === f.id)
                  );

                  // ✅ แยกกลุ่มอย่างชัดเจน
                  const favoriteFriends = uniqueFriends.filter(
                    (f) =>
                      f.is_favorite === true ||
                      f.is_favorite === "true" ||
                      f.is_favorite === 1
                  );
                  const normalFriends = uniqueFriends.filter(
                    (f) =>
                      !f.is_favorite ||
                      f.is_favorite === false ||
                      f.is_favorite === "false" ||
                      f.is_favorite === 0
                  );

                  return (
                    <>
                      {/* ✅ กลุ่มที่ 1: เพื่อนที่ปักดาว */}
                      <section className="mb-10">
                        <h3 className="text-xl font-semibold text-yellow-500 mb-3 flex items-center justify-between">
                          <span>⭐ เพื่อนที่ปักดาว</span>
                          <span className="text-gray-500 text-sm">
                            ({favoriteFriends.length}/20)
                          </span>
                        </h3>

                        <ul className="divide-y divide-gray-200 text-left bg-white/70 rounded-xl">
                          {favoriteFriends.length === 0 ? (
                            <p className="text-gray-400 italic py-3 text-center">
                              ยังไม่มีเพื่อนที่ปักดาว
                            </p>
                          ) : (
                            favoriteFriends.slice(0, 20).map((f) => (
                              <li
                                key={`friend-fav-${f.id}`}
                                className="relative py-4 px-3 flex justify-between items-center hover:bg-yellow-50 rounded-xl transition-all duration-200 cursor-pointer"
                              >
                                {/* ด้านซ้าย */}
                                <div onClick={() => openFriendDetail(f)}>
                                  <p className="font-medium text-gray-800 flex items-center gap-1">
                                    {f.display_name}
                                    <span className="text-yellow-400 text-lg">⭐</span>
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {f.country || "ไม่ระบุประเทศ"} —{" "}
                                    {f.interests?.join(", ") ||
                                      "ไม่มีข้อมูลความสนใจ"}
                                  </p>
                                </div>

                                {/* ด้านขวา: จุดแนวตั้ง ⋮ */}
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenu(
                                        openMenu?.id === f.id &&
                                          openMenu?.group === "favorite"
                                          ? { id: null, group: null }
                                          : { id: f.id, group: "favorite" }
                                      );
                                    }}
                                    className="p-2 rounded-full hover:bg-yellow-100 transition-all"
                                  >
                                    <span className="text-yellow-500 text-2xl font-bold leading-none">
                                      ⋮
                                    </span>
                                  </button>

                                  {/* เมนู popup */}
                                  {openMenu?.id === f.id &&
                                    openMenu?.group === "favorite" && (
                                      <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg w-40 z-30 animate-fadeIn">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(f.id);
                                            setOpenMenu({ id: null, group: null });
                                          }}
                                          className="w-full text-left px-4 py-2 hover:bg-yellow-50 text-yellow-500 rounded-t-xl"
                                        >
                                          ⭐ เอาดาวออก
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (
                                              window.confirm(
                                                `คุณต้องการลบเพื่อน ${f.display_name} ใช่ไหม?`
                                              )
                                            ) {
                                              removeFriend(f.id);
                                            }
                                            setOpenMenu({ id: null, group: null });
                                          }}
                                          className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded-b-xl"
                                        >
                                          ❌ ลบเพื่อน
                                        </button>
                                      </div>
                                    )}
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      </section>

                      {/* 🔹 เส้นแบ่งกลุ่ม */}
                      <hr className="my-8 border-t-2 border-dashed border-[#a5e8f7]" />

                      {/* ✅ กลุ่มที่ 2: เพื่อนทั่วไป */}
                      <section>
                        <h3 className="text-xl font-semibold text-gray-700 mb-3 flex items-center justify-between">
                          <span>เพื่อนทั้งหมด</span>
                          <span className="text-gray-500 text-sm">
                            (
                            {normalFriends.length > 100
                              ? "100+"
                              : normalFriends.length}
                            /100)
                          </span>
                        </h3>

                        <ul className="divide-y divide-gray-200 text-left bg-white/70 rounded-xl">
                          {normalFriends.length === 0 ? (
                            <p className="text-gray-400 italic py-3 text-center">
                              ยังไม่มีเพื่อนทั่วไป
                            </p>
                          ) : (
                            normalFriends.slice(0, 100).map((f) => (
                              <li
                                key={`friend-normal-${f.id}`}
                                className="relative py-4 px-3 flex justify-between items-center hover:bg-[#E9FBFF] rounded-xl transition-all duration-200 cursor-pointer"
                              >
                                {/* ด้านซ้าย */}
                                <div onClick={() => openFriendDetail(f)}>
                                  <p className="font-medium text-gray-800 hover:text-[#00B8E6]">
                                    {f.display_name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {f.country || "ไม่ระบุประเทศ"} —{" "}
                                    {f.interests?.join(", ") ||
                                      "ไม่มีข้อมูลความสนใจ"}
                                  </p>
                                </div>

                                {/* จุดเมนู ⋮ */}
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenu(
                                        openMenu?.id === f.id &&
                                          openMenu?.group === "normal"
                                          ? { id: null, group: null }
                                          : { id: f.id, group: "normal" }
                                      );
                                    }}
                                    className="p-2 rounded-full hover:bg-[#E9FBFF] transition-all"
                                  >
                                    <span className="text-[#00B8E6] text-2xl font-bold leading-none">
                                      ⋮
                                    </span>
                                  </button>

                                  {openMenu?.id === f.id &&
                                    openMenu?.group === "normal" && (
                                      <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg w-40 z-30 animate-fadeIn">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(f.id);
                                            setOpenMenu({ id: null, group: null });
                                          }}
                                          className="w-full text-left px-4 py-2 hover:bg-yellow-50 text-yellow-500 rounded-t-xl"
                                        >
                                          ⭐ ปักดาวเพื่อน
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (
                                              window.confirm(
                                                `คุณต้องการลบเพื่อน ${f.display_name} ใช่ไหม?`
                                              )
                                            ) {
                                              removeFriend(f.id);
                                            }
                                            setOpenMenu({ id: null, group: null });
                                          }}
                                          className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded-b-xl"
                                        >
                                          ❌ ลบเพื่อน
                                        </button>
                                      </div>
                                    )}
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      </section>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ✅ หน้า “คำขอเป็นเพื่อน” */}
        {tab === "requests" && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#00B8E6] mb-6">
              คำขอเป็นเพื่อนที่รอการตอบรับ
            </h2>

            {requests.length === 0 ? (
              <p className="text-gray-500 italic">
                ยังไม่มีคำขอเป็นเพื่อนในขณะนี้
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 text-left">
                {requests.map((req) => (
                  <li
                    key={`req-${req.id}`}
                    className="py-4 px-3 flex justify-between items-center hover:bg-[#E9FBFF] rounded-xl transition-all duration-200"
                  >
                    {/* 🔹 ด้านซ้าย: ข้อมูลผู้ส่งคำขอ */}
                    <div
                      onClick={() => openFriendDetail(req)}
                      className="cursor-pointer hover:text-[#00B8E6]"
                    >
                      <p className="font-medium text-gray-800">
                        {req.display_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {req.country || "ไม่ระบุประเทศ"} —{" "}
                        {req.interests?.join(", ") || "ไม่มีข้อมูลความสนใจ"}
                      </p>
                    </div>

                    {/* 🔹 ด้านขวา: ปุ่มตอบรับ/ปฏิเสธ */}
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          acceptRequest(req.id);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl shadow-sm transition-all"
                      >
                        ยอมรับ
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          declineRequest(req.id);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl shadow-sm transition-all"
                      >
                        ปฏิเสธ
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {/* ✅ หน้า “ค้นหาเพื่อน” */}
        {tab === "search" && (
          <div className="text-center">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-6 sm:flex-wrap">
              {/* ช่องค้นหา */}
              <input
                type="text"
                placeholder="พิมพ์ชื่อที่ต้องการค้นหา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-56 border border-[#a5e8f7] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#00B8E6]"
              />

              {/* ประเทศ autocomplete */}
              <div ref={countryRef} className="relative w-full sm:w-56">
                <input
                  type="text"
                  value={countryFilter}
                  onChange={(e) => handleCountrySearch(e.target.value)}
                  onFocus={() => setShowCountryList(true)}
                  placeholder="เลือกประเทศ..."
                  className="w-full border border-[#a5e8f7] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#00B8E6]"
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

              {/* โหมดหมวดหมู่ + ปุ่มค้นหา */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={mode}
                  onChange={(e) => {
                    const newMode = e.target.value;
                    setMode(newMode);
                    if (newMode === "manual") {
                      setShowCategoryModal(true); // เปิด popup
                    }
                  }}
                  className="w-full sm:w-56 border border-[#a5e8f7] rounded-xl px-4 py-3 text-gray-600 focus:ring-2 focus:ring-[#00B8E6]"
                >
                  <option value="similar">ความสนใจคล้ายกัน (≥3 หมวด)</option>
                  <option value="manual">เลือกหมวดหมู่เอง</option>
                </select>

                <button
                  onClick={doSearch}
                  className="bg-[#00B8E6] text-white px-6 py-3 rounded-xl hover:bg-[#009ecc] font-semibold shadow w-full sm:w-auto"
                >
                  ค้นหา
                </button>
              </div>
            </div>
            {/* ✅ แสดงผลค้นหา */}
            {loading && <p className="text-gray-500 mt-4">กำลังค้นหา...</p>}

            {!loading && searchResults.length > 0 && (
              <div className="text-left mt-6">
                {/* 🔹 เพื่อนที่มีอยู่แล้ว */}
                {searchResults.some((u) => u.isFriend) && (
                  <>
                    <h3 className="text-[#00B8E6] font-semibold mb-2">
                      รายชื่อเพื่อน
                    </h3>
                    <ul className="divide-y divide-gray-200 mb-6">
                      {searchResults
                        .filter((u) => u.isFriend)
                        .map((u) => (
                          <li
                            key={u.id}
                            className="py-3 flex justify-between items-center"
                          >
                            <div
                              onClick={() => openFriendDetail(u)}
                              className="cursor-pointer hover:text-[#00B8E6]"
                            >
                              <p className="font-medium text-gray-800">{u.display_name}</p>
                              <p className="text-sm text-gray-500">
                                {u.country} — {u.interests?.join(", ")}
                              </p>
                            </div>

                            <span className="text-[#00B8E6] font-semibold">
                              เพื่อน
                            </span>
                          </li>
                        ))}
                    </ul>
                  </>
                )}
                {/* 🔹 คนที่ยังไม่เป็นเพื่อน */}
                {searchResults.some((u) => !u.isFriend) && (
                  <>
                    <h3 className="text-gray-700 font-semibold mb-2">
                      รายชื่อทั้งหมด
                    </h3>
                    <ul className="divide-y divide-gray-200">
                      {searchResults
                        .filter((u) => !u.isFriend)
                        .map((u) => (
                          <li
                            key={`search-${u.id}`}
                            onClick={() => openFriendDetail(u)}
                            className="group py-3 px-flex justify-between items-center rounded-xl transition-all duration-200 hover:bg-[#E9FBFF] hover:shadow-md hover:scale-[1.02] cursor-pointer"
                          >
                            {/* ด้านซ้าย: ข้อมูลเพื่อน */}
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 group-hover:text-[#00B8E6]">
                                {u.display_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {u.country} — {u.interests?.join(", ")}
                              </p>
                            </div>

                            {/* ด้านขวา: ปุ่มเพิ่มเพื่อน / ข้อความสถานะ */}
                            <div className="min-w-[140px] text-right flex justify-end">
                              {!u.isFriend ? (
                                sentRequests.includes(u.id) ? (
                                  <span className="text-gray-500 italic flex items-center gap-1 justify-end">
                                    📨 <span>กำลังส่งคำขอแล้ว...</span>
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sendRequest(u.id);
                                    }}
                                    className="bg-[#00B8E6] text-white px-4 py-2 rounded-xl hover:bg-[#009ecc] transition-all duration-200"
                                  >
                                    เพิ่มเพื่อน
                                  </button>
                                )
                              ) : (
                                <span className="text-[#00B8E6] font-semibold">เพื่อน</span>
                              )}
                            </div>



                            {u.isFriend && (
                              <span className="text-[#00B8E6] font-semibold">เพื่อน</span>
                            )}
                          </li>
                        ))}
                    </ul>
                  </>
                )}

              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ Popup เลือกหมวดหมู่ */}
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
                  className={`py-3 px-4 rounded-xl text-lg font-semibold border transition-all ${selectedCategories.includes(cat)
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
                onClick={() => {
                  if (selectedCategories.length < 3) {
                    alert("กรุณาเลือกอย่างน้อย 3 หมวดหมู่ก่อนค้นหา");
                    return;
                  }
                  setShowCategoryModal(false);
                  doSearch(); // ✅ ค้นหาเลยหลังยืนยัน
                }}
                className="px-6 py-2 bg-[#00B8E6] hover:bg-[#009ecc] text-white rounded-xl font-medium"
              >
                ยืนยันและค้นหา
              </button>
            </div>
          </div>
        </div>
      )}
      {showFriendModal && (
        <FriendDetailModal
          friend={selectedFriend}
          onClose={closeFriendDetail}
          onAddFriend={sendRequest}
          onRemoveFriend={removeFriend}
          onToggleFavorite={toggleFavorite}
          onBlockUser={blockUser}
          onChat={(id) => navigate(`/chat/${id}`)}
        />
      )}
    </main>
  );
}
