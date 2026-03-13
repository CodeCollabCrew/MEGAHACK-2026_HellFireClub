import { Router, Request, Response } from "express";
import { Task } from "../models/task.model";
import { Email } from "../models/email.model";
import { User } from "../models/user.model";
import { Workspace } from "../models/workspace.model";
import { ActivityLog } from "../models/activitylog.model";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// GET /api/admin/stats — dashboard summary stats
router.get("/stats", async (_req: Request, res: Response) => {
    try {
        const [
            totalTasks,
            completedTasks,
            totalEmails,
            processedEmails,
            tasksByStage,
            tasksByPriority,
            recentTasks,
            totalUsers,
            activeUsers,
            totalWorkspaces,
        ] = await Promise.all([
            Task.countDocuments(),
            Task.countDocuments({ stage: "done" }),
            Email.countDocuments(),
            Email.countDocuments({ isProcessed: true }),
            Task.aggregate([{ $group: { _id: "$stage", count: { $sum: 1 } } }]),
            Task.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
            Task.find().sort({ createdAt: -1 }).limit(5).select("title priority stage createdAt deadline"),
            User.countDocuments(),
            User.countDocuments({ status: "active" }),
            Workspace.countDocuments(),
        ]);

        // Weekly trend (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weeklyTrend = await Task.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        // Tasks created this month vs last month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const [thisMonthTasks, lastMonthTasks, thisWeekEmails] = await Promise.all([
            Task.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Task.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),
            Email.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        ]);

        sendSuccess(res, {
            totalUsers,
            activeUsers,
            totalTasks,
            completedTasks,
            totalWorkspaces,
            pendingTasks: totalTasks - completedTasks,
            completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
            totalEmails,
            processedEmails,
            thisMonthTasks,
            lastMonthTasks,
            thisWeekEmails,
            tasksByStage,
            tasksByPriority,
            recentTasks,
            weeklyTrend,
        });
    } catch (err) {
        sendError(res, "Failed to fetch admin stats");
    }
});

// GET /api/admin/workspaces — workspace analytics derived from emails/tasks
router.get("/workspaces", async (_req: Request, res: Response) => {
    try {
        // Derive "workspaces" from unique email senders (domains as teams)
        const emailDomains = await Email.aggregate([
            {
                $addFields: {
                    domain: {
                        $arrayElemAt: [{ $split: [{ $arrayElemAt: [{ $split: ["$from", "@"] }, 1] }, ">"] }, 0]
                    }
                }
            },
            { $group: { _id: "$domain", emailCount: { $sum: 1 }, lastEmail: { $max: "$receivedAt" } } },
            { $match: { _id: { $ne: null, $exists: true } } },
            { $sort: { emailCount: -1 } },
            { $limit: 8 },
        ]);

        // Tasks by stage for workspace analytics
        const taskStages = await Task.aggregate([
            { $group: { _id: "$stage", count: { $sum: 1 } } }
        ]);

        const stageMap: Record<string, number> = {};
        taskStages.forEach(s => { stageMap[s._id] = s.count; });

        const workspaces = emailDomains.map((d, i) => ({
            id: i + 1,
            name: d._id || "Unknown",
            emailCount: d.emailCount,
            lastActivity: d.lastEmail,
            // distribute task counts proportionally across workspaces
            tasks: {
                inbox: Math.round((stageMap["inbox"] || 0) * (d.emailCount / (emailDomains.reduce((a, x) => a + x.emailCount, 0) || 1))),
                in_progress: Math.round((stageMap["in_progress"] || 0) * (d.emailCount / (emailDomains.reduce((a, x) => a + x.emailCount, 0) || 1))),
                review: Math.round((stageMap["review"] || 0) * (d.emailCount / (emailDomains.reduce((a, x) => a + x.emailCount, 0) || 1))),
                done: Math.round((stageMap["done"] || 0) * (d.emailCount / (emailDomains.reduce((a, x) => a + x.emailCount, 0) || 1))),
            }
        }));

        sendSuccess(res, { workspaces, tasksByStage: taskStages });
    } catch (err) {
        sendError(res, "Failed to fetch workspace data");
    }
});

// GET /api/admin/activity — real activity logs from ActivityLog collection
router.get("/activity", async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = parseInt(req.query.skip as string) || 0;
        const filter: Record<string, unknown> = {};
        if (req.query.type) filter.type = req.query.type;
        if (req.query.entity) filter.entity = req.query.entity;

        const [logs, total] = await Promise.all([
            ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            ActivityLog.countDocuments(filter),
        ]);

        sendSuccess(res, { logs, total });
    } catch (err) {
        sendError(res, "Failed to fetch activity logs");
    }
});

export default router;