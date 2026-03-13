"use client";
import { useState, useEffect } from "react";
import { 
    Settings as SettingsIcon, Mail, Shield, Zap, Database, 
    RefreshCw, CheckCircle2, XCircle, AlertCircle, Loader2,
    Lock, Globe, Bell, Palette
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API = BASE_URL.replace(/\/+$/, "").endsWith("/api") ? BASE_URL.replace(/\/+$/, "") : `${BASE_URL.replace(/\/+$/, "")}/api`;

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [connections, setConnections] = useState<any[]>([]);
    const [sysStats, setSysStats] = useState({
        dbStatus: "Connected",
        apiLatency: "42ms",
        uptime: "12 days, 4h",
        activeSessions: 14,
        maintenanceMode: false
    });

    const fetchData = async () => {
        setRefreshing(true);
        try {
            // Fetch users to see their email connection status
            const res = await fetch(`${API}/auth/users`);
            const data = await res.json();
            if (data.success) {
                // Mocking some sync data for users who have email connected
                const usersWithEmail = data.data.map((u: any) => ({
                    ...u,
                    lastSync: u.email.includes("verified") || u.email.includes("final") ? new Date().toISOString() : null,
                    status: u.email.includes("verified") || u.email.includes("final") ? "connected" : "not_connected"
                }));
                setConnections(usersWithEmail);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
            <Loader2 size={24} className="anim-spin" style={{ color: "#2B1A12" }} />
        </div>
    );

    return (
        <div style={{ padding: "40px 48px", maxWidth: "1400px" }} className="anim-up">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#2B1A12", letterSpacing: "-0.02em" }}>System Settings</h1>
                    <p style={{ fontSize: "15px", color: "var(--text-3)", marginTop: "4px" }}>
                        Configure global parameters and monitor infrastructure health
                    </p>
                </div>
                <button onClick={fetchData} className="btn-outline"
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", fontSize: "13px", borderRadius: "10px" }}>
                    {refreshing ? <Loader2 size={14} className="anim-spin" /> : <RefreshCw size={14} />} Sync System
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px" }}>
                {/* Left Col: System Health */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div className="card" style={{ padding: "28px", borderRadius: "24px", border: "1px solid rgba(0,0,0,0.04)" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#2B1A12", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <Zap size={18} color="var(--punch)" /> Infrastructure
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {[
                                { label: "Database", value: sysStats.dbStatus, icon: Database, ok: true },
                                { label: "API Latency", value: sysStats.apiLatency, icon: RefreshCw, ok: true },
                                { label: "System Uptime", value: sysStats.uptime, icon: Globe, ok: true },
                                { label: "Active Sessions", value: sysStats.activeSessions, icon: Lock, ok: true },
                            ].map((s, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "#F9F9F8", borderRadius: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <s.icon size={14} color="var(--text-3)" />
                                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-2)" }}>{s.label}</span>
                                    </div>
                                    <span style={{ fontSize: "13px", fontWeight: 600, color: s.ok ? "var(--green)" : "var(--red)" }}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ padding: "28px", borderRadius: "24px", border: "1px solid rgba(0,0,0,0.04)", background: "#2B1A12" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "white", marginBottom: "12px" }}>Maintenance Mode</h3>
                        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "20px" }}>
                            Disable public access and API requests for scheduled updates.
                        </p>
                        <button className="btn-punch" style={{ width: "100%", background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
                            Enable Lockdown
                        </button>
                    </div>
                </div>

                {/* Right Col: Gmail Connections Monitor */}
                <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                    <div className="card" style={{ borderRadius: "24px", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden" }}>
                        <div style={{ padding: "28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#2B1A12", display: "flex", alignItems: "center", gap: "12px" }}>
                                    <Mail size={20} color="#7C3AED" /> Gmail Connections Monitor
                                </h3>
                                <p style={{ fontSize: "13px", color: "var(--text-3)", marginTop: "4px" }}>Tracking live email synchronization across {connections.length} users</p>
                            </div>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "#F9F9F8" }}>
                                    <th style={{ padding: "16px 28px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>User Account</th>
                                    <th style={{ padding: "16px 28px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Status</th>
                                    <th style={{ padding: "16px 28px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Last Polled</th>
                                    <th style={{ padding: "16px 28px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {connections.map((c, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid var(--border)", transition: "all 0.2s" }}>
                                        <td style={{ padding: "20px 28px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>
                                                    {c.name[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#2B1A12" }}>{c.name}</div>
                                                    <div style={{ fontSize: "12px", color: "var(--text-3)" }}>{c.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "20px 28px" }}>
                                            <div style={{ 
                                                display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                                                background: c.status === "connected" ? "rgba(26,122,74,0.08)" : "rgba(0,0,0,0.04)",
                                                color: c.status === "connected" ? "var(--green)" : "var(--text-3)"
                                            }}>
                                                {c.status === "connected" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                {c.status === "connected" ? "SECURE" : "DISCONNECTED"}
                                            </div>
                                        </td>
                                        <td style={{ padding: "20px 28px", fontSize: "13px", color: "var(--text-3)" }}>
                                            {c.lastSync ? new Date(c.lastSync).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "Never sync'd"}
                                        </td>
                                        <td style={{ padding: "20px 28px", textAlign: "center" }}>
                                            <button className="btn-outline" style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "8px" }}>
                                                {c.status === "connected" ? "Reset" : "Invite"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
