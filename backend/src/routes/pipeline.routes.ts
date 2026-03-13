import { Router } from "express";
import { Task } from "../models/task.model";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// Get all tasks grouped by stage (for Kanban board)
router.get("/", async (_req, res) => {
  try {
    const tasks = await Task.find().sort({ priority: -1, createdAt: -1 });
    const stages = { inbox: [] as typeof tasks, in_progress: [] as typeof tasks, review: [] as typeof tasks, done: [] as typeof tasks };
    for (const task of tasks) {
      if (stages[task.stage]) stages[task.stage].push(task);
    }
    sendSuccess(res, stages);
  } catch {
    sendError(res, "Failed to fetch pipeline");
  }
});

export default router;
