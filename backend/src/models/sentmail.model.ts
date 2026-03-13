import mongoose, { Schema, Document } from "mongoose";

export interface ISentMail extends Document {
  userId:    string;
  to:        string;
  subject:   string;
  body:      string;
  sentAt:    Date;
  emailId:   string; // original email this is a reply to
  threadId?: string;
}

const SentMailSchema = new Schema<ISentMail>({
  userId:   { type: String, required: true, index: true },
  to:       { type: String, required: true },
  subject:  { type: String, required: true },
  body:     { type: String, required: true },
  sentAt:   { type: Date, default: Date.now },
  emailId:  { type: String, required: true },
  threadId: { type: String },
});

export const SentMail = mongoose.model<ISentMail>("SentMail", SentMailSchema);