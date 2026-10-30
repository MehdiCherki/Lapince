import { Router } from "express";
import {
  getAlerts,
  getAlertById,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
} from "../controllers/alert.controller.ts";

import { authMiddleware } from "../middlewares/auth.middleware.ts";

const router = Router();

router.get("/", authMiddleware, getAlerts);
router.get("/:id", authMiddleware, getAlertById);
router.patch("/:id/read", authMiddleware, markAlertAsRead);
router.patch("/read-all", authMiddleware, markAllAlertsAsRead);
router.delete("/:id", authMiddleware, deleteAlert);

export default router;
