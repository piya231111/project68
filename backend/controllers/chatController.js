// backend/controllers/chatController.js
import { pool } from "../db.js";

export async function getOrCreateRoom(req, res) {
  try {
    const userId = req.user.id;
    const friendId = req.params.friendId;

    if (!friendId) 
      return res.status(400).json({ error: "ต้องมี friendId" });

    if (userId === friendId)
      return res.status(400).json({ error: "ไม่สามารถแชทกับตัวเองได้" });

    // หา room เดิม
    const exist = await pool.query(
      `
      SELECT * FROM chat_rooms
      WHERE (user1_id=$1 AND user2_id=$2)
         OR (user1_id=$2 AND user2_id=$1)
      LIMIT 1
      `,
      [userId, friendId]
    );

    if (exist.rowCount > 0)
      return res.json({ room_id: exist.rows[0].id });

    // ถ้าไม่มี → สร้างใหม่
    const created = await pool.query(
      `
      INSERT INTO chat_rooms (user1_id, user2_id)
      VALUES ($1, $2)
      RETURNING id
      `,
      [userId, friendId]
    );

    res.json({ room_id: created.rows[0].id });

  } catch (err) {
    console.error("getOrCreateRoom error:", err);
    res.status(500).json({ error: "สร้างห้องแชทไม่สำเร็จ" });
  }
}
