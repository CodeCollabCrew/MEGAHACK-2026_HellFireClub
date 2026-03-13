"use client";
import { RefreshCw } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, onRefresh, refreshing, action }: HeaderProps) {
  const isDash = title === "Overview";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"28px" }} className="anim-up">
      <div>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:"6px" }}>
          {isDash
            ? new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })
            : "Workspace / " + title
          }
        </div>
        <h1 style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize: isDash ? "44px" : "34px", fontWeight:400, lineHeight:1.1, color:"var(--text)" }}>
          {isDash ? greet + "." : title}
        </h1>
        {subtitle && (
          <p style={{ fontSize:"13px", color:"var(--text-2)", marginTop:"6px" }}>{subtitle}</p>
        )}
      </div>
      <div style={{ display:"flex", gap:"8px", alignItems:"center", paddingBottom:"6px" }}>
        {action}
        {onRefresh && (
          <button onClick={onRefresh} disabled={refreshing} className="btn-outline"
            style={{ padding:"7px 14px", fontSize:"12px", display:"flex", alignItems:"center", gap:"6px", opacity: refreshing ? 0.5 : 1 }}>
            <RefreshCw size={12} className={refreshing ? "anim-spin" : ""} />
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}
