// backend/routes/groupChatRoutes.js
import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  getAllGroupRooms,
  joinPrivateGroupRoom,
  getGroupRoomMembers
} from "../controllers/groupChatController.js";


const router = express.Router();

router.get("/rooms", authRequired, getAllGroupRooms);
router.get("/:roomId/members", authRequired, getGroupRoomMembers);
router.post("/join/:roomId", authRequired, joinPrivateGroupRoom);

export default router;
