import { io } from "socket.io-client";

export const socket = io("http://localhost:7000", {
  autoConnect: false,
  transports: ["websocket"],
});

export function connectAsUser(userId) {
  if (!userId) return Promise.resolve(false);

  if (socket.connected) {
    socket.emit("offline");
    socket.disconnect();
  }

  return new Promise((resolve) => {
    socket.connect();

    socket.once("connect", () => {
      //ส่ง online แล้วรอ server ตอบกลับ (ACK)
      socket.emit("online", userId, (res) => {
        resolve(!!res?.ok);
      });
    });
  });
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.emit("offline");
    socket.disconnect();
  }
}