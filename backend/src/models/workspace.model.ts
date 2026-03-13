import mongoose, { Schema, Document } from "mongoose";

export interface IWorkspace extends Document {
    name: string;
    description: string;
    owner: string;
    members: string[];
    status: "active" | "inactive";
    createdAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        owner: { type: String, default: "" },
        members: [{ type: String }],
        status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    { timestamps: true }
);

export const Workspace = mongoose.model<IWorkspace>("Workspace", WorkspaceSchema);