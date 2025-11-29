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
  getFriendStatus,
  getFriendDetail
} from "../controllers/friendController.js";

import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ==========================================================
   STATIC ROUTES (ต้องมาก่อน)
========================================================== */
router.get("/", authRequired, getFriends);
router.get("/requests", authRequired, getRequests);
router.get("/sent", authRequired, getPendingSentRequests);
router.get("/search", authRequired, searchFriends);
router.get("/blocked", authRequired, getBlockedUsers);

/* ==========================================================
   FRIEND ACTIONS (เป็น static เช่นกัน)
========================================================== */
router.post("/request/:id", authRequired, sendFriendRequest);
router.post("/accept/:id", authRequired, acceptFriendRequest);
router.post("/decline/:id", authRequired, declineFriendRequest);

router.put("/:id/favorite", authRequired, toggleFavoriteFriend);
router.post("/:id/block", authRequired, blockUser);
router.delete("/:id/block", authRequired, unblockUser);

/* ==========================================================
   ⚠ DYNAMIC ROUTES — ต้องอยู่ท้ายสุดเสมอ
========================================================== */
router.get("/:id/status", authRequired, getFriendStatus);   // ต้องมาก่อน
router.get("/:id", authRequired, getFriendDetail);          // detail
router.delete("/:id", authRequired, deleteFriend);          // delete

export default router;
