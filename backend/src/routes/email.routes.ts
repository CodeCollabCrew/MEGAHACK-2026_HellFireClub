// ── email.routes.ts ───────────────────────────────────────────────────────────
import { Router } from "express";
import {
  getAllEmails, loadMockEmails,
  processEmail, processAllEmails
} from "../controllers/email.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware); // ✅ all routes protected

router.get("/",                    getAllEmails);
router.post("/mock",               loadMockEmails);
router.post("/process-all",        processAllEmails);
router.post("/:emailId/process",   processEmail);

export default router;