import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: "user" | "admin";
    status: "active" | "inactive";
    lastLogin: Date | null;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
        lastLogin: { type: Date, default: null },
    },
    { timestamps: true }
);

UserSchema.index({ email: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);