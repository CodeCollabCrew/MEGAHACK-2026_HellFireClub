"use client";
import { useState } from "react";
import { Send, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SentMail {
  _id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

export default function SentMailsList({ mails }: { mails: SentMail[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (mails.length === 0) return (
    <div style={{ padding: "32px", textAlign: "center" }}>
      <Send size={24} style={{ color: "var(--text-3)", margin: "0 auto 10px" }} />
      <p style={{ fontSize: "13px", color: "var(--text-3)" }}>No follow-up emails sent yet</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {mails.map(mail => (
        <div key={mail._id} className="card" style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
            onClick={() => setExpanded(expanded === mail._id ? null : mail._id)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                <Send size={11} style={{ color: "var(--green)", flexShrink: 0 }} />
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mail.subject}</p>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-3)", fontFamily: "'Space Mono',monospace" }}>
                To: {mail.to} · {formatDate(mail.sentAt)}
              </p>
            </div>
            {expanded === mail._id ? <ChevronUp size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />}
          </div>

          {expanded === mail._id && (
            <div style={{ marginTop: "12px", padding: "12px", background: "var(--surface)", borderRadius: "3px", border: "1px solid var(--border)" }}>
              <pre style={{ fontSize: "12px", color: "var(--text-2)", whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.6, margin: 0 }}>{mail.body}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}