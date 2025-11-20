import { pool } from "../db.js";

export async function createProfile(userId, country, avatarId, itemId, interests, bio) {
  const result = await pool.query(
    `INSERT INTO profiles (user_id, country, avatar_id, item_id, interests, bio)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, country, avatarId, itemId, interests, bio]
  );
  return result.rows[0];
}

export async function getProfileByUserId(userId) {
  const result = await pool.query("SELECT * FROM profiles WHERE user_id = $1", [userId]);
  return result.rows[0];
}

export async function updateProfile(userId, bio) {
  const result = await pool.query(
    "UPDATE profiles SET bio = $1 WHERE user_id = $2 RETURNING *",
    [bio, userId]
  );
  return result.rows[0];
}
