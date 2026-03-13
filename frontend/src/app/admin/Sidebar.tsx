"use client";
import { useRouter, usePathname } from "next/navigation";
import {
    LayoutDashboard, Users, Building2, Activity, Settings,
    Shield, ChevronLeft
} from "lucide-react";

const NAV = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/workspaces", icon: Building2, label: "Workspaces" },
    { href: "/admin/activity-logs", icon: Activity, label: "Activity Logs" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <aside style={{
            width: "240px", background: "#2B1A12", display: "flex", flexDirection: "column", 
            height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 100, borderRight: "1px solid rgba(255,255,255,0.05)"
        }}>
            {/* Logo Area */}
            <div style={{ padding: "32px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: "36px", height: "36px", background: "#FFFBF2", borderRadius: "10px",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}>
                        <Shield size={18} color="#2B1A12" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: "16px", color: "#FFFBF2", letterSpacing: "-0.01em" }}>Admin Panel</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,251,242,0.45)", fontWeight: 400, marginTop: "1px" }}>
                            Superadmin Access
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {NAV.map(({ href, icon: Icon, label }) => {
                    const active = pathname === href;
                    return (
                        <button key={href} onClick={() => router.push(href)}
                            style={{
                                display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
                                borderRadius: "10px", fontSize: "14px", fontWeight: 500, cursor: "pointer",
                                border: "none", width: "100%", textAlign: "left",
                                background: active ? "#FFFBF2" : "transparent",
                                color: active ? "#2B1A12" : "rgba(255,251,242,0.6)",
                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                        >
                            <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                            <span>{label}</span>
                        </button>
                    );
                })}
            </nav>

        </aside>
    );
}
