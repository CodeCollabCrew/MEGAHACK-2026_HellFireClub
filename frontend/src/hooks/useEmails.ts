"use client";
import { useState, useCallback } from "react";
import { Email, ExtractionResult } from "@/types";
import { emailsApi } from "@/lib/api";
import toast from "react-hot-toast";

export function useEmails() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingEmailId, setProcessingEmailId] = useState<string | null>(null);
  const [processingAll, setProcessingAll] = useState(false);
  const [lastResult, setLastResult] = useState<ExtractionResult | null>(null);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await emailsApi.getAll();
      setEmails(res.data.data || []);
    } catch {
      toast.error("Failed to fetch emails");
    } finally {
      setLoading(false);
    }
  }, []);

  const processOne = useCallback(async (email: Email): Promise<ExtractionResult | null> => {
    setProcessingEmailId(email.emailId);
    const t = toast.loading(`Analyzing: ${email.subject}`);
    try {
      const res = await emailsApi.processOne(email.emailId);
      const result: ExtractionResult = res.data.data;
      setLastResult(result);
      await fetchEmails();
      toast.success(`${result.createdTasks.length} task(s) extracted!`, { id: t });
      return result;
    } catch {
      toast.error("Failed to process email", { id: t });
      return null;
    } finally {
      setProcessingEmailId(null);
    }
  }, [fetchEmails]);

  const processAll = useCallback(async () => {
    const pending = emails.filter((e) => !e.isProcessed).length;
    if (pending === 0) { toast("All emails already processed!"); return; }
    setProcessingAll(true);
    const t = toast.loading(`AI is analyzing ${pending} emails...`);
    try {
      await emailsApi.processAll();
      await fetchEmails();
      toast.success("All emails processed!", { id: t });
    } catch {
      toast.error("Processing failed", { id: t });
    } finally {
      setProcessingAll(false);
    }
  }, [emails, fetchEmails]);

  return {
    emails, loading, processingEmailId, processingAll, lastResult, setLastResult,
    fetchEmails, processOne, processAll,
  };
}
