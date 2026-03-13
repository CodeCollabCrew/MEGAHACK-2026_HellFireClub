"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, Loader2, User, FolderOpen, CheckSquare, Mail, Settings, ChevronLeft, ChevronRight } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API = BASE_URL.replace(/\/+$/, "").endsWith("/api") ? BASE_URL.replace(/\/+$/, "") : `${BASE_URL.replace(/\/+$/, "")}/api`;
const PAGE_SIZE = 12;

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
    create: { label: "Create", color: "var(--green)", bg: "rgba(26,122,74,0.08)" },
    update: { label: "Update", color: "var(--blue)", bg: "rgba(27,79,216,0.08)" },
    delete: { label: "Delete", color: "var(--red)", bg: "rgba(204,34,0,0.08)" },
    login: { label: "Login", color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
    complete: { label: "Complete", color: "var(--punch)", bg: "rgba(230,81,0,0.08)" },
    error: { label: "Error", color: "var(--red)", bg: "rgba(204,34,0,0.12)" },
};

const ENTITY_ICON: Record<string, any> = {
    user: User, workspace: FolderOpen, task: CheckSquare, email: Mail, system: Settings,
};

const ENTITY_COLOR: Record<string, string> = {
    user: "var(--blue)", workspace: "#E65100", task: "var(--green)", email: "#7C3AED", system: "var(--text-3)",
};

function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default function ActivityLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [typeFilter, setType] = useState("all");
    const [entityFilter, setEntity] = useState("all");
    const [page, setPage] = useState(0);

    const fetchLogs = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const params = new URLSearchParams({ limit: "150", skip: "0" });
            if (typeFilter !== "all") params.set("type", typeFilter);
            if (entityFilter !== "all") params.set("entity", entityFilter);
            const res = await fetch(`${API}/admin/activity?${params}`);
            const data = await res.json();
            if (data.success) { setLogs(data.data.logs || []); setTotal(data.data.total || 0); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); setPage(0); }
    }, [typeFilter, entityFilter]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const filtered = logs.filter(l => {
        if (!search) return true;
        const q = search.toLowerCase();
        return l.action?.toLowerCase().includes(q) || l.target?.toLowerCase().includes(q) || l.details?.toLowerCase().includes(q) || l.performedBy?.toLowerCase().includes(q);
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const typeCounts = logs.reduce((acc: Record<string, number>, l) => { acc[l.type] = (acc[l.type] || 0) + 1; return acc; }, {});

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
            <Loader2 size={24} className="anim-spin" style={{ color: "#2B1A12" }} />
        </div>
    );

    return (
        <div style={{ padding: "40px 48px", maxWidth: "1400px" }} className="anim-up">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#2B1A12", letterSpacing: "-0.02em" }}>Activity Logs</h1>
                    <p style={{ fontSize: "15px", color: "var(--text-3)", marginTop: "4px" }}>
                        Monitor system-wide events and user actions
                    </p>
                </div>
                <button onClick={() => fetchLogs(true)} className="btn-outline"
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", fontSize: "13px", borderRadius: "10px" }}>
                    {refreshing ? <Loader2 size={14} className="anim-spin" /> : <RefreshCw size={14} />} Refresh Logs
                </button>
            </div>

            <div style={{ background: "white", padding: "24px", borderRadius: "20px", border: "1px solid rgba(0,0,0,0.04)", marginBottom: "32px" }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                    {[
                        { key: "all", label: "All Events" }, { key: "create", label: "Create" },
                        { key: "update", label: "Update" }, { key: "delete", label: "Delete" },
                        { key: "login", label: "Login" }, { key: "complete", label: "Complete" },
                        { key: "error", label: "Error" },
                    ].map(({ key, label }) => (
                        <button key={key} onClick={() => setType(key)}
                            style={{
                                padding: "6px 16px", borderRadius: "10px", fontSize: "13px", cursor: "pointer", transition: "all 0.2s",
                                background: typeFilter === key ? "#2B1A12" : "#F9F9F8",
                                color: typeFilter === key ? "white" : "var(--text-3)",
                                border: "none", fontWeight: 600
                            }}>
                            {label}
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} className="input-base"
                            style={{ paddingLeft: "42px", height: "48px", borderRadius: "12px", background: "#F9F9F8", border: "1px solid rgba(0,0,0,0.04)" }} placeholder="Filter by action, user, or details..." />
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="card" style={{ padding: "80px", textAlign: "center", borderRadius: "24px", border: "1px dashed var(--border)" }}>
                    <p style={{ fontSize: "16px", color: "var(--text-2)", fontWeight: 500 }}>No matching logs found</p>
                    <p style={{ fontSize: "14px", color: "var(--text-3)", marginTop: "4px" }}>Try adjusting your filters or search query</p>
                </div>
            ) : (
                <div className="card" style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.04)" }}>
                    {paged.map((log, i) => {
                        const tm = TYPE_META[log.type] || { label: log.type, color: "var(--text-3)", bg: "var(--surface)" };
                        const Icon = ENTITY_ICON[log.entity] || Settings;
                        const ic = ENTITY_COLOR[log.entity] || "#888";
                        return (
                            <div key={log._id || i} style={{ display: "flex", alignItems: "flex-start", gap: "20px", padding: "20px 24px", borderBottom: i === paged.length - 1 ? "none" : "1px solid var(--border)", transition: "all 0.2s" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#FAF8F6")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                
                                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${ic}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Icon size={20} color={ic} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span style={{ fontSize: "15px", fontWeight: 600, color: "#2B1A12" }}>{log.action}</span>
                                            <span style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, background: tm.bg, color: tm.color, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                                                {tm.label}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: 500 }}>{timeAgo(log.createdAt)}</span>
                                    </div>
                                    <p style={{ fontSize: "14px", color: "var(--text-2)", marginBottom: "8px" }}>
                                        <span style={{ fontWeight: 600, color: ic }}>{log.target}</span>
                                        {log.details && <span style={{ color: "var(--text-3)" }}> — {log.details}</span>}
                                    </p>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-3)" }}>
                                            <User size={12} /> Performed by <span style={{ color: "#2B1A12", fontWeight: 600 }}>{log.performedBy || "System"}</span>
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--text-3)", opacity: 0.6 }}>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "24px" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-3)", fontWeight: 500 }}>
                        Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} events
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-outline"
                            style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", opacity: page === 0 ? 0.4 : 1, borderRadius: "10px" }}>
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="btn-outline"
                            style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", opacity: page === totalPages - 1 ? 0.4 : 1, borderRadius: "10px" }}>
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}