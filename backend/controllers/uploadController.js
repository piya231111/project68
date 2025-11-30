import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// สร้างโฟลเดอร์อัพโหลด หากยังไม่มี
const uploadDir = path.join(__dirname, "..", "uploads", "chat");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created folder:", uploadDir);
}

// ตั้งค่า storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + "_" + file.originalname;
    cb(null, filename);
  },
});

export const upload = multer({ storage });

// Controller ส่งไฟล์กลับ
export const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filename = req.file.filename;
  const fileUrl = `http://localhost:7000/uploads/chat/${filename}`;

  res.json({ url: fileUrl });
};
