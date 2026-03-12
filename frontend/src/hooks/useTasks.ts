"use client";
import { useState, useCallback } from "react";
import { Task } from "@/types";
import { tasksApi } from "@/lib/api";
import toast from "react-hot-toast";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<{ total: number; urgent: number; overdue: number; done: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, statsRes] = await Promise.all([
        tasksApi.getAll(),
        tasksApi.getStats(),
      ]);
      setTasks(tasksRes.data.data || []);
      setStats(statsRes.data.data || null);
    } catch {
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await tasksApi.delete(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  }, []);

  const moveTask = useCallback(async (id: string, stage: string) => {
    try {
      await tasksApi.updateStage(id, stage);
      await fetchTasks();
      toast.success("Task moved!");
    } catch {
      toast.error("Failed to move task");
    }
  }, [fetchTasks]);

  return { tasks, stats, loading, fetchTasks, deleteTask, moveTask };
}
