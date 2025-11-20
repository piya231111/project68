export default function Tabs({ tab, setTab }) {
  const items = [
    { key: "friends", label: "รายชื่อเพื่อน" },
    { key: "requests", label: "คำขอเป็นเพื่อน" },
    { key: "search", label: "ค้นหารายชื่อ" },
  ];

  return (
    <div className="flex justify-center gap-4 mb-8">
      {items.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`px-6 py-3 rounded-xl font-semibold ${
            tab === t.key ? "bg-[#00B8E6] text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
