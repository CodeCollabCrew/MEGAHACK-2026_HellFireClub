"use client";
import { Brain, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Email } from "@/types";
import { timeAgo } from "@/lib/utils";

interface Props {
  emails: Email[];
  selectedEmail: Email | null;
  onSelect: (e: Email) => void;
  onProcess: (e: Email) => void;
  processingEmailId: string | null;
}

export default function EmailList({ emails, selectedEmail, onSelect, onProcess, processingEmailId }: Props) {
  if (!emails.length) return (
    <div style={{ padding:"32px", textAlign:"center", border:"2px dashed var(--border)", borderRadius:"4px" }}>
      <Mail size={28} style={{ color:"var(--text-3)", marginBottom:"10px" }} />
      <p style={{ fontSize:"13px", color:"var(--text-2)", fontWeight:500 }}>No emails yet</p>
      <p style={{ fontSize:"12px", color:"var(--text-3)", marginTop:"4px" }}>Connect Gmail via the sidebar</p>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
      {emails.map(email => {
        const active = selectedEmail?._id === email._id;
        return (
          <div key={email._id} onClick={() => onSelect(email)} style={{
            padding:"12px 14px", borderRadius:"4px", cursor:"pointer", transition:"all 0.12s",
            background: active ? "var(--punch-bg)" : "var(--card)",
            border: `1px solid ${active ? "var(--punch-bdr)" : "var(--border)"}`,
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"4px" }}>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"70%" }}>{email.from}</span>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", flexShrink:0 }}>{timeAgo(email.receivedAt)}</span>
            </div>
            <p style={{ fontSize:"13px", fontWeight: !email.isRead ? 600 : 400, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:"4px" }}>
              {email.subject}
            </p>
            <p style={{ fontSize:"11px", color:"var(--text-3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {email.snippet}
            </p>
            {email.isProcessed ? (
              <div style={{ display:"flex", gap:"10px", marginTop:"8px", alignItems:"center" }}>
                <span style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", color:"var(--green)", fontFamily:"'Space Mono',monospace" }}>
                  <CheckCircle2 size={10} /> Done
                </span>
                {email.hasActionItems && (
                  <span style={{ fontSize:"11px", color:"var(--punch)", fontFamily:"'Space Mono',monospace" }}>
                    {email.extractedTaskIds.length} task{email.extractedTaskIds.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            ) : (
              <button onClick={e => { e.stopPropagation(); onProcess(email); }} disabled={processingEmailId === email.emailId}
                style={{ marginTop:"8px", width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
                  padding:"6px", borderRadius:"3px", fontSize:"11px", fontWeight:600,
                  background:"var(--punch-bg)", border:"1px solid var(--punch-bdr)", color:"var(--punch)",
                  cursor:"pointer", opacity: processingEmailId === email.emailId ? 0.6 : 1 }}>
                {processingEmailId === email.emailId
                  ? <><Loader2 size={10} className="anim-spin" /> Analyzing...</>
                  : <><Brain size={10} /> Extract Tasks</>}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
