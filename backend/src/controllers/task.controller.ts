import { Response } from "express";
import { Task } from "../models/task.model";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";

export const getAllTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    sendSuccess(res, tasks);
  } catch (err) {
    sendError(res, "Failed to fetch tasks");
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const task = new Task({ ...req.body, userId });
    await task.save();
    sendSuccess(res, task, 201);
  } catch (err) {
    sendError(res, "Failed to create task", 400);
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const task = await Task.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) return sendError(res, "Task not found", 404);
    sendSuccess(res, task);
  } catch (err) {
    sendError(res, "Failed to update task");
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const task = await Task.findOneAndDelete({ _id: id, userId });
    if (!task) return sendError(res, "Task not found", 404);
    sendSuccess(res, { message: "Task deleted" });
  } catch (err) {
    sendError(res, "Failed to delete task");
  }
};

export const updateTaskStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { stage } = req.body;
    const update: Record<string, unknown> = { stage };
    if (stage === "done") update.completedAt = new Date();
    const task = await Task.findOneAndUpdate(
      { _id: id, userId },
      update,
      { new: true }
    );
    if (!task) return sendError(res, "Task not found", 404);
    sendSuccess(res, task);
  } catch (err) {
    sendError(res, "Failed to update stage");
  }
};

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const [total, urgent, overdue, done] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, priority: "urgent", stage: { $ne: "done" } }),
      Task.countDocuments({ userId, deadline: { $lt: new Date() }, stage: { $ne: "done" } }),
      Task.countDocuments({ userId, stage: "done" }),
    ]);
    const byStage = await Task.aggregate([
      { $match: { userId } },
      { $group: { _id: "$stage", count: { $sum: 1 } } }
    ]);
    sendSuccess(res, { total, urgent, overdue, done, byStage });
  } catch (err) {
    sendError(res, "Failed to fetch stats");
  }
};