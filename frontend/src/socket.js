import { io } from "socket.io-client";

const URL = "http://localhost:7000"; // backend ที่รัน socket.io

export const socket = io(URL, {
  autoConnect: false,     // กัน connect ซ้ำหลายรอบ
  transports: ["websocket"]
});
