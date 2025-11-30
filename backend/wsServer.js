// backend/wsServer.js
import { Server } from "socket.io";
import { pool } from "./db.js";
import { moderateText } from "./utils/textModeration.js";

let onlineUsers = new Map();

export function setupWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

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

        // Missing important data
        if (!room_id || !sender_id) {
          console.log("Missing room_id or sender_id →", msgData);
          return;
        }

        // Empty text
        if (type === "text" && (!text || !text.trim())) {
          console.log("Empty text ignored");
          return;
        }

        // No file_url for media
        if (type !== "text" && !file_url) {
          console.log("Missing media file_url →", msgData);
          return;
        }

        /* ===========================================================
           3.1 Moderate (เฉพาะ TEXT)
        =========================================================== */
        if (type === "text") {
          text = await moderateText(text);   //  moderate ใช้ที่นี่ที่เดียว
        }

        /* ===========================================================
           3.2 Save to DB
        =========================================================== */
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

        /* ===========================================================
           ⭐ 3.3 Emit to frontend
        =========================================================== */
        const formatted = {
          id: msg.id,
          room_id: msg.room_id,
          sender_id: msg.sender_id,
          text: msg.text,
          type: msg.type,
          file_url: msg.file_url,
          created_at: msg.created_at,
        };

        io.to(room_id).emit("receive_message", formatted);
        console.log("📨 Message sent to room:", room_id);

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
