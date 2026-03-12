"use client";
import { PipelineData, TaskStage } from "@/types";
import StageColumn from "./StageColumn";
import { Spinner } from "@/components/ui/Spinner";

interface KanbanBoardProps {
  pipeline: PipelineData | null;
  onMove: (taskId: string, stage: TaskStage) => void;
  onDelete: (taskId: string) => void;
  loading: boolean;
}

const STAGES: TaskStage[] = ["inbox", "in_progress", "review", "done"];

export default function KanbanBoard({ pipeline, onMove, onDelete, loading }: KanbanBoardProps) {
  if (loading || !pipeline) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {STAGES.map((stage) => (
        <StageColumn
          key={stage}
          stage={stage}
          tasks={pipeline[stage] ?? []}
          onMove={onMove}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
