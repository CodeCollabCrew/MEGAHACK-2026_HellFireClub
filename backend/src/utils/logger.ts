import { ActivityLog } from "../models/activitylog.model";

interface LogParams {
    action: string;
    type?: "create" | "update" | "delete" | "login" | "error" | "complete";
    entity?: "user" | "workspace" | "task" | "email" | "system";
    entityId?: string;
    target: string;
    details?: string;
    performedBy?: string;
}

export const log = async (params: LogParams): Promise<void> => {
    try {
        await ActivityLog.create({
            action: params.action,
            type: params.type || "create",
            entity: params.entity || "system",
            entityId: params.entityId || "",
            target: params.target,
            details: params.details || "",
            performedBy: params.performedBy || "system",
        });
    } catch (err) {
        // Never crash the main request if logging fails
        console.error("Logger error:", err);
    }
};