export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStage = "inbox" | "in_progress" | "review" | "done";

export interface Task {
  _id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  stage: TaskStage;
  deadline: string | null;
  sourceEmailId: string | null;
  sourceEmailSubject: string | null;
  aiExtracted: boolean;
  aiConfidence: number;
  aiReasoning: string;
  followUpSent: boolean;
  completedAt: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Email {
  _id: string;
  emailId: string;
  from: string;
  subject: string;
  body: string;
  snippet: string;
  receivedAt: string;
  isRead: boolean;
  isProcessed: boolean;
  hasActionItems: boolean;
  extractedTaskIds: string[];
  needsFollowUp: boolean;
  aiSummary: string;
}

export interface ExtractedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  deadline: string | null;
  confidence: number;
  reasoning: string;
}

export interface ExtractionResult {
  email: Email;
  extraction: {
    hasActionItems: boolean;
    tasks: ExtractedTask[];
    summary: string;
    needsFollowUp: boolean;
  };
  createdTasks: Task[];
}

export interface PipelineData {
  inbox: Task[];
  in_progress: Task[];
  review: Task[];
  done: Task[];
}

export interface Stats {
  total: number;
  urgent: number;
  overdue: number;
  done: number;
  byStage: { _id: string; count: number }[];
}

export interface Insights {
  tasksByStage: { _id: string; count: number }[];
  tasksByPriority: { _id: string; count: number }[];
  emailStats: { total: number; processed: number; withActions: number; needsFollowUp: number };
  recentCompletions: Task[];
  completionRate: number;
  weeklyTrend: { _id: string; count: number }[];
}
