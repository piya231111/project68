import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// GET /api/avatars - ดึงอวตาร์ทั้งหมด
router.get("/", (req, res) => {
  try {
    const folderPath = path.resolve("uploads/avatars");
    const files = fs.readdirSync(folderPath);

    const avatars = files.map((filename, i) => ({
      id: i + 1,
      name: filename.replace(/\.[^/.]+$/, ""),
      image_url: `http://localhost:7000/uploads/avatars/${filename}`,
    }));

    res.json({ avatars });
  } catch (err) {
    console.error("Error reading avatars:", err);
    res.status(500).json({ error: "Cannot load avatars" });
  }
});

// GET /api/avatars/:id - ดึงอวตาร์ตาม id
router.get("/:id", (req, res) => {
  try {
    const folderPath = path.resolve("uploads/avatars");
    const files = fs.readdirSync(folderPath);
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id < 1 || id > files.length) {
      return res.status(404).json({ error: "Avatar not found" });
    }

    const filename = files[id - 1];
    const avatar = {
      id,
      name: filename.replace(/\.[^/.]+$/, ""),
      image_url: `http://localhost:7000/uploads/avatars/${filename}`,
    };

    res.json(avatar);
  } catch (err) {
    console.error("Error reading avatar:", err);
    res.status(500).json({ error: "Cannot load avatar" });
  }
});

export default router;
