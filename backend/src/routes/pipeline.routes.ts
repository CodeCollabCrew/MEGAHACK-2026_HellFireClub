import { Router } from "express";
import { Task } from "../models/task.model";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// Get all tasks grouped by stage (for Kanban board) — filtered by userId
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return sendError(res, "userId required", 400);

    const tasks = await Task.find({ userId }).sort({ priority: -1, createdAt: -1 });
    const stages = {
      inbox:       [] as typeof tasks,
      in_progress: [] as typeof tasks,
      review:      [] as typeof tasks,
      done:        [] as typeof tasks,
    };
    for (const task of tasks) {
      if (stages[task.stage]) stages[task.stage].push(task);
    }
    sendSuccess(res, stages);
  } catch {
    sendError(res, "Failed to fetch pipeline");
  }
});

// Move task to different stage
router.put("/:id/move", async (req, res) => {
  try {
    const { userId } = req.query;
    const { stage } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId },
      { stage },
      { new: true }
    );
    if (!task) return sendError(res, "Task not found", 404);
    sendSuccess(res, task);
  } catch {
    sendError(res, "Failed to move task");
  }
});

// Delete task
router.delete("/:id", async (req, res) => {
  try {
    const { userId } = req.query;
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId });
    if (!task) return sendError(res, "Task not found", 404);
    sendSuccess(res, { deleted: true });
  } catch {
    sendError(res, "Failed to delete task");
  }
});

export default router;