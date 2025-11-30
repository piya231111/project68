import { io } from "socket.io-client";

const URL = "http://localhost:7000";

export const socket = io(URL, {
  autoConnect: true,     
  transports: ["websocket"],
});
