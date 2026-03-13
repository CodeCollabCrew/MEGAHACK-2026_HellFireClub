"use client";
import { Insights } from "@/types";
import ChartTooltip from "@/components/ui/ChartTooltip";

const METRICS: [string, keyof Insights["emailStats"], string, string][] = [
  ["Total", "total", "var(--text)", "All emails synced from your inbox. The full volume of incoming mail."],
  ["Processed", "processed", "var(--green)", "Emails analyzed by AI. Processed emails have been scanned for tasks."],
  ["Has Actions", "withActions", "var(--punch)", "Emails that contained actionable tasks. These were turned into pipeline items."],
  ["Follow-ups", "needsFollowUp", "var(--yellow)", "Emails waiting for your reply. Senders may be expecting a response."],
];

export default function EmailStatsCard({ insights }: { insights: Insights }) {
  const { emailStats } = insights;
  const pct = emailStats.total > 0 ? Math.round((emailStats.processed / emailStats.total) * 100) : 0;

  return (
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
          Email Stats
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          {METRICS.map(([label, key, color, theory]) => (
            <ChartTooltip key={label} title={label} theory={theory}>
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "14px",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--punch)";
                  e.currentTarget.style.background = "var(--punch-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--surface)";
                }}
              >
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "9px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                  {label}
                </div>
                <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "28px", color }}>{emailStats[key]}</div>
              </div>
            </ChartTooltip>
          ))}
        </div>
        <ChartTooltip title="Processing rate" theory="Share of emails that have been processed by AI. Higher is better — it means your inbox is under control.">
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--text-3)", marginBottom: "6px" }}>
              <span>Processing rate</span>
              <span>{pct}%</span>
            </div>
            <div style={{ height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "var(--green)", transition: "width 0.6s", borderRadius: "3px" }} />
            </div>
          </div>
        </ChartTooltip>
      </div>
  );
}
