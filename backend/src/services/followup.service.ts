import cron from "node-cron";
import { Task } from "../models/task.model";

export const startFollowUpCron = () => {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    console.log("🔄 Running follow-up check...");
    try {
      const overdueTasks = await Task.find({
        stage: { $in: ["inbox", "in_progress"] },
        deadline: { $lt: new Date() },
        followUpSent: false,
      });

      for (const task of overdueTasks) {
        task.followUpSent = true;
        await task.save();
        console.log(`📬 Follow-up flagged for task: ${task.title}`);
      }
      console.log(`✅ Follow-up check done. Flagged: ${overdueTasks.length}`);
    } catch (err) {
      console.error("Follow-up cron error:", err);
    }
  });
  console.log("⏰ Follow-up cron started");
};
