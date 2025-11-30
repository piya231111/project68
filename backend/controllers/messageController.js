// backend/controllers/messageController.js
import { pool } from "../db.js";

/* ---------------------------------------------------
   1) โหลดข้อความทั้งหมดในห้อง
---------------------------------------------------- */
export async function getMessages(req, res) {
  try {
    const userId = req.user.id;
    const roomId = req.params.roomId;

    // ตรวจสิทธิ์ผู้ใช้
    const checkRoom = await pool.query(
      `
      SELECT * FROM chat_rooms
      WHERE id = $1
        AND (user1_id = $2 OR user2_id = $2)
      `,
      [roomId, userId]
    );

    if (checkRoom.rowCount === 0)
      return res.status(403).json({ error: "คุณไม่มีสิทธิเข้าห้องนี้" });

    // โหลดข้อความ
    const result = await pool.query(
      `
      SELECT 
        m.*, 
        u.display_name AS sender_name
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.room_id = $1
      ORDER BY m.created_at ASC
      `,
      [roomId]
    );

    return res.json({
      room_id: roomId,
      messages: Array.isArray(result.rows) ? result.rows : []
    });

  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ error: "โหลดข้อความล้มเหลว" });
  }
}


/* ---------------------------------------------------
   2) ส่งข้อความผ่าน REST ❌ ปิดทิ้ง
      ใช้ WebSocket เท่านั้น
---------------------------------------------------- */
export function sendMessage(req, res) {
  return res.status(403).json({
    error: "ส่งข้อความผ่าน WebSocket เท่านั้น (socket.send_message)"
  });
}
