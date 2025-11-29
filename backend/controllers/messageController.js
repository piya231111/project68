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
    const messages = await pool.query(
      `
      SELECT m.*, u.display_name AS sender_name
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.room_id = $1
      ORDER BY m.created_at ASC
      `,
      [roomId]
    );

    return res.json({ messages: messages.rows });

  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการโหลดข้อความ" });
  }
}

/* ---------------------------------------------------
   2) ส่งข้อความ
---------------------------------------------------- */
export async function sendMessage(req, res) {
  try {
    const userId = req.user.id;
    const roomId = req.params.roomId;
    const { text } = req.body;

    if (!text?.trim())
      return res.status(400).json({ error: "ข้อความต้องไม่ว่าง" });

    // ตรวจสิทธิ์ก่อนส่ง
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

    // บันทึกข้อความ
    const saved = await pool.query(
      `
      INSERT INTO messages (room_id, sender_id, text)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [roomId, userId, text]
    );

    return res.json({ message: saved.rows[0] });

  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการส่งข้อความ" });
  }
}
