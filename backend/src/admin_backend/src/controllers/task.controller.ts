import { Request, Response } from "express";
import { Task } from "../models/task.model";
import { sendSuccess, sendError } from "../utils/response";
import { log } from "../utils/logger";

export const getAllTasks = async (_req: Request, res: Response) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });
        sendSuccess(res, tasks);
    } catch (err) {
        sendError(res, "Failed to fetch tasks");
    }
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const task = new Task(req.body);
        await task.save();
        await log({ action: "Task Created", type: "create", entity: "task", entityId: String(task._id), target: task.title, details: `Priority: ${task.priority} · Stage: ${task.stage}`, performedBy: "user" });
        sendSuccess(res, task, 201);
    } catch (err) {
        sendError(res, "Failed to create task", 400);
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const task = await Task.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!task) return sendError(res, "Task not found", 404);
        const changes = Object.entries(req.body).map(([k, v]) => `${k}: ${v}`).join(", ");
        await log({ action: "Task Updated", type: "update", entity: "task", entityId: String(task._id), target: task.title, details: changes, performedBy: "user" });
        sendSuccess(res, task);
    } catch (err) {
        sendError(res, "Failed to update task");
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const task = await Task.findByIdAndDelete(id);
        if (!task) return sendError(res, "Task not found", 404);
        await log({ action: "Task Deleted", type: "delete", entity: "task", entityId: id, target: task.title, details: `Was in stage: ${task.stage}`, performedBy: "user" });
        sendSuccess(res, { message: "Task deleted" });
    } catch (err) {
        sendError(res, "Failed to delete task");
    }
};

export const updateTaskStage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { stage } = req.body;
        const update: Record<string, unknown> = { stage };
        if (stage === "done") update.completedAt = new Date();
        const task = await Task.findByIdAndUpdate(id, update, { new: true });
        if (!task) return sendError(res, "Task not found", 404);
        const actionLabel = stage === "done" ? "Task Completed" : "Task Stage Changed";
        const logType = stage === "done" ? "complete" : "update";
        await log({ action: actionLabel, type: logType, entity: "task", entityId: String(task._id), target: task.title, details: `Moved to: ${stage}`, performedBy: "user" });
        sendSuccess(res, task);
    } catch (err) {
        sendError(res, "Failed to update stage");
    }
};

export const getStats = async (_req: Request, res: Response) => {
    try {
        const [total, urgent, overdue, done] = await Promise.all([
            Task.countDocuments(),
            Task.countDocuments({ priority: "urgent", stage: { $ne: "done" } }),
            Task.countDocuments({ deadline: { $lt: new Date() }, stage: { $ne: "done" } }),
            Task.countDocuments({ stage: "done" }),
        ]);
        const byStage = await Task.aggregate([
            { $group: { _id: "$stage", count: { $sum: 1 } } }
        ]);
        sendSuccess(res, { total, urgent, overdue, done, byStage });
    } catch (err) {
        sendError(res, "Failed to fetch stats");
    }
};