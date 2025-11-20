// backend/routes/meRoutes.js
import express from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * ✅ GET /api/me - ดึงข้อมูลผู้ใช้พร้อมโปรไฟล์
 */
router.get("/", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;

    // ดึงข้อมูล user + profile
    const userResult = await pool.query(
      `SELECT 
         u.id, 
         u.email, 
         u.display_name,
         p.country, 
         p.avatar_id, 
         p.item_id, 
         p.interests
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json({ me: userResult.rows[0] });
  } catch (err) {
    console.error("❌ GET /me error:", err);
    res.status(500).json({ error: "Failed to load user" });
  }
});

/**
 * ✅ POST /api/me/profile
 * อัปเดตข้อมูลโปรไฟล์ (country / avatarId / itemId / interests)
 */
router.post("/profile", authRequired, async (req, res) => {
  const userId = req.user.id;
  const { country, avatarId, itemId, interests } = req.body;

  console.log("📩 [DEBUG] POST /me/profile");
  console.log("🧍 userId:", userId);
  console.log("📦 body:", req.body);

  try {
    // ✅ ตรวจว่ามี profile อยู่ไหม
    const check = await pool.query(
      "SELECT * FROM profiles WHERE user_id = $1",
      [userId]
    );

    if (check.rows.length > 0) {
      // ✅ อัปเดตเฉพาะฟิลด์ที่ส่งมา (ใช้ COALESCE เพื่อไม่เขียนทับของเดิม)
      await pool.query(
        `UPDATE profiles 
         SET country   = COALESCE($1, country),
             avatar_id = COALESCE($2, avatar_id),
             item_id   = COALESCE($3, item_id),
             interests = COALESCE($4, interests)
         WHERE user_id = $5`,
        [
          country || null,
          avatarId || null,
          itemId || null,
          Array.isArray(interests) ? interests : null, // ✅ บังคับให้ interests เป็น array
          userId,
        ]
      );
    } else {
      // ✅ ถ้ายังไม่มี profile → สร้างใหม่
      await pool.query(
        `INSERT INTO profiles (user_id, country, avatar_id, item_id, interests)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          country || null,
          avatarId || null,
          itemId || null,
          Array.isArray(interests) ? interests : null,
        ]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ [ERROR] POST /me/profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
