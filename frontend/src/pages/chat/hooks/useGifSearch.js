import { useState } from "react";
import { api } from "../../../api";
import { socket } from "../../../socket";

export default function useGifSearch(roomId) {
  const me = JSON.parse(localStorage.getItem("user"));
  const userId = String(me?.id);

  const [gifModalOpen, setGifModalOpen] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState([]);

  const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

  /* ค้นหา GIF */
  const searchGIF = async () => {
    if (!gifSearch.trim()) return;

    const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${gifSearch}&limit=20`;

    const res = await fetch(url);
    const data = await res.json();
    setGifResults(data.data || []);
  };

  /* ส่ง GIF */
  const sendGif = async (gifUrl) => {
    // socket
    socket.emit("send_message", {
      room_id: roomId,
      sender_id: userId,
      type: "gif",
      file_url: gifUrl,
    });

    // save DB
    await api.post(`/chat/room/${roomId}`, {
      type: "gif",
      file_url: gifUrl,
    });

    setGifModalOpen(false);
  };

  return {
    gifModalOpen,
    setGifModalOpen,
    gifSearch,
    setGifSearch,
    gifResults,
    searchGIF,
    sendGif,
  };
}
