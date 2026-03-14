"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  AlertTriangle,
  ChevronRight,
  LogIn,
  Zap,
  Database,
  Globe,
  RefreshCw,
  Lock,
} from "lucide-react";
import axios from "axios";

import { useTasks }    from "@/hooks/useTasks";
import { useEmails }   from "@/hooks/useEmails";
import { usePipeline } from "@/hooks/usePipeline";
import { useInsights } from "@/hooks/useInsights";

import Sidebar            from "@/components/dashboard/Sidebar";
import Header             from "@/components/dashboard/Header";
import StatsBar           from "@/components/dashboard/StatsBar";
import CreateTaskModal    from "@/components/dashboard/CreateTaskModal";
import RecentTasksList    from "@/components/dashboard/RecentTasksList";
import EmailList          from "@/components/email/EmailList";
import EmailViewer        from "@/components/email/EmailViewer";
import ExtractionPanel    from "@/components/email/ExtractionPanel";
import SentMailsList      from "@/components/email/SentMailsList";
import KanbanBoard        from "@/components/pipeline/KanbanBoard";
import PriorityChart      from "@/components/insights/PriorityChart";
import WeeklyTrendChart   from "@/components/insights/WeeklyTrendChart";
import EmailStatsCard     from "@/components/insights/EmailStatsCard";
import CompletionRingCard from "@/components/insights/CompletionRingCard";
import ExcelAnalysisPanel from "@/components/excel/ExcelAnalysisPanel";
import ChartTooltip from "@/components/ui/ChartTooltip";
import AntigravityBackground from "@/components/ui/AntigravityBackground";
import { FullPageLoader } from "@/components/ui/Spinner";
import { Email }          from "@/types";
import { isOverdue }      from "@/lib/utils";
import api, { clearToken, saveToken, isDevBypassToken } from "@/lib/api";

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API = BASE_URL.endsWith("/api") ? BASE_URL : `${BASE_URL}/api`;

type Tab = "dashboard" | "emails" | "pipeline" | "insights" | "excel";
type EmailTab = "inbox" | "sent";

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab]             = useState<Tab>("dashboard");
  const [emailTab, setEmailTab]   = useState<EmailTab>("inbox");
  const [modal, setModal]         = useState(false);
  const [selEmail, setSelEmail]   = useState<Email | null>(null);
  const [booting, setBooting]     = useState(true);
  const [user, setUser]           = useState<{ name: string; email?: string; isGuest?: boolean } | null>(null);
  const [sentMails, setSentMails] = useState<any[]>([]);
  const [sysStats, setSysStats] = useState({
    dbStatus: "Connected",
    apiLatency: "...",
    uptime: "...",
    activeSessions: 0
  });

  const { tasks, stats, loading: tLoad, fetchTasks, moveTask }                                                       = useTasks();
  const { emails, processingEmailId, processingAll, lastResult, setLastResult, fetchEmails, processOne, processAll } = useEmails();
  const { pipeline, loading: pLoad, fetchPipeline, moveTask: movePipeTask, deleteTask: delPipeTask }                 = usePipeline();
  const { insights, loading: iLoad, fetchInsights }                                                                  = useInsights();

  const fetchSentMails = useCallback(async () => {
    try {
      const res = await api.get("/api/gmail/sent");
      setSentMails(res.data.data || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/health`);
      if (res.data.success) {
        setSysStats(res.data.data);
      }
    } catch (e) {
      console.error("Health sync failed", e);
    }
  }, []);

  // ── Boot ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");
      const nameParam = params.get("name");

      if (urlToken) {
        saveToken(urlToken);
        if (nameParam) {
          localStorage.setItem(
            "axon_user",
            JSON.stringify({ name: decodeURIComponent(nameParam) })
          );
        }
        window.history.replaceState({}, "", "/dashboard");
      }

      const storedToken = urlToken || localStorage.getItem("axon_token");
      if (!storedToken) {
        router.push("/login");
        return;
      }

      if (isDevBypassToken(storedToken)) {
        const stored = localStorage.getItem("axon_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUser({
              name: parsed.name ?? "Dev User",
              email: parsed.email,
              isGuest: parsed.isGuest ?? false,
            });
          } catch {
            setUser({ name: "Dev User", isGuest: false });
          }
        } else {
          setUser({ name: "Dev User", isGuest: false });
        }
      } else {
        try {
          const res = await api.get("/api/auth/me");
          const u = res.data.data;
          const userData = {
            name: u.name,
            email: u.email,
            isGuest: u.isGuest ?? false,
          };
          setUser(userData);
          localStorage.setItem("axon_user", JSON.stringify(userData));
        } catch {
          clearToken();
          router.push("/login");
          return;
        }
      }

      Promise.all([fetchTasks(), fetchEmails(), fetchHealth()]).finally(() =>
        setBooting(false)
      );
    })();
  }, [fetchTasks, fetchEmails, fetchHealth, router]);

  useEffect(() => {
    if (tab === "pipeline") fetchPipeline();
    if (tab === "insights") fetchInsights();
    if (tab === "emails")   fetchSentMails();
  }, [tab, fetchPipeline, fetchInsights, fetchSentMails]);

  useEffect(() => {
    if (emailTab === "sent") fetchSentMails();
  }, [emailTab, fetchSentMails]);

  const handleProcessEmail = async (email: Email) => {
    const r = await processOne(email);
    if (r) { setSelEmail(email); fetchTasks(); }
  };

  const selectEmail = (email: Email) => {
    setSelEmail(email);
    setLastResult(null);
  };

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  const unread      = emails.filter(e => !e.isRead).length;
  const unprocessed = emails.filter(e => !e.isProcessed).length;
  const urgentTasks = tasks.filter(t => t.priority === "urgent" && t.stage !== "done");
  const overdue     = tasks.filter(t => isOverdue(t.deadline, t.stage));

  if (booting) return <FullPageLoader message="Loading workspace…" />;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning.";
    if (hour < 17) return "Good afternoon.";
    return "Good evening.";
  })();
  const statusSubtitle = urgentTasks.length ? `${urgentTasks.length} urgent · ${overdue.length} overdue` : "All clear ✓";

  return (
    <>
      <style>{`
        .dash-main { margin-left: 220px; }
        @media (max-width: 1024px) {
          .dash-main { padding-left: 20px; padding-right: 20px; }
          .four-col  { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 768px) {
          .dash-main { margin-left: 0; padding-top: 56px; padding-left: 16px; padding-right: 16px; }
          .two-col   { grid-template-columns: 1fr !important; }
          .three-col { grid-template-columns: 1fr !important; }
          .four-col  { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .email-grid{ grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
        .dash-content { padding: 32px 40px; }
        @media (max-width: 768px) {
          .dash-content { padding: 20px 16px; }
        }
        @media (max-width: 480px) {
          .dash-content { padding: 16px; }
        }
        .email-subtab { background:none; border:none; cursor:pointer; padding:6px 14px; font-size:12px; font-family:'Space Mono',monospace; border-bottom:2px solid transparent; color:var(--text-secondary); transition:all 0.15s; }
        .email-subtab.active { color:var(--cocoa); border-bottom-color:var(--cocoa); }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "var(--ivory)", position: "relative" }}>
        <AntigravityBackground />
        <Sidebar
          activeTab={tab} onTabChange={setTab}
          unreadCount={unread} unprocessedCount={unprocessed}
          onProcessAll={processAll} processingEmails={processingAll}
          onEmailsImported={fetchEmails}
          user={user}
          onLogout={handleLogout}
        />

        <main className="dash-main" style={{ flex: 1, minHeight: "100vh", width: "100%", position: "relative" }}>
          {/* ── DASHBOARD (full-screen AI workspace) ───────────────────────── */}
          {tab === "dashboard" && (
            <div className="dash-content" style={{ padding: "32px 40px", minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
              {/* Header Section — premium greeting */}
              <motion.div
                style={{ marginBottom: "32px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div>
                  <h1 style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 400, lineHeight: 1.15, color: "var(--text-primary)" }}>
                    {greeting}
                  </h1>
                  <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "10px" }}>{statusSubtitle}</p>
                </div>
                <motion.button
                  onClick={() => Promise.all([fetchTasks(), fetchEmails()])}
                  disabled={tLoad}
                  className="btn-outline"
                  style={{ padding: "8px 16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", borderRadius: "12px", opacity: tLoad ? 0.5 : 1 }}
                  whileHover={tLoad ? {} : { scale: 1.03 }}
                  whileTap={tLoad ? {} : { scale: 0.98 }}
                >
                  <RefreshCw size={14} className={tLoad ? "anim-spin" : ""} />
                  Refresh
                </motion.button>
              </motion.div>

              {/* Guest banner */}
              {user?.isGuest && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ padding: "14px 18px", borderRadius: "16px", background: "var(--punch-bg)", border: "1px solid var(--punch-bdr)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--cocoa)" }}>Browsing as guest</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>Sign in to save data & connect Gmail</div>
                  </div>
                  <button onClick={() => router.push("/login")} className="btn-punch"
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "13px", whiteSpace: "nowrap", borderRadius: "12px", background: "var(--cocoa)", color: "#fff" }}>
                    <LogIn size={13} /> Sign in
                  </button>
                </motion.div>
              )}

              {/* Infrastructure Health — gradient blocks, pulse & loading state */}
              <motion.div
                className="card"
                style={{
                  padding: "22px",
                  borderRadius: "18px",
                  border: "1px solid var(--border-soft)",
                  marginBottom: "24px",
                  background: "var(--white)",
                  boxShadow: "0 1px 3px rgba(74,52,40,0.06)",
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.35 }}
                whileHover={{ y: -4, boxShadow: "0 12px 28px rgba(74,52,40,0.1)", transition: { duration: 0.2 } }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Zap size={14} color="var(--cocoa)" /> Infrastructure Health
                  </h3>
                  <motion.button
                    onClick={fetchHealth}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontFamily: "'Space Mono',monospace" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw size={10} /> Sync
                  </motion.button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }} className="four-col">
                  {[
                    { label: "Database", value: sysStats.dbStatus, icon: Database, isConnected: sysStats.dbStatus === "Connected" },
                    { label: "Latency", value: sysStats.apiLatency, icon: RefreshCw, isLoading: sysStats.apiLatency === "..." },
                    { label: "Uptime", value: sysStats.uptime, icon: Globe },
                    { label: "Sessions", value: sysStats.activeSessions, icon: Lock },
                  ].map((s, i) => (
                    <motion.div
                      key={i}
                      style={{
                        padding: "14px",
                        background: s.label === "Database" || s.label === "Latency"
                          ? "linear-gradient(135deg, #4A3428 0%, #6B4A3A 100%)"
                          : "var(--surface)",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: s.label === "Database" || s.label === "Latency" ? "#FFFFF5" : undefined,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 + i * 0.04 }}
                    >
                      <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <s.icon size={14} style={{ color: s.label === "Database" || s.label === "Latency" ? "rgba(255,255,245,0.9)" : "var(--text-secondary)", flexShrink: 0 }} />
                        {s.label === "Database" && s.isConnected && (
                          <motion.span
                            style={{ position: "absolute", right: -4, top: -2, width: "6px", height: "6px", borderRadius: "50%", background: "#34D17A" }}
                            className="anim-pulse-green"
                          />
                        )}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.02em", opacity: s.label === "Database" || s.label === "Latency" ? 0.85 : 1, color: s.label === "Database" || s.label === "Latency" ? "rgba(255,255,245,0.9)" : "var(--text-secondary)" }}>{s.label}</p>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: s.label === "Database" && s.isConnected ? "#34D17A" : s.label === "Database" || s.label === "Latency" ? "#FFFFF5" : "var(--text-primary)" }}>
                          {s.label === "Latency" && s.isLoading ? (
                            <motion.span animate={{ opacity: [0.5, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>...</motion.span>
                          ) : (
                            String(s.value)
                          )}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Stats Cards Row */}
              <motion.div style={{ marginBottom: "28px" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
                <StatsBar stats={stats} overdueTasks={overdue} />
              </motion.div>

              {urgentTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{ marginBottom: "24px", padding: "14px 16px", borderRadius: "16px", background: "rgba(204,34,0,0.06)", border: "1px solid rgba(204,34,0,0.18)", borderLeft: "4px solid var(--red)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <AlertTriangle size={14} style={{ color: "var(--red)" }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--red)" }}>
                      {urgentTasks.length} urgent task{urgentTasks.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  {urgentTasks.slice(0, 3).map(t => (
                    <div key={t._id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "3px 0", fontSize: "13px" }}>
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--red)", flexShrink: 0 }} />
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>{t.title}</span>
                      <button onClick={() => setTab("pipeline")}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)", fontSize: "11px", fontFamily: "'Space Mono',monospace", display: "flex", alignItems: "center", gap: "2px" }}>
                        Open<ChevronRight size={10} />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Workspace Grid — Recent Tasks | Recent Emails */}
              <motion.div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", flex: 1, minHeight: 0 }}
                className="two-col"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.35 }}
              >
                <motion.div
                  className="card"
                  style={{
                    padding: "22px",
                    background: "var(--white)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: "18px",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "280px",
                    boxShadow: "0 1px 3px rgba(74,52,40,0.06)",
                  }}
                  whileHover={{ y: -4, boxShadow: "0 12px 28px rgba(74,52,40,0.1)", transition: { duration: 0.2 } }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Recent Tasks</span>
                    <motion.button
                      onClick={() => setModal(true)}
                      className="btn-outline"
                      style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", fontSize: "12px", borderRadius: "10px" }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus size={12} /> New
                    </motion.button>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                    <RecentTasksList tasks={tasks} onViewPipeline={() => setTab("pipeline")} />
                  </div>
                </motion.div>
                <motion.div
                  className="card"
                  style={{
                    padding: "22px",
                    background: "var(--white)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: "18px",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "280px",
                    boxShadow: "0 1px 3px rgba(74,52,40,0.06)",
                  }}
                  whileHover={{ y: -4, boxShadow: "0 12px 28px rgba(74,52,40,0.1)", transition: { duration: 0.2 } }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Recent Emails</span>
                    {tLoad && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-secondary)", fontFamily: "'Space Mono',monospace" }}
                      >
                        <span style={{ width: "12px", height: "12px", border: "2px solid var(--border-soft)", borderTopColor: "var(--cocoa)", borderRadius: "50%" }} className="anim-spin" />
                        Syncing emails...
                      </motion.span>
                    )}
                    <button onClick={() => setTab("emails")}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cocoa)", fontSize: "12px", fontFamily: "'Space Mono',monospace", display: "flex", alignItems: "center", gap: "3px", marginLeft: "auto" }}>
                      All<ChevronRight size={11} />
                    </button>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 0 }}>
                    {emails.length === 0 && (
                      <p style={{ padding: "20px", textAlign: "center", fontSize: "12px", color: "var(--text-secondary)" }}>
                        Connect Gmail to see emails →
                      </p>
                    )}
                    {emails.slice(0, 6).map(email => (
                      <div key={email._id}
                        onClick={() => { selectEmail(email); setTab("emails"); }}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "10px", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, background: email.isProcessed ? "var(--green)" : "var(--cocoa)" }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)", fontWeight: !email.isRead ? 600 : 400 }}>{email.subject}</p>
                          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email.from}</p>
                        </div>
                        {email.isProcessed && email.hasActionItems && (
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--cocoa)", flexShrink: 0 }}>{email.extractedTaskIds.length}t</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </div>
          )}

          {/* Floating AI Action Button — only on dashboard */}
          {tab === "dashboard" && (
            <motion.button
              onClick={processAll}
              disabled={processingAll}
              className="floating-ai-btn"
              style={{
                position: "fixed",
                bottom: "28px",
                right: "28px",
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 22px",
                fontSize: "14px",
                fontWeight: 600,
                background: "linear-gradient(135deg, #4A3428 0%, #6B4A3A 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: processingAll ? "not-allowed" : "pointer",
                boxShadow: "0 4px 20px rgba(74,52,40,0.3)",
                opacity: processingAll ? 0.7 : 1,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
              whileHover={
                processingAll
                  ? {}
                  : { scale: 1.05, boxShadow: "0 8px 32px rgba(74,52,40,0.4)" }
              }
              whileTap={processingAll ? {} : { scale: 0.98 }}
            >
              <Zap size={18} fill="currentColor" />
              Process with AI
            </motion.button>
          )}

          {/* ── EMAILS ─────────────────────────────────────────────────────── */}
          {tab === "emails" && (
            <div style={{ padding: "28px" }} className="anim-up">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <h1 style={{ fontSize: "28px", fontFamily: "'Instrument Serif',serif", color: "var(--text)" }}>
                    {emailTab === "inbox" ? "Inbox" : "Sent"}
                  </h1>
                  <p style={{ fontSize: "13px", color: "var(--text-3)", marginTop: "2px" }}>
                    {emailTab === "inbox"
                      ? `${unprocessed} unprocessed · ${emails.length} total`
                      : `${sentMails.length} sent`}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button className={`email-subtab ${emailTab === "inbox" ? "active" : ""}`} onClick={() => setEmailTab("inbox")}>Inbox</button>
                  <button className={`email-subtab ${emailTab === "sent" ? "active" : ""}`} onClick={() => setEmailTab("sent")}>
                    Sent {sentMails.length > 0 && `(${sentMails.length})`}
                  </button>
                  <button
                    onClick={emailTab === "inbox" ? fetchEmails : fetchSentMails}
                    style={{ marginLeft: "12px", display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", fontSize: "12px", background: "none", border: "1px solid var(--border)", borderRadius: "3px", cursor: "pointer", color: "var(--text-3)" }}>
                    Refresh
                  </button>
                </div>
              </div>

              {emailTab === "inbox" && (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: "16px" }} className="email-grid">
                  <div style={{ maxHeight: "calc(100vh - 180px)", overflowY: "auto", paddingRight: "4px" }}>
                    <EmailList
                      emails={emails} selectedEmail={selEmail}
                      onSelect={selectEmail}
                      onProcess={handleProcessEmail}
                      processingEmailId={processingEmailId}
                    />
                  </div>
                  <div>
                    {lastResult
                      ? <ExtractionPanel result={lastResult} onClose={() => setLastResult(null)} />
                      : <EmailViewer
                          email={selEmail}
                          onProcess={handleProcessEmail}
                          processingEmailId={processingEmailId}
                          onFollowUpSent={fetchSentMails}
                        />
                    }
                  </div>
                </div>
              )}

              {emailTab === "sent" && <SentMailsList mails={sentMails} />}
            </div>
          )}

          {/* ── PIPELINE ───────────────────────────────────────────────────── */}
          {tab === "pipeline" && (
            <div style={{ padding: "28px" }} className="anim-up">
              <Header
                title="Pipeline"
                subtitle={`${tasks.length} tasks · ${overdue.length} overdue`}
                onRefresh={fetchPipeline}
                refreshing={pLoad}
                action={
                  <button onClick={() => setModal(true)} className="btn-outline"
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", fontSize: "12px" }}>
                    <Plus size={12} /> Add Task
                  </button>
                }
              />
              <KanbanBoard pipeline={pipeline} onMove={movePipeTask} onDelete={delPipeTask} loading={pLoad} />
            </div>
          )}

          {/* ── EXCEL (always mounted so state persists) ───────────────────── */}
          <div style={{ display: tab === "excel" ? "block" : "none", padding: "28px" }} className="anim-up">
            <Header
              title="Excel Analysis"
              subtitle="AI insights from spreadsheets · from email or upload"
            />
            <ExcelAnalysisPanel />
          </div>

          {/* ── INSIGHTS ───────────────────────────────────────────────────── */}
          {tab === "insights" && (
            <div style={{ padding: "28px", maxWidth: "960px" }} className="anim-up">
              <Header title="Insights" subtitle="AI-powered analytics" onRefresh={fetchInsights} refreshing={iLoad} />
              {insights ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }} className="three-col">
                    <CompletionRingCard insights={insights} />
                    <EmailStatsCard insights={insights} />
                    <PriorityChart insights={insights} />
                  </div>
                  <WeeklyTrendChart insights={insights} />
                  <ChartTooltip title="Pipeline stages" theory="Tasks move through these stages: Inbox (new), In Progress (being worked on), Review (needs check), Done (completed). Hover each card for details.">
                    <div className="card" style={{ padding: "20px" }}>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>Pipeline</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }} className="four-col">
                        {[
                          ["inbox", "Inbox", "var(--text-3)", "New tasks waiting to be picked up."],
                          ["in_progress", "In Progress", "var(--blue)", "Tasks you're actively working on."],
                          ["review", "Review", "var(--yellow)", "Tasks that need a final check before marking done."],
                          ["done", "Done", "var(--green)", "Completed tasks. Contribute to your completion rate."],
                        ].map(([id, lbl, c, theory]) => {
                          const cnt = insights.tasksByStage.find((s: any) => s._id === id)?.count ?? 0;
                          return (
                            <ChartTooltip key={id} title={lbl} theory={theory as string}>
                              <div className="card" style={{ padding: "14px", textAlign: "center", cursor: "default" }}>
                                <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "32px", color: c }}>{cnt}</div>
                                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--text-3)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{lbl}</div>
                              </div>
                            </ChartTooltip>
                          );
                        })}
                      </div>
                    </div>
                  </ChartTooltip>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
                  <div style={{ width: "28px", height: "28px", border: "2px solid var(--border)", borderTopColor: "var(--punch)", borderRadius: "50%" }} className="anim-spin" />
                </div>
              )}
            </div>
          )}
        </main>

        <CreateTaskModal
          open={modal}
          onClose={() => setModal(false)}
          onCreated={() => { fetchTasks(); if (tab === "pipeline") fetchPipeline(); }}
        />
      </div>
    </>
  );
}