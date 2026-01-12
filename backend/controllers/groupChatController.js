// backend/controllers/groupChatController.js
import { pool } from "../db.js";

/* ================================
   ดึงห้องทั้งหมด + ห้องยอดนิยม
================================ */
export async function getAllGroupRooms(req, res) {
    try {
        // ห้องทั้งหมด
        const rooms = await pool.query(`
      SELECT id, name, type, members, created_at
      FROM group_rooms
      ORDER BY created_at DESC
    `);

        // ห้องยอดนิยม (Public + สมาชิกเยอะสุด 5 ห้อง)
        const popular = await pool.query(`
      SELECT id, name, type, members, created_at
      FROM group_rooms
      WHERE type = 'public'
        AND members > 0
      ORDER BY members DESC
      LIMIT 5
    `);

        return res.json({
            rooms: rooms.rows,
            popular: popular.rows,
        });

    } catch (err) {
        console.error("getAllGroupRooms ERROR:", err);
        res.status(500).json({ error: "โหลดรายชื่อห้องล้มเหลว" });
    }
}

/* ================================
   ดึงสมาชิกรายห้อง
================================ */
export async function getGroupRoomMembers(req, res) {
    try {
        const { roomId } = req.params;

        // ดึงข้อมูลห้อง
        const roomInfo = await pool.query(
            `SELECT id, name, type, members FROM group_rooms WHERE id = $1`,
            [roomId]
        );

        if (roomInfo.rowCount === 0) {
            return res.status(404).json({ error: "ไม่พบห้อง" });
        }

        // ดึงสมาชิก
        const members = await pool.query(
            `
            SELECT 
                u.id, 
                u.display_name, 
                p.avatar_id, 
                p.item_id,
                p.country,
                p.interests
            FROM group_room_members gm
            JOIN users u ON u.id = gm.user_id
            LEFT JOIN profiles p ON p.user_id = u.id
            WHERE gm.room_id = $1
        `,
            [roomId]
        );

        res.json({
            room: roomInfo.rows[0],  // ส่ง type กลับไป
            members: members.rows    // รายชื่อสมาชิก
        });

    } catch (err) {
        console.error("getGroupRoomMembers ERROR:", err);
        res.status(500).json({ error: "โหลดสมาชิกห้องล้มเหลว" });
    }
}

/* ================================
   เข้าร่วมห้อง (รองรับ public/private)
================================ */
export async function joinPrivateGroupRoom(req, res) {
    try {
        const { roomId } = req.params;
        const { password } = req.body;
        const userId = req.user.id;

        const room = await pool.query(
            `SELECT * FROM group_rooms WHERE id = $1`,
            [roomId]
        );

        if (room.rowCount === 0)
            return res.status(404).json({ error: "ไม่พบห้อง" });

        const r = room.rows[0];

        // ห้ามเข้าถ้าห้องเต็ม
        if (r.members >= 10)
            return res.status(403).json({ error: "ห้องเต็ม (จำกัด 10 คน)" });

        if (r.type === "private" && r.password !== password)
            return res.status(403).json({ error: "รหัสไม่ถูกต้อง" });

        const exists = await pool.query(
            `SELECT id FROM group_room_members WHERE room_id = $1 AND user_id = $2`,
            [roomId, userId]
        );

        if (exists.rowCount === 0) {
            await pool.query(
                `INSERT INTO group_room_members (room_id, user_id) VALUES ($1,$2)`,
                [roomId, userId]
            );

            await pool.query(
                `UPDATE group_rooms
                 SET members = (
                    SELECT COUNT(*) FROM group_room_members WHERE room_id = $1
                )
                WHERE id = $1`,
                [roomId]
            );
        }

        res.json({ ok: true });

    } catch (err) {
        console.error("joinPrivateGroupRoom ERROR:", err);
        res.status(500).json({ error: "เข้าร่วมล้มเหลว" });
    }
}

/* ================================
   สร้างห้องใหม่
================================ */
export async function createGroupRoom(req, res) {
    try {
        const { name, type, password } = req.body;
        const userId = req.user.id;

        if (!name || !type)
            return res.status(400).json({ error: "ข้อมูลไม่ครบ" });

        const exist = await pool.query(
            `SELECT id FROM group_rooms WHERE name = $1`,
            [name]
        );
        if (exist.rowCount > 0)
            return res.status(400).json({ error: "มีชื่อห้องนี้อยู่แล้ว" });

        if (type === "private") {
            if (!/^\d{4}$/.test(password))
                return res.status(400).json({ error: "รหัสต้องเป็นตัวเลข 4 หลัก" });
        }

        const result = await pool.query(
            `
      INSERT INTO group_rooms (name, type, password, members)
      VALUES ($1, $2, $3, 1)      -- สร้างห้องแล้วถือว่าเจ้าของเข้าห้องทันที
      RETURNING *
      `,
            [name, type, password || null]
        );

        const room = result.rows[0];

        // เพิ่มคนสร้างเข้าห้องด้วย
        await pool.query(
            `INSERT INTO group_room_members (room_id, user_id) VALUES ($1,$2)`,
            [room.id, userId]
        );

        return res.json({
            ok: true,
            roomId: room.id,
            room,
        });

    } catch (err) {
        console.error("createGroupRoom error:", err);
        res.status(500).json({ error: "สร้างห้องไม่สำเร็จ" });
    }
}

export async function joinPublicGroupRoom(req, res) {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        const room = await pool.query(
            `SELECT * FROM group_rooms WHERE id = $1`,
            [roomId]
        );

        if (room.rowCount === 0)
            return res.status(404).json({ error: "ไม่พบห้อง" });

        const r = room.rows[0];

        // ห้ามเข้าถ้าห้องเต็ม
        if (r.members >= 10)
            return res.status(403).json({ error: "ห้องเต็ม (จำกัด 10 คน)" });

        const exists = await pool.query(
            `SELECT id FROM group_room_members WHERE room_id = $1 AND user_id = $2`,
            [roomId, userId]
        );

        if (exists.rowCount === 0) {
            await pool.query(
                `INSERT INTO group_room_members (room_id, user_id) VALUES ($1,$2)`,
                [roomId, userId]
            );

            await pool.query(
                `UPDATE group_rooms
                 SET members = (
                    SELECT COUNT(*) FROM group_room_members WHERE room_id = $1
                )
                WHERE id = $1`,
                [roomId]
            );
        }

        res.json({ ok: true });

    } catch (err) {
        console.error("joinPublicGroupRoom ERROR:", err);
        res.status(500).json({ error: "เข้าร่วมล้มเหลว" });
    }
}

export async function leaveGroupRoom(req, res) {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        // 1) ลบสมาชิกออกจากห้อง
        await pool.query(
            `DELETE FROM group_room_members WHERE room_id = $1 AND user_id = $2`,
            [roomId, userId]
        );

        // 2) อัปเดตจำนวนสมาชิกจากฐานข้อมูลจริง (วิธีที่ปลอดภัยที่สุด)
        await pool.query(
            `
            UPDATE group_rooms
            SET members = (
                SELECT COUNT(*) FROM group_room_members WHERE room_id = $1
            )
            WHERE id = $1
            `,
            [roomId]
        );

        return res.json({ ok: true });

    } catch (err) {
        console.error("leaveGroupRoom ERROR:", err);
        res.status(500).json({ error: "ออกจากห้องล้มเหลว" });
    }
}


