import { Router } from "express";
import { getMe, updateMe, deleteMe } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/access.controller.middleware.ts";

const router = Router();

router.get("/me", authMiddleware, getMe);
router.patch("/me", authMiddleware, updateMe);
router.delete("/me", authMiddleware, deleteMe);

export default router;
