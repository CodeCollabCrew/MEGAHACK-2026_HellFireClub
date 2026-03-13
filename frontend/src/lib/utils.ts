import { TaskPriority } from "@/types";
import { formatDistanceToNow, format, isAfter } from "date-fns";

export const priorityColors: Record<TaskPriority, string> = {
  urgent: "text-red-400 bg-red-400/10 border-red-400/30",
  high: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  low: "text-green-400 bg-green-400/10 border-green-400/30",
};

export const priorityDot: Record<TaskPriority, string> = {
  urgent: "bg-red-400",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-green-400",
};

export const stageLabels: Record<string, string> = {
  inbox: "Inbox",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export const formatDate = (date: string | null) => {
  if (!date) return null;
  return format(new Date(date), "MMM d");
};

export const timeAgo = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isOverdue = (deadline: string | null, stage: string) => {
  if (!deadline || stage === "done") return false;
  return isAfter(new Date(), new Date(deadline));
};

export const confidenceLabel = (c: number) => {
  if (c >= 0.9) return "Very High";
  if (c >= 0.7) return "High";
  if (c >= 0.5) return "Medium";
  return "Low";
};
