import { Router, Request, Response } from "express";
import { User } from "../models/user.model";
import { sendSuccess, sendError } from "../utils/response";
import { log } from "../utils/logger";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return sendError(res, "All fields required", 400);
    try {
        const exists = await User.findOne({ email });
        if (exists) return sendError(res, "Email already registered", 409);
        const user = await User.create({ name, email, password, role: "user", status: "active", lastLogin: new Date() });
        await log({ action: "User Registered", type: "create", entity: "user", entityId: String(user._id), target: user.name, details: `Email: ${user.email} · Role: user`, performedBy: user.email });
        sendSuccess(res, { id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (err) { sendError(res, "Registration failed"); }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, "Email and password required", 400);
    try {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            await log({ action: "Login Failed", type: "error", entity: "user", target: email, details: "Invalid credentials", performedBy: email });
            return sendError(res, "Invalid credentials", 401);
        }
        if (user.status === "inactive") return sendError(res, "Account is inactive", 403);
        user.lastLogin = new Date();
        await user.save();
        await log({ action: "User Logged In", type: "login", entity: "user", entityId: String(user._id), target: user.name, details: `Email: ${user.email}`, performedBy: user.email });
        sendSuccess(res, { id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (err) { sendError(res, "Login failed"); }
});

// GET /api/auth/users
router.get("/users", async (_req: Request, res: Response) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        sendSuccess(res, users);
    } catch (err) { sendError(res, "Failed to fetch users"); }
});

// PATCH /api/auth/users/:id
router.patch("/users/:id", async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
        if (!user) return sendError(res, "User not found", 404);
        const changes = Object.entries(req.body).map(([k, v]) => `${k}: ${v}`).join(", ");
        await log({ action: "User Updated", type: "update", entity: "user", entityId: String(user._id), target: user.name, details: changes, performedBy: "admin" });
        sendSuccess(res, user);
    } catch (err) { sendError(res, "Failed to update user"); }
});

// DELETE /api/auth/users/:id
router.delete("/users/:id", async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        await User.findByIdAndDelete(req.params.id);
        await log({ action: "User Deleted", type: "delete", entity: "user", entityId: req.params.id, target: user?.name || req.params.id, details: `Email: ${user?.email || "unknown"}`, performedBy: "admin" });
        sendSuccess(res, { deleted: true });
    } catch (err) { sendError(res, "Failed to delete user"); }
});

// POST /api/auth/users — create from admin panel
router.post("/users", async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;
    if (!name || !email) return sendError(res, "Name and email required", 400);
    try {
        const exists = await User.findOne({ email });
        if (exists) return sendError(res, "Email already exists", 409);
        const user = await User.create({ name, email, password: password || "changeme123", role: role || "user", status: "active" });
        await log({ action: "User Created (Admin)", type: "create", entity: "user", entityId: String(user._id), target: user.name, details: `Email: ${user.email} · Role: ${user.role}`, performedBy: "admin" });
        sendSuccess(res, { id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (err) { sendError(res, "Failed to create user"); }
});

export default router;