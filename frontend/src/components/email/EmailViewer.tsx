"use client";
import { Brain, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Email } from "@/types";
import { timeAgo } from "@/lib/utils";

export default function EmailViewer({ email, onProcess, processingEmailId }: {
  email: Email | null;
  onProcess: (email: Email) => void;
  processingEmailId: string | null;
}) {
  if (!email) return (
    <div style={{ border:"2px dashed var(--border)", borderRadius:"4px", padding:"60px 20px", textAlign:"center" }}>
      <Brain size={28} style={{ color:"var(--text-3)", margin:"0 auto 12px" }} />
      <p style={{ fontSize:"14px", color:"var(--text-2)", fontWeight:500 }}>Select an email</p>
      <p style={{ fontSize:"12px", color:"var(--text-3)", marginTop:"4px" }}>Click any email to view and extract tasks</p>
    </div>
  );

  const busy = processingEmailId === email.emailId;

  return (
    <div className="card" style={{ display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"16px 18px", borderBottom:"1px solid var(--border)" }}>
        <p style={{ fontFamily:"'Space Mono',monospace", fontSize:"11px", color:"var(--text-3)", marginBottom:"6px" }}>{email.from}</p>
        <h3 style={{ fontSize:"15px", fontWeight:600, color:"var(--text)", lineHeight:1.3 }}>{email.subject}</h3>
        <p style={{ fontSize:"11px", color:"var(--text-3)", marginTop:"4px" }}>{timeAgo(email.receivedAt)}</p>
      </div>

      <div style={{ padding:"18px", flex:1, overflowY:"auto", maxHeight:"340px" }}>
        <p style={{ fontSize:"13px", color:"var(--text-2)", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{email.body}</p>
      </div>

      <div style={{ padding:"16px 18px", borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:"10px" }}>
        {email.aiSummary && (
          <div style={{ padding:"12px", background:"var(--punch-bg)", border:"1px solid var(--punch-bdr)", borderRadius:"3px" }}>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--punch)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"6px" }}>AI Summary</p>
            <p style={{ fontSize:"12px", color:"var(--text-2)", lineHeight:1.5 }}>{email.aiSummary}</p>
          </div>
        )}
        {email.needsFollowUp && (
          <div style={{ padding:"10px 12px", background:"rgba(200,150,12,0.08)", border:"1px solid rgba(200,150,12,0.25)", borderRadius:"3px" }}>
            <p style={{ fontSize:"12px", color:"var(--yellow)", fontWeight:600 }}>⚡ Follow-up needed — sender is waiting for a reply</p>
          </div>
        )}
        {!email.isProcessed ? (
          <button onClick={() => onProcess(email)} disabled={busy} className="btn-punch"
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"11px", fontSize:"13px", opacity: busy ? 0.7 : 1 }}>
            {busy ? <Loader2 size={14} className="anim-spin" /> : <Sparkles size={14} />}
            {busy ? "Analyzing with AI…" : "Extract Tasks with AI"}
          </button>
        ) : (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", padding:"10px" }}>
            <CheckCircle2 size={14} style={{ color:"var(--green)" }} />
            <span style={{ fontSize:"12px", color:"var(--green)", fontFamily:"'Space Mono',monospace" }}>
              Processed · {email.extractedTaskIds.length} task{email.extractedTaskIds.length !== 1 ? "s" : ""} extracted
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
