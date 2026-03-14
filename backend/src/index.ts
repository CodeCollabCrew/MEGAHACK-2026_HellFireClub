import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import authRoutes      from "./routes/auth.routes";
import taskRoutes      from "./routes/task.routes";
import emailRoutes     from "./routes/email.routes";
import pipelineRoutes  from "./routes/pipeline.routes";
import insightRoutes   from "./routes/insight.routes";
import gmailRoutes     from "./routes/gmail.routes";
import excelRoutes     from "./routes/excel.routes";
import adminRoutes     from "./routes/admin.routes";
import workspaceRoutes from "./routes/workspace.routes";
import { startFollowUpCron } from "./services/followup.service";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000", /\.vercel\.app$/],
    credentials: true,
  })
);

// Stricter rate limit on auth routes (prevent brute force)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const apiLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 1000 });

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

// ─── Middleware ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// ─── Health ─────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => res.json({ status: "OK", service: "Smart Workspace API" }));
app.get("/health", (_req, res) => res.json({ status: "OK", timestamp: new Date().toISOString() }));

// ─── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes); // public (login/register/google)
app.use("/api/tasks", taskRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/pipeline", pipelineRoutes);
app.use("/api/insights", insightRoutes);
app.use("/api/gmail", gmailRoutes); // gmail OAuth stays separate
app.use("/api/excel", excelRoutes); // Excel analysis (attachments + upload)
app.use("/api/admin", adminRoutes);
app.use("/api/workspaces", workspaceRoutes);

// ─── Error Handling ─────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 API running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
  startFollowUpCron();
};

startServer().catch((err) => {
  console.error("❌ Failed to start:", err);
  process.exit(1);
});

export default app;