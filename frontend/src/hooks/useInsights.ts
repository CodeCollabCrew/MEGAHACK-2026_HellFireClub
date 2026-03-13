"use client";
import { useState, useCallback } from "react";
import { Insights } from "@/types";
import { insightsApi } from "@/lib/api";
import toast from "react-hot-toast";

export function useInsights() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await insightsApi.get();
      setInsights(res.data.data);
    } catch {
      toast.error("Failed to fetch insights");
    } finally {
      setLoading(false);
    }
  }, []);

  return { insights, loading, fetchInsights };
}
