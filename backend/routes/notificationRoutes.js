import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
    getNotificationCount,
    getNotifications,
    markNotificationRead,
    deleteNotification,     // ⭐ เพิ่ม
    clearNotifications      // ⭐ เพิ่ม
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/notifications/count", authRequired, getNotificationCount);
router.get("/notifications", authRequired, getNotifications);

router.post("/notifications/:id/read", authRequired, markNotificationRead);

// ⭐ ลบแจ้งเตือนรายตัว
router.delete("/notifications/:id", authRequired, deleteNotification);

// ⭐ ลบแจ้งเตือนทั้งหมด
router.delete("/notifications", authRequired, clearNotifications);

export default router;
