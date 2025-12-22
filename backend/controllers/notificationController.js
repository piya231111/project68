import { pool } from "../db.js";
import { ioInstance as io, onlineUsersInstance as onlineUsers } from "../wsServer.js";

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

// ส่งคำเชิญเข้าห้องแชทกลุ่ม
export async function sendGroupInvite(req, res) {
  try {
    const inviterId = req.user.id;
    const { targetUserId, roomId } = req.body;

    if (!targetUserId || !roomId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const inviter = await pool.query(
      `SELECT display_name FROM users WHERE id = $1`,
      [inviterId]
    );

    const inviterName = inviter.rows[0].display_name;

    // บันทึกแจ้งเตือนลง DB
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, friend_id, group_room_id, is_read)
       VALUES ($1, 'group_invite', $2, $3, $4, $5, false)
       RETURNING id`,
      [
        targetUserId,
        "คำเชิญเข้าห้องแชทกลุ่ม",
        `${inviterName} ชวนคุณเข้าห้อง`,
        inviterId,
        roomId
      ]
    );

    const notiId = result.rows[0].id;

    // ส่ง realtime ผ่าน socket
    const receiverSocketId = onlineUsers.get(String(targetUserId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("notification:new", {
        id: notiId,
        type: "group_invite",
        title: `${inviterName} ชวนคุณเข้าห้อง`,
        group_room_id: roomId,
        inviterId,
      });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("sendGroupInvite error:", err);
    res.status(500).json({ error: "ส่งคำเชิญไม่สำเร็จ" });
  }
}