import { Router } from "express";
import {
  register,
  login,
  refresh,
  logoutUser,
} from "../controllers/auth.controller.ts";
import { verifyEmail } from "../controllers/email.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import {
  loginRateLimit,
  registerRateLimit,
  refreshRateLimit,
} from "../middlewares/rate-limit.middleware.ts";

const router = Router();

router.get("/verify-email", verifyEmail);
router.post("/register", registerRateLimit, register);
router.post("/login", loginRateLimit, login);
router.post("/refresh", refreshRateLimit, refresh);
router.post("/logout", authMiddleware, logoutUser);

export default router;
