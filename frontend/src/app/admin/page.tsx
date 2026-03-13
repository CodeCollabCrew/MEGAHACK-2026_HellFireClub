"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, CheckSquare, Mail, Lightbulb, TrendingUp, TrendingDown, Plus, RefreshCw, Loader2, UserCheck, Building2, Settings as SettingsIcon } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API = BASE_URL.replace(/\/+$/, "").endsWith("/api") ? BASE_URL.replace(/\/+$/, "") : `${BASE_URL.replace(/\/+$/, "")}/api`;

const STAGE_COLORS: Record<string, string> = {
    inbox: "var(--text-3)", in_progress: "var(--blue)", review: "var(--yellow)", done: "var(--green)",
};
const PRIORITY_COLORS: Record<string, string> = {
    urgent: "var(--red)", high: "var(--yellow)", medium: "var(--punch)", low: "var(--green)",
};
const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
    create: { bg: "rgba(26,122,74,0.1)", color: "var(--green)" },
    update: { bg: "rgba(27,79,216,0.1)", color: "var(--blue)" },
    complete: { bg: "rgba(255,77,0,0.08)", color: "var(--punch)" },
    error: { bg: "rgba(200,150,12,0.1)", color: "var(--yellow)" },
};
const TABS = ["Overview", "Recent Tasks", "Activity"];

import GmailConnect from "@/components/dashboard/GmailConnect";

export default function AdminDashboard() {
    const router = useRouter();
    const [tab, setTab] = useState("Overview");
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const [sRes, aRes] = await Promise.all([
                fetch(`${API}/admin/stats`),
                fetch(`${API}/admin/activity`),
            ]);
            const sData = await sRes.json();
            const aData = await aRes.json();
            if (sData.success) setStats(sData.data);
            if (aData.success) setLogs(aData.data.logs);
        } catch (err) { console.error(err); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const userParam = params.get("user");
        if (userParam) {
            localStorage.setItem("userId", userParam);
            // Also update axon_user if it doesn't exist to prevent login screen
            if (!localStorage.getItem("axon_user")) {
                localStorage.setItem("axon_user", JSON.stringify({ name: userParam.split('@')[0], email: userParam }));
            }
        }
        fetchData();
    }, []);

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
            <Loader2 size={24} className="anim-spin" style={{ color: "#2B1A12" }} />
        </div>
    );

    const CARDS = stats ? [
        { label: "Total Users", value: stats.totalUsers, delta: `+${stats.totalUsers - stats.activeUsers} this month`, up: true, icon: Users, bg: "#E8F0FE", ic: "#1B4FD8" },
        { label: "Active Users", value: stats.activeUsers, delta: `${stats.totalUsers ? Math.round(stats.activeUsers / stats.totalUsers * 100) : 0}% active`, up: true, icon: UserCheck, bg: "#E8F5E9", ic: "#2E7D32" },
        { label: "Total Workspaces", value: stats.totalWorkspaces || 0, delta: "Dynamic data", up: true, icon: Building2, bg: "#F3E8FD", ic: "#7C3AED" },
        { label: "Total Tasks", value: stats.totalTasks, delta: `+${stats.thisMonthTasks} this week`, up: true, icon: CheckSquare, bg: "#FFF3E0", ic: "#E65100" },
        { label: "Emails Processed", value: stats.processedEmails, delta: `+${stats.thisWeekEmails} this week`, up: true, icon: Mail, bg: "#E0F7FA", ic: "#00838F" },
        { label: "Insights Generated", value: 892, delta: "System logs", up: true, icon: Lightbulb, bg: "#FFFDE7", ic: "#FBC02D" },
    ] : [];

    return (
        <div style={{ padding: "40px 48px", maxWidth: "1400px" }} className="anim-up">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#2B1A12", letterSpacing: "-0.02em" }}>Admin Dashboard</h1>
                    <p style={{ fontSize: "15px", color: "var(--text-3)", marginTop: "4px" }}>Manage users, workspaces, and system settings</p>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ width: "200px" }}>
                        <GmailConnect onImported={() => fetchData(true)} />
                    </div>
                    <button onClick={() => router.push("/admin/users")} className="btn-punch" 
                        style={{ background: "#2B1A12", color: "white", padding: "10px 20px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: 600 }}>
                        <Plus size={18} /> Add User
                    </button>
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "48px" }}>
                {CARDS.map(({ label, value, delta, up, icon: Icon, bg, ic }) => (
                    <div key={label} className="card" style={{ padding: "24px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                            <div>
                                <p style={{ fontSize: "14px", color: "var(--text-3)", fontWeight: 500, marginBottom: "12px" }}>{label}</p>
                                <p style={{ fontSize: "36px", fontWeight: 700, color: "#2B1A12", lineHeight: 1 }}>{value?.toLocaleString()}</p>
                                <p style={{ fontSize: "13px", color: up ? "var(--green)" : "var(--red)", marginTop: "10px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                                    {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {delta}
                                </p>
                            </div>
                            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Icon size={24} color={ic} strokeWidth={2} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs & Table Section */}
            <div className="card" style={{ borderRadius: "20px", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden" }}>
                <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)", display: "flex", gap: "32px" }}>
                    {["Overview", "Recent Tasks", "Activity"].map(t => (
                        <button key={t} onClick={() => setTab(t)} 
                            style={{ 
                                padding: "8px 0", fontSize: "14px", fontWeight: 600, cursor: "pointer", 
                                background: "transparent", border: "none", 
                                color: tab === t ? "#2B1A12" : "var(--text-3)", 
                                borderBottom: `2.5px solid ${tab === t ? "#2B1A12" : "transparent"}`,
                                transition: "all 0.2s"
                            }}>
                            {t}
                        </button>
                    ))}
                </div>

                <div style={{ padding: "32px" }}>
                    {tab === "Overview" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
                            {[
                                { title: "User Management", desc: "Provision, monitor, and manage administrative and user roles.", icon: Users, color: "#1B4FD8" },
                                { title: "Workspace Analytics", desc: "Analyze email patterns and task distribution across teams.", icon: Building2, color: "#7C3AED" },
                                { title: "Gmail Integration", desc: "Secure OAuth connections for automated email processing.", icon: Mail, color: "#DB4437" },
                                { title: "Task Intelligence", desc: "Automated task extraction and prioritization via AI.", icon: CheckSquare, color: "#E65100" },
                                { title: "AI Insights", desc: "Deep behavior analysis and anomaly detection reports.", icon: Lightbulb, color: "#FBC02D" },
                                { title: "System Settings", desc: "Configure global parameters and security protocols.", icon: SettingsIcon, color: "var(--text-3)" }
                            ].map((f, i) => (
                                <div key={i} style={{ padding: "20px", borderRadius: "16px", background: "#F9F9F8", border: "1px solid rgba(0,0,0,0.02)" }}>
                                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
                                        <f.icon size={18} color={f.color} />
                                    </div>
                                    <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#2B1A12", marginBottom: "6px" }}>{f.title}</h4>
                                    <p style={{ fontSize: "13px", color: "var(--text-3)", lineHeight: 1.5 }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === "Recent Tasks" && (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: "#F9F9F8" }}>
                                        <th style={{ padding: "16px 28px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Task</th>
                                        <th style={{ padding: "16px 28px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Priority</th>
                                        <th style={{ padding: "16px 28px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Stage</th>
                                        <th style={{ padding: "16px 28px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.recentTasks?.map((t: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: "1px solid var(--border)", transition: "all 0.2s" }}>
                                            <td style={{ padding: "16px 28px" }}>
                                                <div style={{ fontSize: "14px", fontWeight: 500, color: "#2B1A12" }}>{t.title}</div>
                                            </td>
                                            <td style={{ padding: "16px 28px" }}>
                                                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: PRIORITY_COLORS[t.priority] || "var(--text-3)" }}>
                                                    {t.priority}
                                                </span>
                                            </td>
                                            <td style={{ padding: "16px 28px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: STAGE_COLORS[t.stage] || "var(--text-3)" }} />
                                                    <span style={{ fontSize: "12px", color: "var(--text-2)", textTransform: "capitalize" }}>{t.stage.replace("_", " ")}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "16px 28px", fontSize: "13px", color: "var(--text-3)" }}>
                                                {new Date(t.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats?.recentTasks || stats.recentTasks.length === 0) && (
                                        <tr>
                                            <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--text-3)", fontSize: "14px" }}>No recent tasks found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {tab === "Activity" && (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: "#F9F9F8" }}>
                                        <th style={{ padding: "16px 28px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Action</th>
                                        <th style={{ padding: "16px 28px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Details</th>
                                        <th style={{ padding: "16px 28px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Performed By</th>
                                        <th style={{ padding: "16px 28px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((l, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                                            <td style={{ padding: "16px 28px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <div style={{ 
                                                        padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                                                        background: TYPE_COLORS[l.type]?.bg || "rgba(0,0,0,0.04)",
                                                        color: TYPE_COLORS[l.type]?.color || "var(--text-3)"
                                                    }}>
                                                        {l.action}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "16px 28px", fontSize: "13px", color: "var(--text-2)" }}>{l.details}</td>
                                            <td style={{ padding: "16px 28px", fontSize: "13px", color: "var(--text-2)" }}>{l.performedBy || "Admin"}</td>
                                            <td style={{ padding: "16px 28px", fontSize: "13px", color: "var(--text-3)" }}>
                                                {new Date(l.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}