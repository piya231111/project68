// backend/routes/groupChatRoutes.js
import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  getAllGroupRooms,
  getGroupRoomMembers,
  createGroupRoom,
  joinPrivateGroupRoom,
  joinPublicGroupRoom,
  leaveGroupRoom
} from "../controllers/groupChatController.js";

const router = express.Router();

router.get("/rooms", authRequired, getAllGroupRooms);
router.get("/:roomId/members", authRequired, getGroupRoomMembers);
router.post("/create", authRequired, createGroupRoom);
router.post("/join/:roomId", authRequired, joinPrivateGroupRoom);
router.post("/join-public/:roomId", authRequired, joinPublicGroupRoom);
router.post("/leave/:roomId", authRequired, leaveGroupRoom);

export default router;
