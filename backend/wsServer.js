// backend/wsServer.js
import { Server } from "socket.io";
import { pool } from "./db.js";

let onlineUsers = new Map();

export function setupWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("⚡ Socket connected:", socket.id);

    /* ============================================================
       1) USER ONLINE → ทำเครื่องหมายว่า user ออนไลน์
    ============================================================ */
    socket.on("online", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log("🟢 Online:", userId);
    });

    /* ============================================================
       2) JOIN ROOM
       frontend จะส่ง room_id ทันทีที่โหลดหน้าแชท
    ============================================================ */
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`📌 Socket ${socket.id} joined room ${roomId}`);
    });

    /* ============================================================
       3) REAL-TIME MESSAGE
       ใช้ room-based broadcasting
       (ไม่ต้องใช้ receiver_id แล้ว)
    ============================================================ */
    socket.on("send_message", async ({ room_id, sender_id, text }) => {
      try {
        if (!room_id || !text) return;

        // บันทึกข้อความลง DB
        const msg = await pool.query(
          `
          INSERT INTO messages (room_id, sender_id, text)
          VALUES ($1, $2, $3)
          RETURNING *
          `,
          [room_id, sender_id, text]
        );

        const savedMessage = msg.rows[0];

        // ส่งให้ทุกคนในห้องนี้
        io.to(room_id).emit("receive_message", savedMessage);

      } catch (err) {
        console.error("send_message error:", err);
      }
    });

    /* ============================================================
       4) USER DISCONNECT
    ============================================================ */
    socket.on("disconnect", () => {
      for (const [uid, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          onlineUsers.delete(uid);
          console.log("🔴 Offline:", uid);
        }
      }
    });
  });
}
