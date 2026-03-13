import { Router } from "express";
import { getInsights } from "../controllers/insight.controller";

const router = Router();
router.get("/", getInsights);

export default router;
