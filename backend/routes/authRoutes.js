// backend/routes/authRoutes.js
import express from "express";
import { register, login, googleLogin, getMe, updateMe } from "../controllers/authController.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

// สมัครสมาชิก
router.post("/register", register);

// เข้าสู่ระบบ (อีเมล/รหัสผ่าน)
router.post("/login", login);

// เข้าสู่ระบบด้วย Google OAuth
router.post("/google", googleLogin);

// ดูข้อมูลผู้ใช้ปัจจุบัน
router.get("/me", authRequired, getMe);

// แก้ไขข้อมูลผู้ใช้ปัจจุบัน
router.patch("/me", authRequired, updateMe);

export default router;
