import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  password?: string; // optional — Google OAuth users won't have one
  googleId?: string; // Google OAuth identifier
  avatar?: string;
  isGuest: boolean;
  role: "user" | "admin";
  status: "active" | "inactive";
  lastLogin: Date | null;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, select: false }, // never returned by default
    googleId: { type: String, sparse: true },
    avatar: { type: String },
    isGuest: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });

// Hash password before save
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password helper
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);