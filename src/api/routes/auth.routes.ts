import { Router } from "express";
import { register, login, refresh, logoutUser } from "../controllers/auth.controller.js";
import { verifyEmail } from "../controllers/email.controller.js";
import { authMiddleware } from "../middlewares/access.controller.middleware.ts";
import { loginRateLimit } from "../middlewares/rate-limit.middleware.js";


const router = Router();

router.get("/verify-email", verifyEmail);
router.post("/register", register);
router.post("/login", loginRateLimit, login);
router.post("/refresh", refresh); 
router.post("/logout", authMiddleware, logoutUser);

export default router;