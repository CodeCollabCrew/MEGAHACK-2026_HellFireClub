"use client";
import { useState, useCallback } from "react";
import { PipelineData, TaskStage } from "@/types";
import { pipelineApi } from "@/lib/api";
import toast from "react-hot-toast";

export function usePipeline() {
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pipelineApi.get();
      setPipeline(res.data.data);
    } catch {
      toast.error("Failed to fetch pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  const moveTask = useCallback(async (taskId: string, stage: TaskStage) => {
    try {
      await pipelineApi.moveTask(taskId, { stage });
      await fetchPipeline();
      toast.success("Task moved!");
    } catch {
      toast.error("Failed to move task");
    }
  }, [fetchPipeline]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await pipelineApi.deleteTask(taskId);
      await fetchPipeline();
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  }, [fetchPipeline]);

  return { pipeline, loading, fetchPipeline, moveTask, deleteTask };
}