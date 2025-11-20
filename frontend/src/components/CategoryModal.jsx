const ALL_CATEGORIES = [
  "Music","Movies","Books","Gaming","Sports","Travel","Food","Art",
  "Technology","Science","Fashion","Fitness","Photography","Pets",
  "Education","Finance","Health","DIY","Cars","Nature"
];

export default function CategoryModal({
  selectedCategories,
  setSelectedCategories,
  onClose,
}) {
  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((x) => x !== cat));
    } else if (selectedCategories.length < 5) {
      setSelectedCategories([...selectedCategories, cat]);
    } else {
      alert("เลือกได้ไม่เกิน 5 หมวดหมู่");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-10 relative">
        <h2 className="text-2xl font-bold text-[#00B8E6] mb-6 text-center">
          เลือกหมวดหมู่ที่สนใจ
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`py-3 px-4 rounded-xl text-lg font-semibold border transition ${
                selectedCategories.includes(cat)
                  ? "bg-[#00B8E6] text-white shadow-md scale-105"
                  : "bg-white text-[#00B8E6] border-[#a5e8f7] hover:bg-[#E9FBFF]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="mt-6 text-gray-600 text-center">
          เลือก 3–5 หมวดหมู่
        </p>

        <div className="text-center mt-8">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-[#00B8E6] text-white rounded-xl hover:bg-[#009ecc]"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}
