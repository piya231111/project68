import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// ✅ GET /api/items - ดึง item ทั้งหมด
router.get("/", (req, res) => {
  try {
    const folderPath = path.resolve("uploads/items");
    const files = fs.readdirSync(folderPath);

    const items = files.map((filename, i) => ({
      id: i + 1,
      name: filename.replace(/\.[^/.]+$/, ""),
      imageUrl: `http://localhost:7000/uploads/items/${filename}`,
    }));

    res.json({ items });
  } catch (err) {
    console.error("Error reading items:", err);
    res.status(500).json({ error: "Cannot load items" });
  }
});

// ✅ GET /api/items/:id - ดึง item ตาม id
router.get("/:id", (req, res) => {
  try {
    const folderPath = path.resolve("uploads/items");
    const files = fs.readdirSync(folderPath);
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id < 1 || id > files.length) {
      return res.status(404).json({ error: "Item not found" });
    }

    const filename = files[id - 1];
    const item = {
      id,
      name: filename.replace(/\.[^/.]+$/, ""),
      imageUrl: `http://localhost:7000/uploads/items/${filename}`,
    };

    res.json(item);
  } catch (err) {
    console.error("Error reading item:", err);
    res.status(500).json({ error: "Cannot load item" });
  }
});

export default router;
