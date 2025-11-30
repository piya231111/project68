// backend/wsServer.js
import { Server } from "socket.io";
import { pool } from "./db.js";
import { filterBadWords } from "./utils/textModerationRegex.js"; 
import { aiModerate } from "./utils/textModerationAI.js";

let onlineUsers = new Map();

export function setupWebSocket(server) {
  const io = new Server(server, {
    cors: { origin: "http://localhost:5173", credentials: true },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    /* =============================
       USER ONLINE
    ============================== */
    socket.on("online", (userId) => {
      if (userId) onlineUsers.set(String(userId), socket.id);
    });

    /* =============================
       JOIN ROOM
    ============================== */
    socket.on("join_room", (roomId) => {
      if (!roomId) return;
      socket.join(roomId);
      io.to(socket.id).emit("room_joined", roomId);
    });

    /* =============================
       SEND MESSAGE
    ============================== */
    socket.on("send_message", async (msgData, callback) => {
      try {
        let { room_id, sender_id, text, type, file_url } = msgData;

        const safeCallback = (res) => {
          if (typeof callback === "function") callback(res);
        };

        if (!room_id || !sender_id) return safeCallback({ ok: false });

        // 1) text → filter เบื้องต้นแบบเร็วมาก (regex)
        if (type === "text") {
          text = filterBadWords(text);
        }

        // 2) บันทึกข้อความทันที (ไม่รอ AI)
        const result = await pool.query(
          `
            INSERT INTO messages (room_id, sender_id, text, type, file_url)
            VALUES ($1,$2,$3,$4,$5)
            RETURNING *
          `,
          [room_id, sender_id, text || null, type, file_url || null]
        );

        const msg = result.rows[0];

        const formatted = {
          id: msg.id,
          room_id: msg.room_id,
          sender_id: msg.sender_id,
          text: msg.text,
          type: msg.type,
          file_url: msg.file_url,
          created_at: msg.created_at,
        };

        // ส่งออกทันทีที่บันทึกเสร็จ — ลื่นมาก
        io.to(room_id).emit("receive_message", formatted);
        safeCallback({ ok: true });

        // 3) ทำ AI Moderation "ทีหลัง" แบบไม่ block UI
        setTimeout(async () => {
          const clean = await aiModerate(text);
          if (!clean || clean === text) return;

          // update DB
          await pool.query(
            `UPDATE messages SET text=$1 WHERE id=$2`,
            [clean, msg.id]
          );

          // notify หน้าเว็บให้เปลี่ยนข้อความ
          io.to(room_id).emit("message_updated", {
            id: msg.id,
            text: clean,
          });
        }, 50);

      } catch (err) {
        console.error("send_message ERR:", err);
        if (typeof callback === "function") callback({ ok: false });
      }
    });

    /* =============================
       DISCONNECT
    ============================== */
    socket.on("disconnect", () => {
      for (const [uid, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          onlineUsers.delete(uid);
        }
      }
    });
  });
}
