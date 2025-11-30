// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

import http from "http";
import { Server } from "socket.io";

// Routes
import userRoutes from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import meRoutes from "./routes/meRoutes.js";
import avatarRoutes from "./routes/avatarRoutes.js";
import itemsRoutes from "./routes/itemsRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();
const app = express();

// STATIC PATH
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cors());
app.use(express.json());

// TEST
app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json({ message: "Backend is running", time: result.rows[0].now });
});

// ROUTES
app.use("/api/users", userRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);
app.use("/api/avatars", avatarRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);

// SOCKET.IO SERVER
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("⚡ Socket connected:", socket.id);

  // Join room
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
  });

  // รับข้อความแบบ real-time
  socket.on("send_message", async (data) => {
    try {
      let { room_id, sender_id, text, type, file_url } = data;
      sender_id = String(sender_id);

      if (!room_id || !sender_id) return;

      const result = await pool.query(
        `
      INSERT INTO messages (room_id, sender_id, text, type, file_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
        [
          room_id,
          sender_id,
          text || null,
          type || "text",
          file_url || null,
        ]
      );

      const msg = result.rows[0];

      // ⭐ Format ให้เหมือน REST API
      const formatted = {
        id: msg.id,
        room_id: msg.room_id,
        sender_id: msg.sender_id,
        text: msg.text,
        type: msg.type,
        file_url: msg.file_url,
        created_at: msg.created_at,
      };

      io.to(room_id).emit("receive_message", formatted);

    } catch (err) {
      console.error("WS send_message error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// START SERVER
const PORT = process.env.PORT || 7000;
server.listen(PORT, () => console.log(`Backend + Socket running on ${PORT}`));
