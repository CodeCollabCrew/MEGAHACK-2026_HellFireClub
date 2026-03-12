import { Request, Response } from "express";
import { Email } from "../models/email.model";
import { Task } from "../models/task.model";
import { extractTasksFromEmail } from "../services/ai.service";
import { MOCK_EMAILS } from "../utils/mockData";
import { sendSuccess, sendError } from "../utils/response";

export const getAllEmails = async (_req: Request, res: Response) => {
  try {
    const emails = await Email.find().sort({ receivedAt: -1 }).limit(50);
    sendSuccess(res, emails);
  } catch (err) {
    sendError(res, "Failed to fetch emails");
  }
};

// Load mock emails into DB (for demo / when Gmail not configured)
export const loadMockEmails = async (_req: Request, res: Response) => {
  try {
    let loaded = 0;
    for (const mock of MOCK_EMAILS) {
      const exists = await Email.findOne({ emailId: mock.emailId });
      if (!exists) {
        await Email.create(mock);
        loaded++;
      }
    }
    sendSuccess(res, { message: `Loaded ${loaded} mock emails`, total: MOCK_EMAILS.length });
  } catch (err) {
    sendError(res, "Failed to load mock emails");
  }
};

// Process a single email through AI extraction
export const processEmail = async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;
    const email = await Email.findOne({ emailId });
    if (!email) return sendError(res, "Email not found", 404);
    if (email.isProcessed) {
      return sendSuccess(res, { message: "Already processed", email });
    }

    const result = await extractTasksFromEmail(email.subject, email.body, email.from);

    const createdTasks = [];
    for (const extracted of result.tasks) {
      if (extracted.confidence >= 0.5) {
        const task = await Task.create({
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

    sendSuccess(res, {
      email,
      extraction: result,
      createdTasks,
    });
  } catch (err) {
    sendError(res, "Failed to process email");
  }
};

// Process ALL unprocessed emails
export const processAllEmails = async (_req: Request, res: Response) => {
  try {
    const unprocessed = await Email.find({ isProcessed: false });
    const results = [];

    for (const email of unprocessed) {
      const result = await extractTasksFromEmail(email.subject, email.body, email.from);
      const createdTasks = [];

      for (const extracted of result.tasks) {
        if (extracted.confidence >= 0.5) {
          const task = await Task.create({
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
      await new Promise((r) => setTimeout(r, 300)); // Rate limit buffer
    }

    sendSuccess(res, { processed: results.length, results });
  } catch (err) {
    sendError(res, "Failed to process emails");
  }
};
