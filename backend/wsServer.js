// backend/wsServer.js
import { Server } from "socket.io";
import { pool } from "./db.js";
import { filterBadWords } from "./utils/textModerationRegex.js";
import { aiModerate } from "./utils/textModerationAI.js";

let onlineUsers = new Map();
let roomMembers = new Map();

// ==== RANDOM CHAT ====
let randomWaiting = [];
let randomRooms = {};

function getSimilarity(a1, a2) {
  // ถ้าไม่ใช่ array -> แปลงเป็น array ว่าง
  if (!Array.isArray(a1)) a1 = [];
  if (!Array.isArray(a2)) a2 = [];

  // normalize ให้ตัวพิมพ์เล็กหมด (กันตัวสะกดต่างกัน)
  a1 = a1.map(x => String(x).toLowerCase());
  a2 = a2.map(x => String(x).toLowerCase());

  return a1.filter(x => a2.includes(x)).length;
}


function findRandomMatch(user) {
  return randomWaiting.find(u =>
    u.userId !== user.userId &&                 // ไม่ใช่ตัวเอง
    u.country === user.country &&               // ประเทศต้องตรงกัน
    getSimilarity(u.interests, user.interests) >= 1 &&  // สนใจเหมือนกัน ≥ 1
    !(u.friends || []).includes(user.userId) && // ไม่เป็นเพื่อนกัน (ฝั่ง A)
    !(user.friends || []).includes(u.userId) && // ไม่เป็นเพื่อนกัน (ฝั่ง B)
    u.isOnline === true                         // อีกฝ่ายต้องออนไลน์
  );
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

        // แจ้งเตือนถ้าอีกฝ่ายไม่ได้เปิดห้อง
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

      // 🛑 ป้องกันซ้ำด้วย socketId และ userId ทั้งคู่
      const exists = randomWaiting.find(
        u => u.userId === userData.userId || u.socketId === socket.id
      );
      if (exists) {
        console.log("User already waiting, skip.");
        return;
      }

      randomWaiting.push(userData);
      console.log("Queue =", randomWaiting.map(u => u.userId));

      const partner = findRandomMatch(userData);

      if (!partner) {
        socket.emit("randomChat:waiting");
        return;
      }

      // ⭐ เพิ่มการเช็กว่ามีคนอื่น match partner ไปแล้วหรือยัง
      if (partner.socketId === undefined) return;

      const roomId = "random_" + Date.now();

      randomRooms[roomId] = {
        users: [userData.userId, partner.userId],
        sockets: [socket.id, partner.socketId],
      };

      removeFromRandomQueue(userData.userId);
      removeFromRandomQueue(partner.userId);

      socket.join(roomId);
      io.sockets.sockets.get(partner.socketId)?.join(roomId);

      io.to(roomId).emit("randomChat:matched", {
        roomId,
        users: randomRooms[roomId].users,
      });

      console.log("RANDOM MATCH => Room:", roomId);
    });

    /* =============================
    RANDOM CHAT: LEAVE QUEUE
============================= */
    socket.on("randomChat:leaveQueue", () => {
      // 1) ลบจากคิวรอ
      randomWaiting = randomWaiting.filter(u => u.socketId !== socket.id);

      // 2) ถ้าบังเอิญอยู่ในห้องที่กำลังจับคู่ → ต้องแจ้งจบด้วย
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
        sender: msg.sender,
        fileUrl: msg.fileUrl || null,
        type: msg.type || "text",
        time: msg.time || Date.now(),
      });
    });

    /* =============================
        RANDOM CHAT: LEAVE
    ============================== */
    socket.on("randomChat:leave", (roomId) => {
      if (randomRooms[roomId]) {
        io.to(roomId).emit("randomChat:end");
        delete randomRooms[roomId];
      }
    });

    /* =============================
      RANDOM CHAT: REJOIN
============================= */
    socket.on("randomChat:rejoin", ({ roomId, userId }) => {
      console.log("User rejoined room:", roomId);

      if (!randomRooms[roomId]) return;

      socket.join(roomId);

      const room = randomRooms[roomId];

      // หาตำแหน่ง user ในห้อง
      const idx = room.users.indexOf(userId);
      if (idx !== -1) {
        room.sockets[idx] = socket.id;
      }
    });

    /* =============================
          DISCONNECT
    ============================== */
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);

      for (const [uid, sid] of onlineUsers.entries()) {
        if (sid === socket.id) onlineUsers.delete(uid);
      }

      for (const [roomId, set] of roomMembers.entries()) {
        set.delete(socket.id);
      }

      randomWaiting = randomWaiting.filter(u => u.socketId !== socket.id);

      setTimeout(() => {
        for (const roomId in randomRooms) {
          const room = randomRooms[roomId];

          if (room.sockets.includes(socket.id)) {

            const stillActive = room.sockets.some(sid =>
              io.sockets.sockets.get(sid)
            );

            if (stillActive) {
              console.log("User reconnected, room stays:", roomId);
              continue;
            }

            io.to(roomId).emit("randomChat:end");
            delete randomRooms[roomId];
            console.log("Room closed:", roomId);
          }
        }
      }, 5000);
    });
  });
}
