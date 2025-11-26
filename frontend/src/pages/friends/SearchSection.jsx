import React from "react";
import CountrySelect from "../../components/CountrySelect";

export default function SearchSection({
  setShowCategoryModal,
  setSelectedCategories,
  selectedCategories,
  doSearch,
}) {
  const [name, setName] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [mode, setMode] = React.useState("similar");

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (name) params.append("q", name);
    if (country) params.append("country", country);
    if (mode) params.append("mode", mode);

    // ⭐ ใช้ selectedCategories ที่ส่งมาจาก FriendsPage
    if (selectedCategories && selectedCategories.length > 0) {
      selectedCategories.forEach((cat) => {
        params.append("category", cat);
      });
    }

    doSearch(params.toString());
  };

  return (
    <div className="w-full mt-8 relative z-[10] overflow-visible">
      <div
        className="
          bg-white/80 
          backdrop-blur 
          rounded-2xl 
          shadow-md 
          p-6 
          border border-[#d4f4ff]
          relative 
          z-[1]
          overflow-visible
        "
      >
        <div
          className="
            flex flex-col lg:flex-row 
            items-start 
            justify-between 
            gap-5
            overflow-visible
          "
        >
          <input
            type="text"
            placeholder="ค้นหาชื่อเพื่อน..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="
              rounded-2xl
              w-full lg:w-60
              px-5 py-3.5
              border border-[#a5e8f7]
              bg-[#f7fdff]
              focus:ring-2 focus:ring-[#00B8E6] 
              focus:bg-white
              outline-none
              shadow-sm
              transition
            "
          />

          <div className="w-full lg:w-56 relative overflow-visible z-[9999]">
            <CountrySelect value={country} setValue={setCountry} />
          </div>

          <select
            value={mode}
            onChange={(e) => {
              const v = e.target.value;
              setMode(v);

              e.target.blur();

              // เปิด modal เมื่อเลือก manual
              if (v === "manual") {
                document.activeElement.blur();
                setTimeout(() => {
                  setShowCategoryModal(true);
                }, 50);
              }
            }}
            className="w-full lg:w-56 px-5 py-3.5 rounded-2xl border border-[#a5e8f7] bg-[#f7fdff] focus:ring-2 focus:ring-[#00B8E6] focus:bg-white outline-none shadow-sm transition"
          >
            <option value="all">ทั้งหมด</option>
            <option value="similar">ความสนใจเหมือนกัน (≥3)</option>
            <option value="manual">เลือกหมวดหมู่เอง</option>
          </select>

          <button
            onClick={handleSearch}
            className="
              w-full lg:w-40
              rounded-2xl
              py-3.5 
              font-semibold
              bg-gradient-to-r from-[#00B8E6] to-[#00a0cc]
              text-white
              shadow-md shadow-[#00B8E6]/40
              hover:shadow-[#00B8E6]/60
              hover:scale-[1.03]
              active:scale-[0.98]
              transition
            "
          >
            ค้นหา
          </button>
        </div>
      </div>
    </div>
  );
}
