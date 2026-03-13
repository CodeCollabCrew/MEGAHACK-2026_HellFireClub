import mongoose, { Schema, Document } from "mongoose";

export interface IEmail extends Document {
  userId: string;
  emailId: string;
  from: string;
  subject: string;
  body: string;
  snippet: string;
  receivedAt: Date;
  isRead: boolean;
  isProcessed: boolean;
  hasActionItems: boolean;
  extractedTaskIds: string[];
  needsFollowUp: boolean;
  aiSummary: string;
  createdAt: Date;
}

const EmailSchema = new Schema<IEmail>(
  {
    userId: { type: String, required: true, index: true },
    emailId: { type: String, required: true },
    from: { type: String, required: true },
    subject: { type: String, default: "(No Subject)" },
    body: { type: String, default: "" },
    snippet: { type: String, default: "" },
    receivedAt: { type: Date, required: true },
    isRead: { type: Boolean, default: false },
    isProcessed: { type: Boolean, default: false },
    hasActionItems: { type: Boolean, default: false },
    extractedTaskIds: [{ type: String }],
    needsFollowUp: { type: Boolean, default: false },
    aiSummary: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compound unique index: same emailId can exist for different users
EmailSchema.index({ userId: 1, emailId: 1 }, { unique: true });
EmailSchema.index({ receivedAt: -1 });
EmailSchema.index({ isProcessed: 1 });

export const Email = mongoose.model<IEmail>("Email", EmailSchema);