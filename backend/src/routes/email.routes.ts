import { Router } from "express";
import {
  getAllEmails, loadMockEmails,
  processEmail, processAllEmails
} from "../controllers/email.controller";

const router = Router();
router.get("/", getAllEmails);
router.post("/mock", loadMockEmails);
router.post("/process-all", processAllEmails);
router.post("/:emailId/process", processEmail);

export default router;
