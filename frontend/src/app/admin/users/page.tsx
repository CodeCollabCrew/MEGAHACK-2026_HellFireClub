"use client";
import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Download, ChevronDown, X, Check, Loader2, RefreshCw } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API = BASE_URL.replace(/\/+$/, "").endsWith("/api") ? BASE_URL.replace(/\/+$/, "") : `${BASE_URL.replace(/\/+$/, "")}/api`;
const AVATAR_COLORS = ["#1B4FD8", "#1A7A4A", "#7C3AED", "#E65100", "#00838F", "#C2185B"];

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [roleFilter, setRole] = useState("All Roles");
    const [statusFilter, setStatus] = useState("All Status");
    const [selected, setSelected] = useState<string[]>([]);
    const [showModal, setModal] = useState(false);
    const [editUser, setEditUser] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
    const [formError, setFormError] = useState("");

    const fetchUsers = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const res = await fetch(`${API}/auth/users`);
            const data = await res.json();
            if (data.success) setUsers(data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const filtered = users.filter(u => {
        const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "All Roles" || u.role === roleFilter.toLowerCase();
        const matchStatus = statusFilter === "All Status" || u.status === statusFilter.toLowerCase();
        return matchSearch && matchRole && matchStatus;
    });

    const cycleStatus = async (user: any) => {
        const newStatus = user.status === "active" ? "inactive" : "active";
        try {
            const res = await fetch(`${API}/auth/users/${user._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
            const data = await res.json();
            if (data.success) setUsers(us => us.map(u => u._id === user._id ? { ...u, status: newStatus } : u));
        } catch (e) { console.error(e); }
    };

    const deleteUser = async (id: string) => {
        if (!confirm("Delete this user?")) return;
        try {
            await fetch(`${API}/auth/users/${id}`, { method: "DELETE" });
            setUsers(us => us.filter(u => u._id !== id));
        } catch (e) { console.error(e); }
    };

    const openAdd = () => { setEditUser(null); setForm({ name: "", email: "", password: "", role: "user" }); setFormError(""); setModal(true); };
    const openEdit = (u: any) => { setEditUser(u); setForm({ name: u.name, email: u.email, password: "", role: u.role }); setFormError(""); setModal(true); };

    const handleSave = async () => {
        if (!form.name || !form.email) { setFormError("Name and email are required."); return; }
        setSaving(true); setFormError("");
        try {
            if (editUser) {
                const body: any = { name: form.name, role: form.role };
                const res = await fetch(`${API}/auth/users/${editUser._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                const data = await res.json();
                if (data.success) { setUsers(us => us.map(u => u._id === editUser._id ? data.data : u)); setModal(false); }
                else setFormError(data.message || "Update failed");
            } else {
                if (!form.password) { setFormError("Password is required for new users."); setSaving(false); return; }
                const res = await fetch(`${API}/auth/users`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
                const data = await res.json();
                if (data.success) { fetchUsers(); setModal(false); }
                else setFormError(data.message || "Creation failed");
            }
        } catch (e) { setFormError("Server error. Try again."); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
            <Loader2 size={24} className="anim-spin" style={{ color: "#2B1A12" }} />
        </div>
    );

    return (
        <div style={{ padding: "40px 48px", maxWidth: "1400px" }} className="anim-up">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#2B1A12", letterSpacing: "-0.02em" }}>User Management</h1>
                    <p style={{ fontSize: "15px", color: "var(--text-3)", marginTop: "4px" }}>
                        View and manage all registered users in the system
                    </p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={() => fetchUsers(true)} className="btn-outline" 
                        style={{ background: "white", padding: "12px 18px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                        {refreshing ? <Loader2 size={16} className="anim-spin" /> : <RefreshCw size={16} />} Refresh
                    </button>
                    <button onClick={openAdd} className="btn-punch" 
                        style={{ background: "#2B1A12", color: "white", padding: "12px 24px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: 600 }}>
                        <Plus size={18} /> Add User
                    </button>
                </div>
            </div>

            <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} className="input-base" 
                        style={{ paddingLeft: "48px", height: "48px", borderRadius: "12px", background: "white", border: "1px solid rgba(0,0,0,0.06)" }} placeholder="Search users by name or email..." />
                </div>
                {[
                    { value: roleFilter, onChange: setRole, options: ["All Roles", "Admin", "User"] },
                    { value: statusFilter, onChange: setStatus, options: ["All Status", "Active", "Inactive"] },
                ].map((sel, i) => (
                    <div key={i} style={{ position: "relative" }}>
                        <select value={sel.value} onChange={e => sel.onChange(e.target.value)}
                            style={{ 
                                appearance: "none", background: "white", border: "1px solid rgba(0,0,0,0.06)", 
                                color: "#2B1A12", padding: "0 44px 0 20px", borderRadius: "12px", 
                                fontSize: "14px", fontWeight: 500, cursor: "pointer", height: "48px", minWidth: "140px" 
                            }}>
                            {sel.options.map(o => <option key={o}>{o}</option>)}
                        </select>
                        <ChevronDown size={16} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
                    </div>
                ))}
            </div>

            <div className="card" style={{ borderRadius: "20px", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "rgba(0,0,0,0.02)", textAlign: "left" }}>
                            <th style={{ padding: "16px 24px", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>User</th>
                            <th style={{ padding: "16px 24px", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Role</th>
                            <th style={{ padding: "16px 24px", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Status</th>
                            <th style={{ padding: "16px 24px", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em" }}>Joined</th>
                            <th style={{ padding: "16px 24px", fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.05em", textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((u, i) => (
                            <tr key={u._id} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td style={{ padding: "20px 24px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                        <div style={{ 
                                            width: "40px", height: "40px", borderRadius: "50%", 
                                            background: AVATAR_COLORS[i % AVATAR_COLORS.length], 
                                            display: "flex", alignItems: "center", justifyContent: "center", 
                                            fontSize: "14px", fontWeight: 700, color: "white" 
                                        }}>
                                            {u.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: "15px", fontWeight: 600, color: "#2B1A12" }}>{u.name}</p>
                                            <p style={{ fontSize: "13px", color: "var(--text-3)" }}>{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: "20px 24px" }}>
                                    <span style={{ 
                                        padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                                        background: u.role === "admin" ? "#2B1A12" : "rgba(0,0,0,0.05)",
                                        color: u.role === "admin" ? "white" : "var(--text-2)"
                                    }}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: "20px 24px" }}>
                                    <button onClick={() => cycleStatus(u)}
                                        style={{ 
                                            padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
                                            background: u.status === "active" ? "rgba(26,122,74,0.08)" : "rgba(200,150,12,0.08)",
                                            color: u.status === "active" ? "var(--green)" : "var(--yellow)",
                                            border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                                        }}>
                                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} />
                                        {u.status === "active" ? "Active" : "Inactive"}
                                    </button>
                                </td>
                                <td style={{ padding: "20px 24px", fontSize: "14px", color: "var(--text-2)" }}>
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: "20px 24px", textAlign: "right" }}>
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                        <button onClick={() => openEdit(u)} className="btn-outline" 
                                            style={{ width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => deleteUser(u._id)} className="btn-outline" 
                                            style={{ width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)" }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: "480px", padding: "32px", borderRadius: "24px", border: "none" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#2B1A12" }}>
                                {editUser ? "Edit Profile" : "Create Account"}
                            </h2>
                            <button onClick={() => setModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}><X size={20} /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#2B1A12", display: "block", marginBottom: "8px" }}>Full Name</label>
                                <input className="input-base" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                                    style={{ background: "#F9F9F8", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)", height: "48px" }} placeholder="e.g. Alex Johnson" />
                            </div>
                            <div>
                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#2B1A12", display: "block", marginBottom: "8px" }}>Email Address</label>
                                <input className="input-base" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                                    style={{ background: "#F9F9F8", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)", height: "48px", opacity: editUser ? 0.6 : 1 }} placeholder="Email" disabled={!!editUser} />
                            </div>
                            {!editUser && (
                                <div>
                                    <label style={{ fontSize: "14px", fontWeight: 600, color: "#2B1A12", display: "block", marginBottom: "8px" }}>Set Password</label>
                                    <input className="input-base" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
                                        style={{ background: "#F9F9F8", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)", height: "48px" }} placeholder="••••••••" />
                                </div>
                            )}
                            <div>
                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#2B1A12", display: "block", marginBottom: "8px" }}>Assign Role</label>
                                <div style={{ position: "relative" }}>
                                    <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                        style={{ 
                                            appearance: "none", width: "100%", background: "#F9F9F8", border: "1px solid rgba(0,0,0,0.06)", 
                                            color: "#2B1A12", padding: "0 44px 0 16px", borderRadius: "12px", fontSize: "14px", height: "48px" 
                                        }}>
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <ChevronDown size={14} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
                                </div>
                            </div>
                            {formError && <p style={{ fontSize: "13px", color: "var(--red)", fontWeight: 500 }}>{formError}</p>}
                        </div>
                        <div style={{ display: "flex", gap: "12px", marginTop: "40px" }}>
                            <button onClick={() => setModal(false)} className="btn-outline" style={{ flex: 1, height: "48px", borderRadius: "12px" }}>Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="btn-punch" 
                                style={{ 
                                    flex: 1, padding: "10px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", 
                                    gap: "8px", opacity: saving ? 0.7 : 1, background: "#2B1A12", borderRadius: "12px" 
                                }}>
                                {saving ? <Loader2 size={16} className="anim-spin" /> : <Check size={16} />}
                                {editUser ? "Update User" : "Create User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}