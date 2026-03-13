import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
    action: string;
    type: "create" | "update" | "delete" | "login" | "error" | "complete";
    entity: "user" | "workspace" | "task" | "email" | "system";
    entityId: string;
    target: string;
    details: string;
    performedBy: string;
    createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
    {
        action: { type: String, required: true },
        type: { type: String, enum: ["create", "update", "delete", "login", "error", "complete"], default: "create" },
        entity: { type: String, enum: ["user", "workspace", "task", "email", "system"], default: "system" },
        entityId: { type: String, default: "" },
        target: { type: String, default: "" },
        details: { type: String, default: "" },
        performedBy: { type: String, default: "system" },
    },
    { timestamps: true }
);

ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);