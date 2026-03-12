import { Request, Response } from "express";
import { Email } from "../models/email.model";
import { Task } from "../models/task.model";
import { extractTasksFromEmail } from "../services/ai.service";
import { sendSuccess, sendError } from "../utils/response";

export const getAllEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return sendError(res, "userId required", 400);
    const emails = await Email.find({ userId }).sort({ receivedAt: -1 }).limit(50);
    sendSuccess(res, emails);
  } catch (err) {
    sendError(res, "Failed to fetch emails");
  }
};

export const loadMockEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return sendError(res, "userId required", 400);
    sendSuccess(res, { message: "Mock emails disabled in production", total: 0 });
  } catch (err) {
    sendError(res, "Failed to load mock emails");
  }
};

export const processEmail = async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;
    const userId = req.query.userId as string;
    if (!userId) return sendError(res, "userId required", 400);

    const email = await Email.findOne({ emailId, userId });
    if (!email) return sendError(res, "Email not found", 404);
    if (email.isProcessed) return sendSuccess(res, { message: "Already processed", email });

    const result = await extractTasksFromEmail(email.subject, email.body, email.from);

    const createdTasks = [];
    for (const extracted of result.tasks) {
      if (extracted.confidence >= 0.5) {
        const task = await Task.create({
          userId,
          title: extracted.title,
          description: extracted.description,
          priority: extracted.priority,
          deadline: extracted.deadline ? new Date(extracted.deadline) : null,
          sourceEmailId: email.emailId,
          sourceEmailSubject: email.subject,
          aiExtracted: true,
          aiConfidence: extracted.confidence,
          aiReasoning: extracted.reasoning,
          stage: "inbox",
        });
        createdTasks.push(task);
      }
    }

    email.isProcessed = true;
    email.hasActionItems = result.hasActionItems;
    email.extractedTaskIds = createdTasks.map((t) => t._id.toString());
    email.needsFollowUp = result.needsFollowUp;
    email.aiSummary = result.summary;
    email.isRead = true;
    await email.save();

    sendSuccess(res, { email, extraction: result, createdTasks });
  } catch (err) {
    sendError(res, "Failed to process email");
  }
};

export const processAllEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return sendError(res, "userId required", 400);

    const unprocessed = await Email.find({ userId, isProcessed: false });
    const results = [];

    for (const email of unprocessed) {
      const result = await extractTasksFromEmail(email.subject, email.body, email.from);
      const createdTasks = [];

      for (const extracted of result.tasks) {
        if (extracted.confidence >= 0.5) {
          const task = await Task.create({
            userId,
            title: extracted.title,
            description: extracted.description,
            priority: extracted.priority,
            deadline: extracted.deadline ? new Date(extracted.deadline) : null,
            sourceEmailId: email.emailId,
            sourceEmailSubject: email.subject,
            aiExtracted: true,
            aiConfidence: extracted.confidence,
            aiReasoning: extracted.reasoning,
            stage: "inbox",
          });
          createdTasks.push(task);
        }
      }

      email.isProcessed = true;
      email.hasActionItems = result.hasActionItems;
      email.extractedTaskIds = createdTasks.map((t) => t._id.toString());
      email.needsFollowUp = result.needsFollowUp;
      email.aiSummary = result.summary;
      await email.save();

      results.push({ emailId: email.emailId, subject: email.subject, tasksCreated: createdTasks.length });
      await new Promise((r) => setTimeout(r, 300));
    }

    sendSuccess(res, { processed: results.length, results });
  } catch (err) {
    sendError(res, "Failed to process emails");
  }
};