import { pool } from "../db.js";

// จำนวนแจ้งเตือนยังไม่อ่าน
export async function getNotificationCount(req, res) {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT COUNT(*) AS count 
             FROM notifications 
             WHERE user_id = $1 AND is_read = false`,
            [userId]
        );

        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error("getNotificationCount error:", err);
        res.status(500).json({ error: "โหลดจำนวนแจ้งเตือนล้มเหลว" });
    }
}

// รายการแจ้งเตือนล่าสุด
export async function getNotifications(req, res) {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json({ notifications: result.rows });
    } catch (err) {
        console.error("getNotifications error:", err);
        res.status(500).json({ error: "โหลดแจ้งเตือนล้มเหลว" });
    }
}

// Mark “อ่านแล้ว”
export async function markNotificationRead(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("markNotificationRead error:", err);
        res.status(500).json({ error: "อัปเดตสถานะแจ้งเตือนไม่สำเร็จ" });
    }
}

export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ error: "ลบแจ้งเตือนไม่สำเร็จ" });
  }
}

export async function clearNotifications(req, res) {
  try {
    const userId = req.user.id;

    await pool.query(
      `DELETE FROM notifications WHERE user_id = $1`,
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("clearNotifications error:", err);
    res.status(500).json({ error: "ลบแจ้งเตือนทั้งหมดไม่สำเร็จ" });
  }
}

