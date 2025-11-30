import express from "express";
import { upload, uploadFile } from "../controllers/uploadController.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/chat-file", authRequired, upload.single("file"), uploadFile);

export default router;
