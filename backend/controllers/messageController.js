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

    // โหลดข้อความเสมอให้เป็น array 100%
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
   2) ส่งข้อความ (text / image / video / gif)
---------------------------------------------------- */
export async function sendMessage(req, res) {
  try {
    const userId = req.user.id;
    const roomId = req.params.roomId;

    const { text, type, file_url } = req.body;

    // ประเภทข้อมูลที่ backend รองรับ
    const validTypes = ["text", "image", "video", "gif"];
    const msgType = validTypes.includes(type) ? type : "text";

    if (msgType === "text" && !text?.trim()) {
      return res.status(400).json({ error: "ข้อความว่าง" });
    }

    if (msgType !== "text" && !file_url) {
      return res.status(400).json({ error: "ไฟล์ไม่มี URL" });
    }

    // ตรวจสิทธิ์
    const checkRoom = await pool.query(
      `
      SELECT * FROM chat_rooms
      WHERE id = $1
        AND (user1_id = $2 OR user2_id = $2)
      `,
      [roomId, userId]
    );

    if (checkRoom.rowCount === 0)
      return res.status(403).json({ error: "ไม่มีสิทธิ์ในห้องนี้" });

    // บันทึกลง DB
    const saved = await pool.query(
      `
      INSERT INTO messages (room_id, sender_id, text, type, file_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        roomId,
        userId,
        text || null,
        msgType,
        file_url || null,
      ]
    );

    // 🔥 ส่งกลับแบบเดียวกับ socket.emit เสมอ — React ชอบมาก
    return res.json({
      room_id: roomId,
      sender_id: userId,
      type: msgType,
      text: text || null,
      file_url: file_url || null,
      created_at: saved.rows[0].created_at,
      id: saved.rows[0].id
    });

  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ error: "ส่งข้อความล้มเหลว" });
  }
}
