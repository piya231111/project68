import { useState, useRef, useEffect } from "react";
import { countries } from "countries-list";

const ALL_COUNTRIES = Object.values(countries)
  .map((c) => c.name)
  .sort();

export default function CountrySelect({ value, setValue }) {
  const [filtered, setFiltered] = useState(ALL_COUNTRIES);
  const [showList, setShowList] = useState(false);
  const ref = useRef(null);

  const handleSearch = (v) => {
    setValue(v);
    if (!v.trim()) {
      setFiltered(ALL_COUNTRIES);
    } else {
      setFiltered(
        ALL_COUNTRIES.filter((c) =>
          c.toLowerCase().includes(v.toLowerCase())
        )
      );
    }
    setShowList(true);
  };

  const selectCountry = (name) => {
    setValue(name);
    setShowList(false);
  };

  // ปิด dropdown ถ้าคลิกนอกกล่อง
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowList(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => setShowList(true)}
        placeholder="เลือกประเทศ..."
        className="w-full border border-[#a5e8f7] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#00B8E6]"
      />

      {showList && filtered.length > 0 && (
        <ul className="absolute z-10 mt-2 w-full max-h-56 overflow-y-auto bg-white border border-[#a5e8f7] rounded-xl shadow-md">
          {filtered.map((c) => (
            <li
              key={c}
              onClick={() => selectCountry(c)}
              className="px-4 py-2 hover:bg-[#E9FBFF] cursor-pointer text-[#00B8E6] font-medium"
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
