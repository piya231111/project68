import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
    getNotificationCount,
    getNotifications,
    markNotificationRead
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/notifications/count", authRequired, getNotificationCount);
router.get("/notifications", authRequired, getNotifications);
router.post("/notifications/:id/read", authRequired, markNotificationRead);

export default router;
