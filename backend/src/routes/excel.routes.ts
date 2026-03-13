import { Router, Response } from "express";
import multer from "multer";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { sendSuccess, sendError } from "../utils/response";
import {
  getExcelAttachmentsForUser,
  fetchGmailAttachment,
  analyzeExcelBuffer,
} from "../services/excel.service";
import { Email } from "../models/email.model";
import { EmailAttachment } from "../models/emailAttachment.model";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    const ok =
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      name.endsWith(".csv") ||
      file.mimetype?.includes("spreadsheet") ||
      file.mimetype === "text/csv";
    cb(null, !!ok);
  },
});

// List Excel attachments from synced emails
router.get("/attachments", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const list = await getExcelAttachmentsForUser(userId);
    sendSuccess(res, list);
  } catch (err) {
    console.error("Excel attachments list error:", err);
    sendError(res, "Failed to list Excel attachments");
  }
});

// Analyze Excel: either from email attachment or file upload
router.post(
  "/analyze",
  authMiddleware,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      let buffer: Buffer;

      if (req.file?.buffer) {
        buffer = req.file.buffer;
      } else {
        const { emailId, attachmentId } = req.body || {};
        if (!emailId || !attachmentId) {
          return sendError(res, "Provide either a file upload or emailId + attachmentId", 400);
        }

        const att = await EmailAttachment.findOne({ userId, emailId, attachmentId });
        if (!att) return sendError(res, "Attachment not found", 404);

        const emailDoc = await Email.findOne({
          userId,
          accessToken: { $exists: true, $ne: "" },
        }).select("accessToken");
        const token = (emailDoc as any)?.accessToken;
        if (!token) return sendError(res, "Gmail not connected. Connect Gmail first.", 401);

        buffer = await fetchGmailAttachment(token, emailId, attachmentId);
      }

      const result = await analyzeExcelBuffer(buffer);
      sendSuccess(res, result);
    } catch (err) {
      console.error("Excel analyze error:", err);
      sendError(res, err instanceof Error ? err.message : "Failed to analyze Excel");
    }
  }
);

export default router;
