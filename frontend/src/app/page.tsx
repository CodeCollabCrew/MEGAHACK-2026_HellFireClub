"use client";
import { useRouter } from "next/navigation";
import { LayoutDashboard, ShieldCheck, Mail, Zap, ListTodo, PieChart } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const handleLaunch = (path: string) => {
    router.push(path);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: "800px", width: "100%", textAlign: "center" }} className="anim-up">
        {/* LOGO AREA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "40px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "var(--punch)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Zap size={20} />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>Axon</span>
        </div>

        {/* HERO */}
        <h1 style={{ fontSize: "clamp(48px, 8vw, 72px)", fontFamily: "'Instrument Serif', serif", color: "var(--text)", lineHeight: 0.9, marginBottom: "24px" }}>
          Turn your inbox into <br /> 
          <span style={{ fontStyle: "italic", color: "var(--punch)" }}>structured flow.</span>
        </h1>
        <p style={{ fontSize: "18px", color: "var(--text-2)", maxWidth: "540px", margin: "0 auto 48px auto", lineHeight: 1.5 }}>
          AI-powered financial intelligence that extracts tasks, detects anomalies, and manages your workflow—straight from your Gmail.
        </p>

        {/* ACTIONS */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", marginBottom: "64px" }}>
          <button 
            onClick={() => handleLaunch("/dashboard")}
            className="btn-punch" 
            style={{ padding: "16px 32px", fontSize: "16px", display: "flex", alignItems: "center", gap: "10px" }}
          >
            Launch Dashboard <LayoutDashboard size={18} />
          </button>
          <button 
            onClick={() => handleLaunch("/admin")}
            className="btn-outline" 
            style={{ padding: "16px 32px", fontSize: "16px", background: "var(--surface)", display: "flex", alignItems: "center", gap: "10px" }}
          >
            Admin Panel <ShieldCheck size={18} />
          </button>
        </div>

        {/* FEATURES GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", textAlign: "left" }}>
          <div className="card" style={{ padding: "24px" }}>
            <Mail size={24} style={{ color: "var(--punch)", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Email Extraction</h3>
            <p style={{ fontSize: "14px", color: "var(--text-2)" }}>AI automatically identifies tasks and deadlines from incoming threads.</p>
          </div>
          <div className="card" style={{ padding: "24px" }}>
            <ListTodo size={24} style={{ color: "var(--blue)", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Task Pipeline</h3>
            <p style={{ fontSize: "14px", color: "var(--text-2)" }}>Organize extracted items into a visual Kanban board with real-time tracking.</p>
          </div>
          <div className="card" style={{ padding: "24px" }}>
            <PieChart size={24} style={{ color: "var(--green)", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Unified Stats</h3>
            <p style={{ fontSize: "14px", color: "var(--text-2)" }}>Complete visibility into team workspaces and system-wide performance.</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ marginTop: "80px", borderTop: "1px solid var(--border)", paddingTop: "24px", width: "100%", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "var(--text-3)", fontFamily: "'Space Mono', monospace" }}>
          &copy; 2026 AXON INTELLIGENCE GROUP &middot; HELLFIRE CLUB
        </p>
      </footer>
    </div>
  );
}