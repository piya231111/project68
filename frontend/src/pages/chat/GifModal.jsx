import React from "react";

export default function GifModal({
  gifSearch,
  setGifSearch,
  gifResults,
  searchGIF,
  sendGif,
  close,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-[90%] max-w-lg rounded-2xl p-6 shadow-lg">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">เลือก GIF</h2>
          <button
            onClick={close}
            className="text-red-500 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="ค้นหา GIF..."
            value={gifSearch}
            onChange={(e) => setGifSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchGIF()}
            className="flex-1 px-4 py-2 border rounded-xl"
          />

          <button
            onClick={searchGIF}
            className="px-4 py-2 bg-[#00B8E6] text-white rounded-xl"
          >
            ค้นหา
          </button>
        </div>

        {/* GIF Results */}
        <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
          {gifResults.length === 0 ? (
            <p className="text-gray-400 text-center col-span-2">
              พิมพ์คำค้นหาแล้วกด "ค้นหา"
            </p>
          ) : (
            gifResults.map((gif) => (
              <img
                key={gif.id}
                src={gif.images.fixed_height.url}
                onClick={() => sendGif(gif.images.fixed_height.url)}
                className="w-full rounded-lg cursor-pointer hover:opacity-80"
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
}
