import { useState } from "react";
import { socket } from "../../../socket";

export default function useGifSearchRandom(roomId) {
  const me = JSON.parse(localStorage.getItem("user"));
  const userId = String(me?.id);

  const [gifModalOpen, setGifModalOpen] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState([]);

  const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

  const searchGIF = async () => {
    if (!gifSearch.trim()) return;

    const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${gifSearch}&limit=20`;
    const res = await fetch(url);
    const data = await res.json();
    setGifResults(data.data || []);
  };

  const sendGif = (gifUrl) => {
    if (!gifUrl) return;

    socket.emit("randomChat:message", {
      roomId,
      sender: userId,
      fileUrl: gifUrl,
      type: "gif",
      time: Date.now(),
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
