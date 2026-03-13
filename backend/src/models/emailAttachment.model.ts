import mongoose, { Schema, Document } from "mongoose";

const EXCEL_MIMES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];

export interface IEmailAttachment extends Document {
  userId: string;
  emailId: string;
  attachmentId: string;
  filename: string;
  mimeType: string;
  size?: number;
  createdAt: Date;
}

const EmailAttachmentSchema = new Schema<IEmailAttachment>(
  {
    userId:      { type: String, required: true, index: true },
    emailId:     { type: String, required: true, index: true },
    attachmentId: { type: String, required: true },
    filename:    { type: String, required: true },
    mimeType:    { type: String, required: true },
    size:        { type: Number },
  },
  { timestamps: true }
);

EmailAttachmentSchema.index({ userId: 1, emailId: 1, attachmentId: 1 }, { unique: true });

export function isExcelMime(mime: string): boolean {
  return EXCEL_MIMES.includes(mime?.toLowerCase() || "");
}

export function isExcelFilename(name: string): boolean {
  const lower = (name || "").toLowerCase();
  return lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv");
}

export const EmailAttachment = mongoose.model<IEmailAttachment>("EmailAttachment", EmailAttachmentSchema);
