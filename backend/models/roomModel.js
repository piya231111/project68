import { pool } from "../db.js";

export async function createRoom(name, type, createdById) {
  const result = await pool.query(
    `INSERT INTO rooms (name, type, created_by_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, type, createdById]
  );
  return result.rows[0];
}

export async function getAllRooms() {
  const result = await pool.query("SELECT * FROM rooms ORDER BY created_at DESC");
  return result.rows;
}

export async function getRoomMembers(roomId) {
  const result = await pool.query(
    `SELECT rm.*, u.display_name 
     FROM room_members rm
     JOIN users u ON u.id = rm.user_id
     WHERE rm.room_id = $1`,
    [roomId]
  );
  return result.rows;
}
