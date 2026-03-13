"use client";
import Sidebar from "./Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
            <Sidebar />

            <main style={{ 
                marginLeft: "240px", flex: 1, minHeight: "100vh", 
                background: "var(--bg)", 
            }}>
                {children}
            </main>
        </div>
    );
}