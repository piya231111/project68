// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

import http from "http";

// Import WebSocket Setup
import { setupWebSocket } from "./wsServer.js";

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
import groupChatRoutes from "./routes/groupChatRoutes.js";

dotenv.config();
const app = express();

// STATIC PATH
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cors());
app.use(express.json());

// TEST ROUTE
app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json({ message: "Backend is running", time: result.rows[0].now });
});

// API ROUTES
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
app.use("/api/chat/group", groupChatRoutes);


// CREATE HTTP SERVER
const server = http.createServer(app);

// ⭐ SETUP WEBSOCKET HERE (ไม่มี logic ซ้ำ)
setupWebSocket(server);

// START SERVER
const PORT = process.env.PORT || 7000;
server.listen(PORT, () =>
  console.log(`Backend + Socket.IO running on port ${PORT}`)
);
