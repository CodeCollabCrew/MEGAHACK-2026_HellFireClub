import { Router } from "express";
import { Task } from "../models/task.model";
import { sendSuccess, sendError } from "../utils/response";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// ALL routes protected — userId comes from JWT, not query param
router.use(authMiddleware);

// Get all tasks grouped by stage
router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
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
router.put("/:id/move", async (req: AuthRequest, res) => {
  try {
    const { stage } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },  // userId from JWT
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
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,   // userId from JWT
    });
    if (!task) return sendError(res, "Task not found", 404);
    sendSuccess(res, { deleted: true });
  } catch {
    sendError(res, "Failed to delete task");
  }
});

export default router;