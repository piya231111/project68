import React from "react";
import CountrySelect from "../../components/CountrySelect";

export default function SearchSection({
  setShowCategoryModal,
  setSelectedCategories,
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

    doSearch(params.toString());
  };

  return (
    <div className="w-full mt-8">
      {/* กล่องภายนอก */}
      <div
        className="
          bg-white/80 
          backdrop-blur 
          rounded-2xl 
          shadow-md 
          p-6 
          border border-[#d4f4ff]
        "
      >
        {/* กล่อง search แนวนอนแบบพรีเมียม */}
        <div
          className="
            flex flex-col lg:flex-row 
            items-center 
            justify-between 
            gap-5
          "
        >
          {/* 🔹 ค้นหาชื่อ */}
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

          {/* 🔹 เลือกประเทศ */}
          <div className="w-full lg:w-56">
            <CountrySelect
              value={country}
              onChange={setCountry}
              className="rounded-2xl"
            />
          </div>

          {/* 🔹 หมวดหมู่ */}
          <select
            value={mode}
            onChange={(e) => {
              const v = e.target.value;
              setMode(v);
              if (v === "manual") {
                setShowCategoryModal(true);
              }
            }}
            className="
              w-full lg:w-56
              px-5 py-3.5
              rounded-2xl 
              border border-[#a5e8f7] 
              bg-[#f7fdff]
              focus:ring-2 focus:ring-[#00B8E6]
              focus:bg-white
              outline-none
              shadow-sm
              transition
            "
          >
            <option value="similar">ความสนใจเหมือนกัน (≥3)</option>
            <option value="manual">เลือกหมวดหมู่เอง</option>
          </select>

          {/* 🔹 ปุ่มค้นหา */}
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
