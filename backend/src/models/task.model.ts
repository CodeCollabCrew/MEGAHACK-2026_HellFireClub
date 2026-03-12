import mongoose, { Schema, Document } from "mongoose";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStage = "inbox" | "in_progress" | "review" | "done";

export interface ITask extends Document {
  title: string;
  description: string;
  priority: TaskPriority;
  stage: TaskStage;
  deadline: Date | null;
  sourceEmailId: string | null;
  sourceEmailSubject: string | null;
  tags: string[];
  aiExtracted: boolean;
  aiConfidence: number;
  aiReasoning: string;
  followUpSent: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: "" },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    stage: { type: String, enum: ["inbox", "in_progress", "review", "done"], default: "inbox" },
    deadline: { type: Date, default: null },
    sourceEmailId: { type: String, default: null },
    sourceEmailSubject: { type: String, default: null },
    tags: [{ type: String }],
    aiExtracted: { type: Boolean, default: false },
    aiConfidence: { type: Number, min: 0, max: 1, default: 0 },
    aiReasoning: { type: String, default: "" },
    followUpSent: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

TaskSchema.index({ stage: 1, priority: 1 });
TaskSchema.index({ deadline: 1 });
TaskSchema.index({ createdAt: -1 });

TaskSchema.virtual("isOverdue").get(function () {
  if (!this.deadline || this.stage === "done") return false;
  return new Date() > this.deadline;
});

export const Task = mongoose.model<ITask>("Task", TaskSchema);
