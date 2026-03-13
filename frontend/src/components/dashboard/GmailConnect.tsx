"use client";
import { useState, useEffect } from "react";
import { Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import axios from "axios";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function GmailConnect({ onImported }: { onImported: () => void }) {
  const [status, setStatus] = useState<"idle"|"loading"|"connected"|"error">("idle");
  const [msg, setMsg] = useState("");
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/gmail/auth-url`)  // ← fixed
      .then(r => setConfigured(r.data.data.configured))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("gmail_success")) {
      setStatus("connected"); setMsg(`${p.get("imported")||0} emails imported!`);
      onImported(); window.history.replaceState({}, "", "/dashboard");
    }
    if (p.get("gmail_error")) {
      setStatus("error"); setMsg(p.get("gmail_error") || "Error");
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [onImported]);

  if (!configured) return (
    <div style={{ padding:"9px 12px", borderRadius:"3px", background:"var(--surface)", border:"1px solid var(--border)", display:"flex", alignItems:"flex-start", gap:"8px" }}>
      <AlertCircle size={12} style={{ color:"var(--yellow)", flexShrink:0, marginTop:"1px" }} />
      <p style={{ fontSize:"11px", color:"var(--text-3)", lineHeight:1.4 }}>Add <code style={{ fontFamily:"'Space Mono',monospace" }}>GOOGLE_CLIENT_ID</code> to .env for real Gmail</p>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
      {msg && <p style={{ fontSize:"11px", padding:"4px 8px", borderRadius:"2px", color: status === "connected" ? "var(--green)" : "var(--red)" }}>{msg}</p>}
      <button onClick={async () => {
        setStatus("loading");
        try {
          const r = await axios.get(`${API}/api/gmail/auth-url`);  // ← fixed
          if (r.data.data.url) window.location.href = r.data.data.url;
          else { setStatus("error"); setMsg("Not configured"); }
        } catch { setStatus("error"); setMsg("Backend unreachable"); }
      }} disabled={status === "loading" || status === "connected"} className="btn-outline"
        style={{ display:"flex", alignItems:"center", gap:"7px", padding:"8px 12px", fontSize:"12px", opacity: (status === "loading" || status === "connected") ? 0.6 : 1 }}>
        {status === "loading" ? <Loader2 size={12} className="anim-spin" /> : status === "connected" ? <CheckCircle2 size={12} style={{ color:"var(--green)" }} /> : <Mail size={12} style={{ color:"#DB4437" }} />}
        {status === "connected" ? "Gmail Connected" : status === "loading" ? "Connecting..." : "Connect Gmail"}
      </button>
    </div>
  );
}