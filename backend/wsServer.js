// backend/wsServer.js
import { Server } from "socket.io";
import { pool } from "./db.js";
import { filterBadWords } from "./utils/textModerationRegex.js";
import { aiModerate } from "./utils/textModerationAI.js";

let onlineUsers = new Map();
let roomMembers = new Map();

let socketToUser = new Map();

export let ioInstance = null;
export let onlineUsersInstance = null;

// ==== RANDOM CHAT ====
let randomWaiting = [];
let randomRooms = {};

function getSimilarity(a1, a2) {
  if (!Array.isArray(a1)) a1 = [];
  if (!Array.isArray(a2)) a2 = [];

  a1 = a1.map(x => String(x).toLowerCase());
  a2 = a2.map(x => String(x).toLowerCase());

  return a1.filter(x => a2.includes(x)).length;
}

function removeFromRandomQueue(userId) {
  randomWaiting = randomWaiting.filter(u => u.userId !== userId);
}

export function setupWebSocket(server) {
  const io = new Server(server, {
    cors: { origin: "http://localhost:5173", credentials: true },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    ioInstance = io;
    onlineUsersInstance = onlineUsers;

    /* =============================
         ONLINE
    ============================== */
    socket.on("online", (userId) => {
      if (userId) {
        onlineUsers.set(String(userId), socket.id);
        console.log(`User ${userId} online via socket ${socket.id}`);
      }
    });

    /* =============================
        NORMAL CHAT: JOIN ROOM
    ============================== */
    socket.on("join_room", ({ roomId, userId }) => {
      if (!roomId || !userId) return;

      socket.join(roomId);

      if (!roomMembers.has(roomId)) roomMembers.set(roomId, new Set());
      roomMembers.get(roomId).add(socket.id);

      io.to(socket.id).emit("room_joined", roomId);
    });

    socket.on("randomChat:getRoomInfo", ({ roomId }) => {
      if (!randomRooms[roomId]) return;
      io.to(socket.id).emit("randomChat:roomInfo", {
        users: randomRooms[roomId].users
      });
    });

    /* =============================
        NORMAL CHAT: SEND MESSAGE
    ============================== */
    socket.on("send_message", async (msgData, callback) => {
      try {
        let { room_id, sender_id, text, type, file_url } = msgData;

        const safeCallback = (res) =>
          typeof callback === "function" && callback(res);

        if (!room_id || !sender_id)
          return safeCallback({ ok: false, error: "missing data" });

        if (type === "text") text = filterBadWords(text);

        const result = await pool.query(
          `
          INSERT INTO messages (room_id, sender_id, text, type, file_url)
          VALUES ($1,$2,$3,$4,$5)
          RETURNING *
        `,
          [room_id, sender_id, text || null, type, file_url || null]
        );

        const msg = result.rows[0];

        io.to(room_id).emit("receive_message", msg);
        safeCallback({ ok: true, msg });

        // แจ้งเตือนถ้าอีกฝ่ายไม่อยู่ในห้อง
        const roomData = await pool.query(
          `SELECT user1_id, user2_id FROM chat_rooms WHERE id = $1`,
          [room_id]
        );

        const { user1_id, user2_id } = roomData.rows[0];
        const receiverId = sender_id === user1_id ? user2_id : user1_id;

        const members = roomMembers.get(room_id);
        const receiverSocketId = onlineUsers.get(String(receiverId));

        const isReceiverInRoom =
          members && receiverSocketId && members.has(receiverSocketId);

        if (!isReceiverInRoom) {
          const senderName = (
            await pool.query(
              `SELECT display_name FROM users WHERE id = $1`,
              [sender_id]
            )
          ).rows[0].display_name;

          await pool.query(
            `
            INSERT INTO notifications (user_id, type, title, body, friend_id, is_read)
            VALUES ($1, 'chat_message', $2, $3, $4, false)
          `,
            [
              receiverId,
              "ข้อความใหม่จากเพื่อน",
              `${senderName} ส่งข้อความถึงคุณ`,
              sender_id
            ]
          );
        }

        // AI cleaning async
        setTimeout(async () => {
          if (!text) return;

          const clean = await aiModerate(text);
          if (!clean || clean === text) return;

          await pool.query(`UPDATE messages SET text=$1 WHERE id=$2`, [
            clean,
            msg.id,
          ]);

          io.to(room_id).emit("message_updated", {
            id: msg.id,
            text: clean,
          });
        }, 50);

      } catch (err) {
        console.error("send_message ERR:", err);
        callback?.({ ok: false });
      }
    });

    /* =============================
        RANDOM CHAT: JOIN QUEUE
    ============================== */
    socket.on("randomChat:joinQueue", (user) => {
      const userData = {
        ...user,
        socketId: socket.id,
      };

      // ป้องกันซ้ำ
      const exists = randomWaiting.find(
        (u) => u.userId === userData.userId || u.socketId === socket.id
      );
      if (exists) return;

      randomWaiting.push(userData);
      console.log("Queue =", randomWaiting.map((u) => u.userId));

      // ▶ DEBUG: ดูคิวทั้งหมด
      console.log("FULL QUEUE DATA =", randomWaiting);

      // ==== GLOBAL PAIR FINDER ====
      let matchedA = null;
      let matchedB = null;

      for (let i = 0; i < randomWaiting.length; i++) {
        for (let j = i + 1; j < randomWaiting.length; j++) {
          const a = randomWaiting[i];
          const b = randomWaiting[j];

          // บอกให้รู้ว่ากำลังเช็กใครกับใคร
          const score = getSimilarity(a.interests, b.interests);
          console.log(
            `CHECK MATCH => ${a.userId} vs ${b.userId} score = ${score}`
          );

          if (a.country !== b.country) continue;
          if (!a.isOnline || !b.isOnline) continue;

          //ห้ามสุ่มเจอคนที่บล็อคเรา หรือเราบล็อคเขา
          if ((a.blocked || []).includes(b.userId)) continue;
          if ((b.blocked || []).includes(a.userId)) continue;

          //ห้ามสุ่มเจอเพื่อนที่มีอยู่แล้ว
          if ((a.friends || []).includes(b.userId)) continue;
          if ((b.friends || []).includes(a.userId)) continue;

          // interests ต้องตรงกัน >= 3
          if (score < 3) continue;


          matchedA = a;
          matchedB = b;
          break;
        }
        if (matchedA && matchedB) break;
      }

      // ไม่เจอคู่
      if (!matchedA || !matchedB) {
        socket.emit("randomChat:waiting");
        return;
      }

      // ==== ตรงนี้ต้องวิ่ง! ====
      console.log("🎉 MATCH FOUND!", matchedA.userId, matchedB.userId);

      const roomId = "random_" + Date.now();

      randomRooms[roomId] = {
        users: [matchedA.userId, matchedB.userId],
        sockets: [matchedA.socketId, matchedB.socketId],
      };

      // ลบออกจาก queue
      removeFromRandomQueue(matchedA.userId);
      removeFromRandomQueue(matchedB.userId);

      // เข้าห้อง
      io.sockets.sockets.get(matchedA.socketId)?.join(roomId);
      io.sockets.sockets.get(matchedB.socketId)?.join(roomId);

      console.log("RANDOM MATCH => Room:", roomId);

      // ส่ง event match
      io.to(roomId).emit("randomChat:matched", {
        roomId,
        users: randomRooms[roomId].users,
      });
    });

    /* =============================
        RANDOM CHAT: LEAVE QUEUE
    ============================== */
    socket.on("randomChat:leaveQueue", () => {
      randomWaiting = randomWaiting.filter(u => u.socketId !== socket.id);

      for (const roomId in randomRooms) {
        if (randomRooms[roomId].sockets.includes(socket.id)) {
          io.to(roomId).emit("randomChat:end");
          delete randomRooms[roomId];
        }
      }

      console.log(`User left queue → socket: ${socket.id}`);
    });

    /* =============================
        RANDOM CHAT: SEND MESSAGE
    ============================== */
    socket.on("randomChat:message", (msg) => {
      io.to(msg.roomId).emit("randomChat:message", {
        text: msg.text || null,
        sender: String(msg.sender),
        fileUrl: msg.fileUrl || null,
        type: msg.type || "text",
        time: msg.time || Date.now(),
      });
    });

    /* =============================
        RANDOM CHAT: LEAVE ROOM
    ============================== */
    socket.on("randomChat:leave", (roomId) => {
      if (randomRooms[roomId]) {
        io.to(roomId).emit("randomChat:end");
        delete randomRooms[roomId];
      }
    });

    /* =============================
          RANDOM CHAT REJOIN
    ============================== */
    socket.on("randomChat:rejoin", ({ roomId, userId }) => {
      if (!randomRooms[roomId]) return;

      socket.join(roomId);

      const room = randomRooms[roomId];
      const idx = room.users.indexOf(userId);
      if (idx !== -1) {
        room.sockets[idx] = socket.id;
      }
    });

    /* =============================
      GROUP CHAT: JOIN ROOM
    ============================= */
    socket.on("groupChat:join", async ({ roomId, user, isReconnect }) => {
      if (!roomId || !user) return;

      // map socket → user
      socketToUser.set(socket.id, String(user.id));

      // ❌ อย่าเช็กจาก group_rooms.members (เสี่ยง race)
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM group_room_members WHERE room_id = $1`,
        [roomId]
      );

      if (Number(countRes.rows[0].count) >= 10) {
        io.to(socket.id).emit("groupChat:full", {
          error: "ห้องเต็ม (จำกัด 10 คน)",
        });
        return;
      }

      // join socket room
      socket.join(roomId);

      // memory
      if (!roomMembers.has(roomId)) roomMembers.set(roomId, new Set());
      roomMembers.get(roomId).add(socket.id);

      // ✅ insert DB แบบกันซ้ำ
      await pool.query(
        `
    INSERT INTO group_room_members (room_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    `,
        [roomId, user.id]
      );

      console.log(
        `User ${user.id} joined GroupRoom ${roomId} (reconnect=${!!isReconnect})`
      );

      // 🔄 อัปเดต member list ทุกคน
      io.to(roomId).emit("groupChat:syncMembers");

      // 🚨 แสดงข้อความ "เข้าห้อง" เฉพาะเข้าใหม่จริง
      if (!isReconnect) {
        socket.to(roomId).emit("groupChat:userJoin", {
          userId: user.id,
          name: user.display_name,
        });
      }

      // แจ้งกลับเฉพาะ client ตัวเอง
      io.to(socket.id).emit("groupChat:joinedSelf");
    });

    /* =============================
    GROUP CHAT: JOIN FROM INVITE
    ============================= */
    socket.on("groupChat:joinFromInvite", async ({ roomId, user }) => {
      if (!roomId || !user) return;

      socket.join(roomId);

      if (!roomMembers.has(roomId)) {
        roomMembers.set(roomId, new Set());
      }
      roomMembers.get(roomId).add(socket.id);

      console.log(`(INVITE) User ${user.id} joined GroupRoom ${roomId}`);

      // ✅ สำคัญมาก
      io.to(roomId).emit("groupChat:syncMembers");

      socket.to(roomId).emit("groupChat:userJoin", {
        userId: user.id,
        name: user.display_name,
      });

      io.to(socket.id).emit("groupChat:joinedSelf");
    });

    /* =============================
      GROUP CHAT: MESSAGE
    ============================= */
    socket.on("groupChat:message", (msg) => {
      const { roomId } = msg;

      io.to(roomId).emit("groupChat:message", {
        sender: msg.sender,
        name: msg.name,
        text: msg.text || null,
        fileUrl: msg.fileUrl || null,
        type: msg.type || "text",
        time: msg.time || Date.now(),
      });
    });

    /* =============================
      GROUP CHAT: LEAVE
    ============================= */
    socket.on("groupChat:leave", async ({ roomId, userId, manualLeave }) => {
      socket.leave(roomId);

      const members = roomMembers.get(roomId);
      if (members) members.delete(socket.id);

      if (manualLeave) {
        socket.to(roomId).emit("groupChat:userLeft", { userId });

        // ลบสมาชิกออกจาก DB
        await pool.query(
          `DELETE FROM group_room_members WHERE room_id = $1 AND user_id = $2`,
          [roomId, userId]
        );
      }

      // อัปเดตจำนวนสมาชิก
      const check = await pool.query(
        `SELECT COUNT(*) AS total FROM group_room_members WHERE room_id = $1`,
        [roomId]
      );

      const count = Number(check.rows[0].total);

      await pool.query(
        `UPDATE group_rooms SET members = $1 WHERE id = $2`,
        [count, roomId]
      );

      // ✅ ค่อย sync หลัง DB เสร็จ
      io.to(roomId).emit("groupChat:syncMembers");

      // ลบห้องถ้าไม่มีสมาชิก
      if (manualLeave && count === 0) {
        await pool.query(`DELETE FROM group_rooms WHERE id = $1`, [roomId]);
        roomMembers.delete(roomId);
        console.log(`🗑 ลบห้อง ${roomId} เพราะไม่มีสมาชิก`);
      }
    });

    /* =============================
          DISCONNECT
    ============================== */
    socket.on("disconnect", async () => {
      console.log("Socket disconnected:", socket.id);

      const userId = socketToUser.get(socket.id);
      socketToUser.delete(socket.id);

      if (!userId) return;

      // หา room ที่ user นี้อยู่
      const result = await pool.query(
        `SELECT room_id FROM group_room_members WHERE user_id = $1`,
        [userId]
      );

      for (const row of result.rows) {
        const roomId = row.room_id;

        // ลบออกจาก DB
        await pool.query(
          `DELETE FROM group_room_members WHERE room_id = $1 AND user_id = $2`,
          [roomId, userId]
        );

        // นับใหม่
        const countRes = await pool.query(
          `SELECT COUNT(*) FROM group_room_members WHERE room_id = $1`,
          [roomId]
        );

        const count = Number(countRes.rows[0].count);

        await pool.query(
          `UPDATE group_rooms SET members = $1 WHERE id = $2`,
          [count, roomId]
        );

        // sync frontend
        io.to(roomId).emit("groupChat:syncMembers");

        // ถ้าไม่มีคน → ลบห้อง
        if (count === 0) {
          await pool.query(`DELETE FROM group_rooms WHERE id = $1`, [roomId]);
          roomMembers.delete(roomId);
          console.log("🗑 ลบห้องอัตโนมัติ:", roomId);
        }
      }
    });
  });
}
