// backend/routes/chatRoutes.js
import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";

import { getOrCreateRoom } from "../controllers/chatController.js";
import { getMessages, sendMessage } from "../controllers/messageController.js";
import {
  getAllGroupRooms,
  joinPrivateGroupRoom,
  getGroupRoomMembers, 
  createGroupRoom, 
  joinPublicGroupRoom
} from "../controllers/groupChatController.js";

const router = express.Router();

// ขอ/สร้างห้องแชท 1-1
router.post("/get-or-create-room/:friendId", authRequired, getOrCreateRoom);

// โหลดข้อความของห้อง
router.get("/room/:roomId", authRequired, getMessages);

// ส่งข้อความ (REST)
router.post("/room/:roomId", authRequired, sendMessage);

// ==== GROUP CHAT ====
router.get("/group/rooms", authRequired, getAllGroupRooms);
router.get("/group/:roomId/members", authRequired, getGroupRoomMembers);
router.post("/group/create", authRequired, createGroupRoom);
router.post("/group/join/:roomId", authRequired, joinPrivateGroupRoom);
router.post("/group/join-public/:roomId", authRequired, joinPublicGroupRoom);

export default router;
