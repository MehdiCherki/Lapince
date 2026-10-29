import { Router } from "express";
import { authMiddleware } from "../middlewares/access.controller.middleware.ts";
import {
  getAllCategory,
  getOneCategory,
} from "../controllers/category.controller.ts";

const router = Router();

router.get("/", authMiddleware, getAllCategory);
router.get("/:id", authMiddleware, getOneCategory);

export default router;
