import { pool } from "../db.js";

export async function createMessage(roomId, senderId, type, content) {
  const result = await pool.query(
    `INSERT INTO messages (room_id, sender_id, type, content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [roomId, senderId, type, content]
  );
  return result.rows[0];
}

export async function getMessagesByRoom(roomId) {
  const result = await pool.query(
    `SELECT m.*, u.display_name AS sender_name
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.room_id = $1
     ORDER BY m.created_at ASC`,
    [roomId]
  );
  return result.rows;
}
