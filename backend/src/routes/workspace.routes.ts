import { Router, Request, Response } from "express";
import { Workspace } from "../models/workspace.model";
import { sendSuccess, sendError } from "../utils/response";
import { log } from "../utils/logger";

const router = Router();

// GET /api/workspaces
router.get("/", async (_req: Request, res: Response) => {
    try {
        const workspaces = await Workspace.find().sort({ createdAt: -1 });
        sendSuccess(res, workspaces);
    } catch (err) { sendError(res, "Failed to fetch workspaces"); }
});

// POST /api/workspaces
router.post("/", async (req: Request, res: Response) => {
    const { name, description, owner } = req.body;
    if (!name) return sendError(res, "Workspace name is required", 400);
    try {
        const workspace = await Workspace.create({ name, description, owner, members: owner ? [owner] : [], status: "active" });
        await log({ action: "Workspace Created", type: "create", entity: "workspace", entityId: String(workspace._id), target: workspace.name, details: `Owner: ${owner || "unset"} · ${description || "No description"}`, performedBy: owner || "admin" });
        sendSuccess(res, workspace);
    } catch (err) { sendError(res, "Failed to create workspace"); }
});

// PATCH /api/workspaces/:id
router.patch("/:id", async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!workspace) return sendError(res, "Workspace not found", 404);
        const changes = Object.entries(req.body).map(([k, v]) => `${k}: ${v}`).join(", ");
        await log({ action: "Workspace Updated", type: "update", entity: "workspace", entityId: String(workspace._id), target: workspace.name, details: changes, performedBy: "admin" });
        sendSuccess(res, workspace);
    } catch (err) { sendError(res, "Failed to update workspace"); }
});

// DELETE /api/workspaces/:id
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        await Workspace.findByIdAndDelete(req.params.id);
        await log({ action: "Workspace Deleted", type: "delete", entity: "workspace", entityId: req.params.id, target: workspace?.name || req.params.id, details: `Owner: ${workspace?.owner || "unknown"}`, performedBy: "admin" });
        sendSuccess(res, { deleted: true });
    } catch (err) { sendError(res, "Failed to delete workspace"); }
});

export default router;