// backend/wsServer.js
import { Server } from "socket.io";
import { pool } from "./db.js";
import { censorText } from "./utils/textModeration.js";

let onlineUsers = new Map();
let roomMembers = new Map();

let socketToUser = new Map();

// ===== helper สำหรับ preview ข้อความแจ้งเตือน =====
const previewText = (text, type, max = 40) => {
  if (text && text.trim()) {
    return text.length > max ? text.slice(0, max) + "…" : text;
  }
  if (type === "image") return "ส่งรูปภาพ";
  if (type === "gif") return "ส่ง GIF";
  if (type === "video") return "ส่งวิดีโอ";
  return "ส่งไฟล์";
};

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
  const uid = String(userId);
  randomWaiting = randomWaiting.filter(u => String(u.userId) !== uid);
}

function cleanupUserSocket(socket) {
  const userId = socketToUser.get(socket.id);
  socketToUser.delete(socket.id);

  if (userId) {
    // ลบ online mapping ที่ชี้มาที่ socket นี้
    const currentSid = onlineUsers.get(String(userId));
    if (currentSid === socket.id) {
      onlineUsers.delete(String(userId));
    }

    // ลบออกจากคิวสุ่ม
    randomWaiting = randomWaiting.filter(u => String(u.userId) !== String(userId));
  }

  // ปิดห้องสุ่มที่เกี่ยวข้องกับ socket นี้
  for (const roomId in randomRooms) {
    if (randomRooms[roomId].sockets.includes(socket.id)) {
      ioInstance?.to(roomId).emit("randomChat:end");
      socket.leave(roomId);
      delete randomRooms[roomId];
    }
  }
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
    socket.on("online", (userId, cb) => {
      if (!userId) return cb?.({ ok: false });

      const uid = String(userId);

      const oldSid = onlineUsers.get(uid);
      if (oldSid && oldSid !== socket.id) {
        socketToUser.delete(oldSid);
        io.sockets.sockets.get(oldSid)?.disconnect(true);
      }

      socketToUser.set(socket.id, uid);
      onlineUsers.set(uid, socket.id);

      console.log(`User ${uid} online via socket ${socket.id}`);

      cb?.({ ok: true, socketId: socket.id }); // สำคัญ
    });

    socket.on("offline", () => {
      cleanupUserSocket(socket);
    });

    /* =============================
        NORMAL CHAT: JOIN ROOM
    ============================== */
    socket.on("join_room", ({ roomId }) => {
      const uid = socketToUser.get(socket.id);
      if (!roomId || !uid) return;

      socket.join(roomId);

      if (!roomMembers.has(roomId)) roomMembers.set(roomId, new Set());
      roomMembers.get(roomId).add(String(uid));

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

        //1) เอา sender_id จริงจาก socket (กันค้าง/กันปลอม)
        const realSenderId = socketToUser.get(socket.id);
        if (!realSenderId) {
          return safeCallback({ ok: false, error: "unauthorized (no socket user)" });
        }
        sender_id = String(realSenderId);

        if (!room_id) {
          return safeCallback({ ok: false, error: "missing room_id" });
        }

        if (type === "text") {
          text = censorText(text);
        }

        //(แนะนำเพิ่ม) ตรวจว่า sender เป็นสมาชิกห้องนี้จริง กันยิงห้องคนอื่น
        const roomDataCheck = await pool.query(
          `SELECT user1_id, user2_id FROM chat_rooms WHERE id = $1`,
          [room_id]
        );
        if (!roomDataCheck.rows[0]) {
          return safeCallback({ ok: false, error: "room not found" });
        }
        const { user1_id, user2_id } = roomDataCheck.rows[0];
        const isMember =
          String(sender_id) === String(user1_id) || String(sender_id) === String(user2_id);
        if (!isMember) {
          return safeCallback({ ok: false, error: "forbidden (not room member)" });
        }

        // 1) INSERT message
        const insertResult = await pool.query(
          `
      INSERT INTO messages (room_id, sender_id, text, type, file_url)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id
      `,
          [room_id, sender_id, text || null, type, file_url || null]
        );

        const messageId = insertResult.rows[0].id;

        // 2) LOAD message + sender + profile
        const fullResult = await pool.query(
          `
      SELECT 
        m.*,
        u.display_name AS sender_name,
        u.country,
        p.is_online,
        p.avatar_id,
        p.item_id,
        p.interests
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE m.id = $1
      `,
          [messageId]
        );

        const socketMsg = fullResult.rows[0];

        // 3) หา receiverId (ใช้ sender_id ที่ override แล้ว)
        const receiverId =
          String(sender_id) === String(user1_id) ? user2_id : user1_id;

        // 4) ส่งให้ทุกคนที่อยู่ใน room
        io.to(String(room_id)).emit("receive_message", socketMsg);

        // 5) ถ้า receiver ยังไม่อยู่ใน room → ส่งตรง socket
        const members = roomMembers.get(room_id);
        const isReceiverInRoom = members && members.has(String(receiverId));

        if (!isReceiverInRoom) {
          let receiverSocketId = null;

          for (const [sid, uid] of socketToUser.entries()) {
            if (uid === String(receiverId)) {
              receiverSocketId = sid;
              break;
            }
          }

          if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive_message", socketMsg);
          }
        }

        safeCallback({ ok: true, msg: socketMsg });

        // 6) notification
        if (!isReceiverInRoom) {
          await pool.query(
            `
        INSERT INTO notifications (user_id, type, title, body, friend_id, is_read)
        VALUES ($1, 'chat_message', $2, $3, $4, false)
        `,
            [
              receiverId,
              "ข้อความใหม่จากเพื่อน",
              `${socketMsg.sender_name}: ${previewText(socketMsg.text, socketMsg.type)}`,
              sender_id,
            ]
          );
        }
      } catch (err) {
        console.error("send_message ERR:", err);
        callback?.({ ok: false, error: err.message });
      }
    });

    socket.on("leave_room", ({ roomId, userId }) => {
      if (!roomMembers.has(roomId)) return;

      roomMembers.get(roomId).delete(String(userId));

      if (roomMembers.get(roomId).size === 0) {
        roomMembers.delete(roomId);
      }
    });

    /* =============================
        RANDOM CHAT: JOIN QUEUE
    ============================== */
    socket.on("randomChat:joinQueue", (user) => {
      const uid = String(user.userId ?? user.id);   // รองรับทั้ง userId / id
      const userData = {
        ...user,
        userId: uid,
        socketId: socket.id,
        isOnline: true,
      };

      const exists = randomWaiting.find(
        (u) => String(u.userId) === uid || u.socketId === socket.id
      );
      if (exists) return;

      randomWaiting.push(userData);
      console.log("Queue =", randomWaiting.map((u) => u.userId));

      //DEBUG: ดูคิวทั้งหมด
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
          if (!onlineUsers.has(String(a.userId)) || !onlineUsers.has(String(b.userId))) continue;

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
      console.log("MATCH FOUND!", matchedA.userId, matchedB.userId);

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
          socket.leave(roomId);
          delete randomRooms[roomId];
        }
      }

      console.log(`User left queue → socket: ${socket.id}`);
    });

    /* =============================
        RANDOM CHAT: SEND MESSAGE
    ============================== */
    socket.on("randomChat:message", (msg) => {
      const type = msg.type || "text";

      if (
        (type === "image" || type === "video" || type === "gif") &&
        !msg.fileUrl
      ) {
        return;
      }

      let text = msg.text || null;
      if (type === "text" && text) {
        text = censorText(text);
      }

      io.to(msg.roomId).emit("randomChat:message", {
        sender: String(msg.sender),
        text,
        fileUrl: msg.fileUrl ?? null,
        type,
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

      // อย่าเช็กจาก group_rooms.members (เสี่ยง race)
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

      // insert DB แบบกันซ้ำ
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

      // อัปเดต member list ทุกคน
      io.to(roomId).emit("groupChat:syncMembers");

      // แสดงข้อความ "เข้าห้อง" เฉพาะเข้าใหม่จริง
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

      socket.join(roomId);

      if (!roomMembers.has(roomId)) {
        roomMembers.set(roomId, new Set());
      }
      roomMembers.get(roomId).add(socket.id);

      await pool.query(
        `
        INSERT INTO group_room_members (room_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
        [roomId, user.id]
      );

      console.log(`(INVITE) User ${user.id} joined GroupRoom ${roomId}`);

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
      const type = msg.type || "text";

      if (
        (type === "image" || type === "video" || type === "gif") &&
        !msg.fileUrl
      ) {
        return;
      }

      let text = msg.text || null;
      if (type === "text" && text) {
        text = censorText(text);
      }

      io.to(roomId).emit("groupChat:message", {
        sender: msg.sender,
        name: msg.name,
        avatar_id: msg.avatar_id,
        item_id: msg.item_id,
        text,
        fileUrl: msg.fileUrl ?? null,
        type,
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

      // ค่อย sync หลัง DB เสร็จ
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

      cleanupUserSocket(socket);

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
          console.log("ลบห้องอัตโนมัติ:", roomId);
        }
      }
    });
  });
}
