import mongoose, { Schema, Document } from "mongoose";

export type ExcelSourceType = "email" | "upload";

export interface IExcelAnalysis extends Document {
  userId: string;
  sourceType: ExcelSourceType;
  emailId?: string | null;
  attachmentId?: string | null;
  filename: string;
  mimeType?: string | null;
  size?: number | null;
  summary: string;
  insights: string[];
  recommendations: string[];
  columns: string[];
  rowCount: number;
  preview: Record<string, unknown>[];
  createdAt: Date;
  updatedAt: Date;
}

const ExcelAnalysisSchema = new Schema<IExcelAnalysis>(
  {
    userId: { type: String, required: true, index: true },
    sourceType: { type: String, enum: ["email", "upload"], required: true },
    emailId: { type: String, default: null },
    attachmentId: { type: String, default: null },
    filename: { type: String, required: true },
    mimeType: { type: String, default: null },
    size: { type: Number, default: null },
    summary: { type: String, default: "" },
    insights: [{ type: String }],
    recommendations: [{ type: String }],
    columns: [{ type: String }],
    rowCount: { type: Number, default: 0 },
    preview: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true }
);

ExcelAnalysisSchema.index({ userId: 1, createdAt: -1 });
ExcelAnalysisSchema.index({ userId: 1, sourceType: 1 });
ExcelAnalysisSchema.index({ userId: 1, emailId: 1, attachmentId: 1 });

export const ExcelAnalysis = mongoose.model<IExcelAnalysis>("ExcelAnalysis", ExcelAnalysisSchema);

