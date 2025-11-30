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

    /* ===============================================================
       1) USER ONLINE
    ============================================================== */
    socket.on("online", (userId) => {
      if (!userId) return;
      onlineUsers.set(String(userId), socket.id);
      console.log("🟢 Online:", userId);
    });

    /* ===============================================================
       2) JOIN ROOM
    ============================================================== */
    socket.on("join_room", (roomId) => {
      if (!roomId) return;
      socket.join(roomId);
      console.log(`📌 ${socket.id} joined room ${roomId}`);
    });

    /* ===============================================================
       3) SEND MESSAGE (TEXT / IMAGE / VIDEO / GIF)
    ============================================================== */
    socket.on("send_message", async (msgData) => {
      try {
        let { room_id, sender_id, text, type, file_url } = msgData;

        sender_id = String(sender_id);

        // ป้องกัน error
        if (!room_id || !sender_id) {
          console.log("❌ Missing data →", msgData);
          return;
        }

        // ถ้าเป็น TEXT แต่ empty → ไม่ส่ง
        if (type === "text" && (!text || !text.trim())) {
          console.log("❌ Empty text ignored");
          return;
        }

        // ถ้าเป็น media แต่ไม่มี file_url → ไม่ส่ง
        if (type !== "text" && !file_url) {
          console.log("❌ Missing media file_url →", msgData);
          return;
        }

        // บันทึกลง DB
        const result = await pool.query(
          `
          INSERT INTO messages (room_id, sender_id, text, type, file_url)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
          `,
          [
            room_id,
            sender_id,
            text || null,
            type || "text",
            file_url || null,
          ]
        );

        const msg = result.rows[0];

        // ส่งกลับไปที่ frontend ในรูปแบบที่พร้อมใช้
        const formatted = {
          id: msg.id,
          room_id: msg.room_id,
          sender_id: msg.sender_id,
          text: msg.text,
          type: msg.type,
          file_url: msg.file_url,
          created_at: msg.created_at,
        };

        // Real-time ส่งไปทั้งห้อง
        io.to(room_id).emit("receive_message", formatted);

      } catch (err) {
        console.error("WS send_message error:", err);
      }
    });

    /* ===============================================================
       4) DISCONNECT
    ============================================================== */
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
