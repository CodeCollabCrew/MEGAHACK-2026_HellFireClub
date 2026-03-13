"use client";
import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Megaphone, Code2, Headphones, BarChart3, FileText, Globe, X, Check, ArrowLeft, Loader2, CheckSquare, Clock, Eye } from "lucide-react";
import api from "@/lib/api";

const ICONS = [Megaphone, Code2, Headphones, BarChart3, FileText, Globe];
const ICON_STYLES = [
    { bg: "#FFF3E0", color: "#E65100" }, { bg: "#E8F0FE", color: "#1B4FD8" },
    { bg: "#FCE4EC", color: "#C2185B" }, { bg: "#E8F5E9", color: "#2E7D32" },
    { bg: "#F3E5F5", color: "#7B1FA2" }, { bg: "#E0F7FA", color: "#00838F" },
];
const STAGE_COLORS: Record<string, string> = {
    inbox: "var(--text-3)", in_progress: "var(--blue)", review: "var(--yellow)", done: "var(--green)"
};

export default function AdminWorkspaces() {
    const [search, setSearch] = useState("");
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [tasksByStage, setTasksByStage] = useState<any[]>([]);
    const [allTasks, setAllTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any>(null);
    const [showModal, setModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", description: "", owner: "" });
    const [formError, setFormError] = useState("");

    const fetchAll = async () => {
        try {
            const [wsRes, taskRes] = await Promise.all([
                api.get("/api/workspaces"),
                api.get("/api/tasks"),
            ]);
            const wsData = wsRes.data;
            const taskData = taskRes.data;
            if (wsData.success) setWorkspaces(wsData.data);
            const tasks = taskData.data || taskData.tasks || [];
            setAllTasks(tasks);
            const stageCounts: Record<string, number> = {};
            tasks.forEach((t: any) => { stageCounts[t.stage] = (stageCounts[t.stage] || 0) + 1; });
            setTasksByStage(Object.entries(stageCounts).map(([_id, count]) => ({ _id, count })));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleCreate = async () => {
        if (!form.name.trim()) { setFormError("Workspace name is required."); return; }
        setSaving(true); setFormError("");
        try {
            const res = await api.post("/api/workspaces", form);
            const data = res.data;
            if (data.success) {
                setWorkspaces(ws => [data.data, ...ws]);
                setModal(false);
                setForm({ name: "", description: "", owner: "" });
            } else {
                setFormError(data.error || "Failed to create workspace");
            }
        } catch (e: any) {
            const msg = e.response?.data?.error || "Server error. Try again.";
            setFormError(msg);
        }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this workspace?")) return;
        try {
            await api.delete(`/api/workspaces/${id}`);
            setWorkspaces(ws => ws.filter(w => w._id !== id));
            if (selected?._id === id) setSelected(null);
        } catch (e) {
            console.error(e);
        }
    };

    const filtered = workspaces.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.description?.toLowerCase().includes(search.toLowerCase())
    );

    const totalTasks = tasksByStage.reduce((a, s) => a + s.count, 0);
    const done = tasksByStage.find(s => s._id === "done")?.count || 0;

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
            <Loader2 size={24} className="anim-spin" style={{ color: "#2B1A12" }} />
        </div>
    );

    if (selected) {
        const inProgress = tasksByStage.find(s => s._id === "in_progress")?.count || 0;
        const review = tasksByStage.find(s => s._id === "review")?.count || 0;
        const completionRate = totalTasks ? Math.round(done / totalTasks * 100) : 0;
        const idx = workspaces.findIndex(w => w._id === selected._id);
        const Icon = ICONS[Math.max(0, idx) % ICONS.length];
        const st = ICON_STYLES[Math.max(0, idx) % ICON_STYLES.length];
        const recentTasks = allTasks.slice(0, 8);

        return (
            <div style={{ padding: "40px 48px", maxWidth: "1200px" }} className="anim-up">
                <button onClick={() => setSelected(null)} 
                    style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", marginBottom: "32px", fontWeight: 500 }}>
                    <ArrowLeft size={16} /> Back to Overview
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "48px" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: st.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={32} color={st.color} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#2B1A12", letterSpacing: "-0.02em" }}>{selected.name}</h1>
                        <p style={{ fontSize: "15px", color: "var(--text-3)", marginTop: "4px" }}>{selected.description || "Project management workspace"}</p>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "20px", marginBottom: "32px" }}>
                    {[
                        { label: "Total Tasks", value: totalTasks, icon: CheckSquare, color: "var(--blue)" },
                        { label: "Completed", value: done, icon: Check, color: "var(--green)" },
                        { label: "In Progress", value: inProgress, icon: Clock, color: "#E65100" },
                        { label: "Completion", value: `${completionRate}%`, icon: BarChart3, color: "#2B1A12" },
                    ].map(({ label, value, icon: Ic, color }) => (
                        <div key={label} className="card" style={{ padding: "24px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.04)" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                                <span style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                                <div style={{ color }}><Ic size={18} /></div>
                            </div>
                            <p style={{ fontSize: "32px", fontWeight: 600, color: "#2B1A12", lineHeight: 1 }}>{value}</p>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.04)" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.01)" }}>
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "#2B1A12" }}>Recent Workspace Activity</span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left" }}>
                                <th style={{ padding: "16px 24px", fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Task Name</th>
                                <th style={{ padding: "16px 24px", fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Priority</th>
                                <th style={{ padding: "16px 24px", fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                                <th style={{ padding: "16px 24px", fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTasks.map((t: any) => (
                                <tr key={t._id} style={{ borderTop: "1px solid var(--border)" }}>
                                    <td style={{ padding: "18px 24px", fontSize: "14px", fontWeight: 600, color: "#2B1A12" }}>{t.title}</td>
                                    <td style={{ padding: "18px 24px" }}>
                                        <span style={{ 
                                            padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                                            background: { urgent: "rgba(204,34,0,0.08)", high: "rgba(200,150,12,0.08)", medium: "rgba(27,79,216,0.08)", low: "rgba(26,122,74,0.08)" }[t.priority as string] || "rgba(0,0,0,0.05)",
                                            color: { urgent: "var(--red)", high: "var(--yellow)", medium: "var(--blue)", low: "var(--green)" }[t.priority as string] || "var(--text-3)"
                                        }}>{t.priority.toUpperCase()}</span>
                                    </td>
                                    <td style={{ padding: "18px 24px", fontSize: "14px", color: STAGE_COLORS[t.stage] || "var(--text-3)", fontWeight: 500, textTransform: "capitalize" }}>{t.stage.replace("_", " ")}</td>
                                    <td style={{ padding: "18px 24px", fontSize: "13px", color: "var(--text-3)" }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: "40px 48px", maxWidth: "1400px" }} className="anim-up">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#2B1A12", letterSpacing: "-0.02em" }}>Workspaces</h1>
                    <p style={{ fontSize: "15px", color: "var(--text-3)", marginTop: "4px" }}>
                        Manage teams, projects and shared resource environments
                    </p>
                </div>
                <button onClick={() => { setForm({ name: "", description: "", owner: "" }); setFormError(""); setModal(true); }} className="btn-punch"
                    style={{ background: "#2B1A12", color: "white", padding: "12px 24px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: 600 }}>
                    <Plus size={18} /> New Workspace
                </button>
            </div>

            <div style={{ position: "relative", maxWidth: "480px", marginBottom: "32px" }}>
                <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} className="input-base" 
                    style={{ paddingLeft: "48px", height: "48px", borderRadius: "12px", background: "white", border: "1px solid rgba(0,0,0,0.06)" }} placeholder="Search workspaces by name..." />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "24px" }}>
                {filtered.map((w, i) => {
                    const Icon = ICONS[i % ICONS.length];
                    const st = ICON_STYLES[i % ICON_STYLES.length];
                    return (
                        <div key={w._id} className="card" style={{ padding: "28px", cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", borderRadius: "24px", border: "1px solid rgba(0,0,0,0.04)" }}
                            onClick={() => setSelected(w)}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 40px -12px rgba(0,0,0,0.1)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}>

                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: st.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Icon size={24} color={st.color} />
                                </div>
                                <button onClick={e => handleDelete(w._id, e)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: "8px", borderRadius: "8px" }}
                                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(204,34,0,0.05)"}
                                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "none"}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#2B1A12", marginBottom: "8px" }}>{w.name}</h3>
                            <p style={{ fontSize: "13px", color: "var(--text-3)", lineHeight: 1.6, marginBottom: "24px", height: "42px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                {w.description || "Project collaboration space for the team members."}
                            </p>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "20px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                                <span style={{ 
                                    padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 700,
                                    background: w.status === "active" ? "rgba(26,122,74,0.08)" : "rgba(200,150,12,0.08)",
                                    color: w.status === "active" ? "var(--green)" : "var(--yellow)",
                                    textTransform: "uppercase"
                                }}>{w.status}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-3)", fontSize: "12px", fontWeight: 500 }}>
                                    <BarChart3 size={14} /> View Analytics
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
                    onClick={() => setModal(false)}>
                    <div className="card" style={{ width: "480px", padding: "32px", borderRadius: "24px", border: "none" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#2B1A12" }}>Initialize Workspace</h2>
                            <button onClick={() => setModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}><X size={20} /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#2B1A12", display: "block", marginBottom: "8px" }}>Workspace Identifier</label>
                                <input className="input-base" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                                    style={{ background: "#F9F9F8", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)", height: "48px" }} placeholder="e.g. Design Operations" autoFocus />
                            </div>
                            <div>
                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#2B1A12", display: "block", marginBottom: "8px" }}>Space Objective</label>
                                <textarea className="input-base" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                                    style={{ background: "#F9F9F8", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)", padding: "12px" }} placeholder="Describe the workspace purpose..." rows={3} />
                            </div>
                            <div>
                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#2B1A12", display: "block", marginBottom: "8px" }}>Lead Administrator (Email)</label>
                                <input className="input-base" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} 
                                    style={{ background: "#F9F9F8", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)", height: "48px" }} placeholder="admin@org.com" />
                            </div>
                            {formError && <p style={{ fontSize: "13px", color: "var(--red)", fontWeight: 500 }}>{formError}</p>}
                        </div>
                        <div style={{ display: "flex", gap: "12px", marginTop: "40px" }}>
                            <button onClick={() => setModal(false)} className="btn-outline" style={{ flex: 1, height: "48px", borderRadius: "12px" }}>Cancel</button>
                            <button onClick={handleCreate} disabled={saving} className="btn-punch"
                                style={{ 
                                    flex: 1, padding: "10px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", 
                                    gap: "8px", opacity: saving ? 0.7 : 1, background: "#2B1A12", borderRadius: "12px" 
                                }}>
                                {saving ? <Loader2 size={16} className="anim-spin" /> : <Check size={16} />} 
                                Create Workspace
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}