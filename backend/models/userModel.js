import { pool } from "../db.js";

// ดึงผู้ใช้ทั้งหมด
export async function getAllUsers() {
  const result = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
  return result.rows;
}

// ดึงผู้ใช้ตาม ID
export async function getUserById(id) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
}

// เพิ่มผู้ใช้ใหม่
export async function createUser(email, password, displayName) {
  const result = await pool.query(
    `INSERT INTO users (email, password, display_name)
     VALUES ($1, $2, $3) RETURNING *`,
    [email, password, displayName]
  );
  return result.rows[0];
}
