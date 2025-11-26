// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

// Routes
import userRoutes from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import meRoutes from "./routes/meRoutes.js";
import avatarRoutes from "./routes/avatarRoutes.js";
import itemsRoutes from "./routes/itemsRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";

dotenv.config();
const app = express();

// --- FIX STATIC PATH ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// เสิร์ฟไฟล์ uploads ให้ถูกต้อง
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(cors());
app.use(express.json());

// Test route
app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json({ message: "Project68 backend is running", time: result.rows[0].now });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);
app.use("/api/avatars", avatarRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/friends", friendRoutes);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
