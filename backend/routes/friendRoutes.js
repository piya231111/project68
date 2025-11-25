// backend/routes/friendRoutes.js
import express from "express";
import {
  getFriends,
  getRequests,
  searchFriends,
  sendFriendRequest,
  acceptFriendRequest,
  getPendingSentRequests,
  declineFriendRequest,
  deleteFriend,
  toggleFavoriteFriend,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getFriendStatus
} from "../controllers/friendController.js";

import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authRequired, getFriends);
router.get("/requests", authRequired, getRequests);
router.get("/sent", authRequired, getPendingSentRequests);
router.get("/search", authRequired, searchFriends);

// ⭐ ดึงรายชื่อผู้ใช้ที่ถูกบล็อก
router.get("/blocked", authRequired, getBlockedUsers);

router.post("/request/:id", authRequired, sendFriendRequest);
router.post("/accept/:id", authRequired, acceptFriendRequest);
router.post("/decline/:id", authRequired, declineFriendRequest);

router.delete("/:id", authRequired, deleteFriend);
router.put("/:id/favorite", authRequired, toggleFavoriteFriend);

router.post("/:id/block", authRequired, blockUser);
router.delete("/:id/block", authRequired, unblockUser);

router.get("/:id/status", authRequired, getFriendStatus);

export default router;
