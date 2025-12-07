import express from "express";
import { pool } from "../db.js";   // ⭐ ต้อง import pool
import { getAllUsers, createUser, getUserById } from "../models/userModel.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const users = await getAllUsers();
  res.json(users);
});

router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.display_name,
        u.email,
        p.avatar_id,
        p.item_id,
        p.country,
        p.interests,
        p.is_online
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1
      `,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);  // ⭐ ส่งข้อมูลเพื่อนแบบเต็ม (avatar + item + country + interests)

  } catch (err) {
    console.error("Error loading user detail:", err);
    res.status(500).json({ error: "Failed to load user detail" });
  }
});

router.post("/", async (req, res) => {
  const { email, password, displayName } = req.body;
  const newUser = await createUser(email, password, displayName);
  res.status(201).json(newUser);
});

export default router;
