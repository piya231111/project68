import { pool } from "../db.js";

// ✅ ดึงรายชื่อเพื่อนที่ยอมรับแล้ว
export async function getFriends(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.display_name,
        u.email,
        p.country,
        p.interests,
        p.avatar_id,
        p.item_id,
        f.is_favorite
      FROM friends f
      JOIN users u 
        ON (u.id = f.receiver_id AND f.requester_id = $1)
        OR (u.id = f.requester_id AND f.receiver_id = $1)
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE f.status = 'accepted'
      ORDER BY f.is_favorite DESC, u.display_name ASC
      `,
      [userId]
    );

    res.json({ friends: result.rows });

  } catch (err) {
    console.error("getFriends error:", err);
    res.status(500).json({ error: "โหลดรายชื่อเพื่อนไม่สำเร็จ" });
  }
}

// ✅ ดึงคำขอเพื่อนที่ยังรออยู่
export async function getRequests(req, res) {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `
      SELECT 
        fr.sender_id AS id,
        u.display_name,
        u.email,
        p.country,
        p.interests,
        p.avatar_id,
        p.item_id
      FROM friend_requests fr
      JOIN users u ON u.id = fr.sender_id
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE fr.receiver_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
      `,
      [userId]
    );

    res.json({ requests: result.rows });
  } catch (err) {
    console.error("getRequests error:", err);
    res.status(500).json({ error: "โหลดคำขอไม่สำเร็จ" });
  }
}

// ✅ ดึงคำขอเพื่อนที่เราส่งออกไป (ยัง pending)
export async function getPendingSentRequests(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        fr.receiver_id AS id,
        u.display_name,
        u.email,
        p.country,
        p.interests,
        p.avatar_id,
        p.item_id,
        fr.status
      FROM friend_requests fr
      JOIN users u ON u.id = fr.receiver_id
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE fr.sender_id = $1 
        AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
      `,
      [userId]
    );

    res.json({
      sent: result.rows.map((r) => r.id), // ✅ ส่งเฉพาะ id กลับให้ frontend ใช้เช็ค
      details: result.rows, // ✅ เผื่ออนาคตต้องใช้รายละเอียด
    });
  } catch (err) {
    console.error("getPendingSentRequests error:", err);
    res.status(500).json({ error: "โหลดคำขอที่ส่งไม่สำเร็จ" });
  }
}

// ✅ ค้นหาผู้ใช้ (มี filter: q, country, category + ซ่อนคนที่บล็อคกัน)
export async function searchFriends(req, res) {
  try {
    const userId = req.user.id;
    let { q, country, category } = req.query;

    let query = `
      SELECT 
        u.id, 
        u.display_name, 
        u.email, 
        p.country, 
        p.interests,
        p.avatar_id,
        p.item_id
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id != $1
    `;

    const params = [userId];
    let i = 2;

    if (q) {
      query += ` AND (u.display_name ILIKE $${i} OR u.email ILIKE $${i})`;
      params.push(`%${q}%`);
      i++;
    }

    if (country) {
      query += ` AND p.country = $${i}`;
      params.push(country);
      i++;
    }

    if (category) {
      const cats = Array.isArray(category) ? category : [category];
      query += ` AND p.interests && ARRAY[${cats.map((_, idx) => `$${i + idx}`).join(", ")}]`;
      cats.forEach((c) => params.push(c));
      i += cats.length;
    }

    query += " ORDER BY u.display_name LIMIT 50";

    const result = await pool.query(query, params);
    res.json({ results: result.rows });

  } catch (err) {
    console.error("searchFriends error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการค้นหาเพื่อน" });
  }
}


// ✅ ส่งคำขอเพื่อน
export async function sendFriendRequest(req, res) {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.id;

    if (senderId === receiverId)
      return res.status(400).json({ error: "❌ ไม่สามารถเพิ่มเพื่อนตัวเองได้" });

    // ตรวจว่าผู้รับมีอยู่จริงไหม
    const checkUser = await pool.query("SELECT id FROM users WHERE id = $1", [receiverId]);
    if (checkUser.rowCount === 0)
      return res.status(404).json({ error: "ไม่พบผู้ใช้ปลายทาง" });

    // ตรวจคำขอซ้ำ
    const existReq = await pool.query(
      `
      SELECT 1 FROM friend_requests
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
      `,
      [senderId, receiverId]
    );

    // ตรวจว่าเป็นเพื่อนอยู่แล้วไหม
    const existFriend = await pool.query(
      `
      SELECT 1 FROM friends
      WHERE (requester_id = $1 AND receiver_id = $2)
         OR (requester_id = $2 AND receiver_id = $1)
      `,
      [senderId, receiverId]
    );

    if (existReq.rowCount > 0 || existFriend.rowCount > 0)
      return res.status(400).json({ error: "มีคำขอหรือเป็นเพื่อนอยู่แล้ว" });

    // ✅ เพิ่มคำขอใหม่
    await pool.query(
      `
      INSERT INTO friend_requests (sender_id, receiver_id, status)
      VALUES ($1, $2, 'pending')
      `,
      [senderId, receiverId]
    );

    res.json({ success: true, message: "✅ ส่งคำขอเป็นเพื่อนสำเร็จ" });
  } catch (err) {
    console.error("sendFriendRequest error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการส่งคำขอ" });
  }
}

// ✅ ยอมรับคำขอเพื่อน
export async function acceptFriendRequest(req, res) {
  try {
    const receiverId = req.user.id;
    const senderId = req.params.id;

    // ตรวจว่ามีคำขอ pending ไหม
    const check = await pool.query(
      `
      SELECT * FROM friend_requests
      WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'
      `,
      [senderId, receiverId]
    );

    if (check.rowCount === 0)
      return res.status(404).json({ error: "ไม่พบคำขอที่รออยู่" });

    // อัปเดตสถานะเป็น accepted
    await pool.query(
      `
      UPDATE friend_requests
      SET status = 'accepted'
      WHERE sender_id = $1 AND receiver_id = $2
      `,
      [senderId, receiverId]
    );

    // เพิ่มเป็นเพื่อนกันทั้งสองฝั่ง
    await pool.query(
      `
      INSERT INTO friends (requester_id, receiver_id, status)
      VALUES ($1, $2, 'accepted'), ($2, $1, 'accepted')
      `,
      [senderId, receiverId]
    );

    res.json({ success: true, message: "✅ ยอมรับคำขอสำเร็จ" });
  } catch (err) {
    console.error("acceptFriendRequest error:", err);
    res.status(500).json({ error: "ยอมรับคำขอไม่สำเร็จ" });
  }
}

// ✅ ปฏิเสธคำขอเพื่อน
export async function declineFriendRequest(req, res) {
  try {
    const receiverId = req.user.id;   // คนที่ถูกขอ
    const senderId = req.params.id;   // คนที่ส่งคำขอมา

    // ตรวจว่ามีคำขอ pending จริงไหม
    const check = await pool.query(
      `
      SELECT * FROM friend_requests
      WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'
      `,
      [senderId, receiverId]
    );

    if (check.rowCount === 0)
      return res.status(404).json({ error: "ไม่พบคำขอที่รออยู่" });

    // ✅ อัปเดตสถานะเป็น rejected
    await pool.query(
      `
      UPDATE friend_requests
      SET status = 'rejected'
      WHERE sender_id = $1 AND receiver_id = $2
      `,
      [senderId, receiverId]
    );

    res.json({ success: true, message: "❌ ปฏิเสธคำขอแล้ว" });
  } catch (err) {
    console.error("declineFriendRequest error:", err);
    res.status(500).json({ error: "ปฏิเสธคำขอไม่สำเร็จ" });
  }
}

// ✅ ลบเพื่อนออกจากระบบ (สองฝั่ง)
export async function deleteFriend(req, res) {
  try {
    const userId = req.user.id;      // คนที่กำลังล็อกอิน
    const friendId = req.params.id;  // id ของเพื่อนที่จะลบ

    // ตรวจว่าเป็นเพื่อนกันจริงไหม
    const check = await pool.query(
      `
      SELECT * FROM friends
      WHERE 
        ((requester_id = $1 AND receiver_id = $2)
         OR (requester_id = $2 AND receiver_id = $1))
        AND status = 'accepted'
      `,
      [userId, friendId]
    );

    if (check.rowCount === 0) {
      return res.status(404).json({ error: "ไม่พบเพื่อนคนนี้ในรายชื่อของคุณ" });
    }

    // ✅ ลบทั้งสองฝั่งออกจาก friends
    await pool.query(
      `
      DELETE FROM friends
      WHERE 
        (requester_id = $1 AND receiver_id = $2)
        OR (requester_id = $2 AND receiver_id = $1)
      `,
      [userId, friendId]
    );

    res.json({ success: true, message: "ลบเพื่อนสำเร็จ ✅" });
  } catch (err) {
    console.error("deleteFriend error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบเพื่อน" });
  }
}

// ✅ ปักดาว / เอาดาวออกเพื่อน (อัปเดตสองฝั่ง)
export async function toggleFavoriteFriend(req, res) {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;

    // ตรวจว่าเป็นเพื่อนกันหรือไม่ (ไม่ว่าจะเป็น requester หรือ receiver)
    const check = await pool.query(
      `
      SELECT * FROM friends
      WHERE 
        ((requester_id = $1 AND receiver_id = $2) OR
         (requester_id = $2 AND receiver_id = $1))
        AND status = 'accepted'
      `,
      [userId, friendId]
    );

    if (check.rowCount === 0) {
      return res.status(404).json({ error: "ไม่พบเพื่อนคนนี้" });
    }

    // toggle ค่าปักดาว
    const current = check.rows[0].is_favorite ?? false;
    const newFavorite = !current;

    // ✅ อัปเดตทั้งสองทิศทาง
    await pool.query(
      `
      UPDATE friends
      SET is_favorite = $1
      WHERE 
        (requester_id = $2 AND receiver_id = $3)
        OR (requester_id = $3 AND receiver_id = $2)
      `,
      [newFavorite, userId, friendId]
    );

    res.json({
      success: true,
      message: newFavorite ? "⭐ ปักดาวเพื่อนแล้ว!" : "❌ เอาดาวออกแล้ว",
      is_favorite: newFavorite,
    });
  } catch (err) {
    console.error("toggleFavoriteFriend error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการปักดาวเพื่อน" });
  }
}


// ✅ บล็อคผู้ใช้
export async function blockUser(req, res) {
  try {
    const blockerId = req.user.id;
    const blockedId = req.params.id;

    if (blockerId === blockedId) {
      return res.status(400).json({ error: "ไม่สามารถบล็อคตัวเองได้" });
    }

    // ลบคำขอเพื่อนถ้ามีอยู่
    await pool.query(
      `
      DELETE FROM friend_requests
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
      `,
      [blockerId, blockedId]
    );

    // ลบเพื่อนถ้าเป็นเพื่อนกันอยู่
    await pool.query(
      `
      DELETE FROM friends
      WHERE (requester_id = $1 AND receiver_id = $2)
         OR (requester_id = $2 AND receiver_id = $1)
      `,
      [blockerId, blockedId]
    );

    // เพิ่มบล็อค
    await pool.query(
      `
      INSERT INTO blocked_users (blocker_id, blocked_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [blockerId, blockedId]
    );

    res.json({ success: true, message: "🚫 บล็อคผู้ใช้เรียบร้อยแล้ว" });
  } catch (err) {
    console.error("blockUser error:", err);
    res.status(500).json({ error: "ไม่สามารถบล็อคผู้ใช้ได้" });
  }
}

// ✅ ยกเลิกการบล็อค
export async function unblockUser(req, res) {
  try {
    const blockerId = req.user.id;
    const blockedId = req.params.id;

    await pool.query(
      `DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2`,
      [blockerId, blockedId]
    );

    res.json({ success: true, message: "✅ ยกเลิกการบล็อคสำเร็จ" });
  } catch (err) {
    console.error("unblockUser error:", err);
    res.status(500).json({ error: "ไม่สามารถยกเลิกบล็อคได้" });
  }
}

