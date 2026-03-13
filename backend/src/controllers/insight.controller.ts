import { Response } from "express";
import { Task } from "../models/task.model";
import { Email } from "../models/email.model";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";

export const getInsights = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // ✅ userId se ObjectId banao aggregate ke liye
    const { Types } = await import("mongoose");
    const userObjId = new Types.ObjectId(userId);

    const [tasksByStage, tasksByPriority, emailStats, recentTasks, completionRate] = await Promise.all([
      // ✅ Sirf is user ke tasks
      Task.aggregate([
        { $match: { userId: userObjId } },
        { $group: { _id: "$stage", count: { $sum: 1 } } },
      ]),

      Task.aggregate([
        { $match: { userId: userObjId } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),

      // ✅ Sirf is user ki emails
      Email.aggregate([
        { $match: { userId: userObjId } },
        {
          $group: {
            _id: null,
            total:         { $sum: 1 },
            processed:     { $sum: { $cond: ["$isProcessed",    1, 0] } },
            withActions:   { $sum: { $cond: ["$hasActionItems", 1, 0] } },
            needsFollowUp: { $sum: { $cond: ["$needsFollowUp",  1, 0] } },
          },
        },
      ]),

      Task.find({ userId, stage: "done" })
        .sort({ completedAt: -1 })
        .limit(5)
        .select("title priority completedAt"),

      Task.aggregate([
        { $match: { userId: userObjId } },
        {
          $group: {
            _id:   null,
            total: { $sum: 1 },
            done:  { $sum: { $cond: [{ $eq: ["$stage", "done"] }, 1, 0] } },
          },
        },
      ]),
    ]);

    // Weekly trend — sirf is user ka
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyTrend = await Task.aggregate([
      { $match: { userId: userObjId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id:   { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const rate = completionRate[0]
      ? Math.round((completionRate[0].done / completionRate[0].total) * 100)
      : 0;

    sendSuccess(res, {
      tasksByStage,
      tasksByPriority,
      emailStats:       emailStats[0] || { total: 0, processed: 0, withActions: 0, needsFollowUp: 0 },
      recentCompletions: recentTasks,
      completionRate:   rate,
      weeklyTrend,
    });
  } catch (err) {
    sendError(res, "Failed to fetch insights");
  }
};