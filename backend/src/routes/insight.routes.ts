import { Router } from "express";
import { getInsights } from "../controllers/insight.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getInsights); // ✅ authMiddleware add kiya

export default router;