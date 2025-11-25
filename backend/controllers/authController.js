import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { pool } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

// ฟังก์ชันสร้าง Token
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

// ✅ REGISTER (เวอร์ชันสุดท้าย)
export async function register(req, res) {
  try {
    const { email, password, displayName } = req.body;

    // เช็คอีเมลซ้ำ
    const exist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (exist.rows.length > 0) {
      return res.status(400).json({ error: "อีเมลนี้ถูกใช้แล้ว" });
    }

    // สร้างผู้ใช้
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name`,
      [email, hash, displayName]
    );

    const user = result.rows[0];

    // ⭐ สร้าง profile ทันที
    await pool.query(
      `INSERT INTO profiles (user_id, is_online, last_seen)
       VALUES ($1, true, NOW())`,
      [user.id]
    );

    // ส่ง token กลับ
    const token = generateToken(user);
    res.json({ token, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
}

// ✅ LOGIN
export async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR display_name = $1",
      [identifier]
    );

    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: "ไม่พบผู้ใช้" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "รหัสผ่านไม่ถูกต้อง" });

    // ⭐ สร้างโปรไฟล์ถ้ายังไม่มี
    await pool.query(
      `INSERT INTO profiles (user_id, is_online, last_seen)
       VALUES ($1, true, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET is_online = true, last_seen = NOW()`,
      [user.id]
    );

    const token = generateToken(user);

    res.json({
      token,
      user: { id: user.id, email: user.email, display_name: user.display_name },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
}

// ✅ GOOGLE LOGIN
export async function googleLogin(req, res) {
  try {
    const { credential } = req.body;
    if (!GOOGLE_CLIENT_ID)
      return res.status(500).json({ error: "missing GOOGLE_CLIENT_ID" });

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const displayName = payload.name;

    let result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    let user = result.rows[0];

    // ⭐ ยังไม่มี user → สร้างใหม่
    if (!user) {
      const insert = await pool.query(
        `INSERT INTO users (email, display_name)
         VALUES ($1, $2)
         RETURNING id, email, display_name`,
        [email, displayName]
      );
      user = insert.rows[0];
    }

    // ⭐ บังคับสร้าง profile หรืออัปเดตออนไลน์เสมอ
    await pool.query(
      `INSERT INTO profiles (user_id, is_online, last_seen)
       VALUES ($1, true, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET is_online = true, last_seen = NOW()`,
      [user.id]
    );

    const token = generateToken(user);

    res.json({ token, user });

  } catch (err) {
    console.error("Google login error:", err);
    res.status(400).json({ error: "Google login failed" });
  }
}

// ✅ LOGOUT
export async function logout(req, res) {
  try {
    const userId = req.user.id;

    // อัปเดตสถานะเป็นออฟไลน์
    await pool.query(
      `UPDATE profiles 
       SET is_online = false, last_seen = NOW()
       WHERE user_id = $1`,
      [userId]
    );

    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดระหว่าง logout" });
  }
}

// ✅ GET ME (พร้อมอัปเดตสถานะออนไลน์ทุกครั้ง)
export async function getMe(req, res) {
  try {
    const userId = req.user.id;

    // ⭐ บังคับสร้างหรืออัปเดต online ทุกครั้ง
    await pool.query(
      `INSERT INTO profiles (user_id, is_online, last_seen)
       VALUES ($1, true, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET is_online = true, last_seen = NOW()`,
      [userId]
    );

    const result = await pool.query(
      `SELECT 
          u.id,
          u.email,
          u.display_name,
          p.country,
          p.avatar_id,
          p.item_id,
          p.interests,
          p.is_online,
          p.last_seen
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );

    res.json({ me: result.rows[0] });

  } catch (err) {
    console.error("🔥 GETME ERROR:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลผู้ใช้ได้" });
  }
}

// ✅ UPDATE ME (แก้ไขโปรไฟล์)
export async function updateMe(req, res) {
  try {
    const userId = req.user.id;
    const { display_name, country, avatar_id, item_id, interests } = req.body;

    // ดึงข้อมูลปัจจุบัน
    const old = await pool.query(
      `SELECT u.display_name, p.country, p.avatar_id, p.item_id, p.interests
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );

    const current = old.rows[0] || {};

    const newDisplay = display_name ?? current.display_name;
    const newCountry = country ?? current.country;
    const newAvatar = avatar_id ?? current.avatar_id;
    const newItem = item_id ?? current.item_id;
    const newInterests = interests ?? current.interests;

    // อัปเดต users
    await pool.query(
      `UPDATE users SET display_name = $1 WHERE id = $2`,
      [newDisplay, userId]
    );

    // อัปเดต profiles
    const profileExist = await pool.query(`SELECT * FROM profiles WHERE user_id = $1`, [userId]);

    if (profileExist.rows.length === 0) {
      await pool.query(
        `INSERT INTO profiles (user_id, country, avatar_id, item_id, interests)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, newCountry, newAvatar, newItem, newInterests || []]
      );
    } else {
      await pool.query(
        `UPDATE profiles
         SET country = $1,
             avatar_id = $2,
             item_id = $3,
             interests = $4
         WHERE user_id = $5`,
        [newCountry, newAvatar, newItem, newInterests || [], userId]
      );
    }

    // ⭐ ส่งข้อมูลกลับพร้อม is_online + last_seen
    const result = await pool.query(
      `SELECT 
          u.id, 
          u.email, 
          u.display_name,
          p.country, 
          p.avatar_id, 
          p.item_id, 
          p.interests,
          p.is_online,
          p.last_seen
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );

    res.json({ success: true, me: result.rows[0] });

  } catch (err) {
    console.error("🔥 UPDATE ERROR:", err.stack);
    res.status(500).json({ error: "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้" });
  }
}
