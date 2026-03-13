"use client";
import { Insights } from "@/types";
import ChartTooltip from "@/components/ui/ChartTooltip";

export default function CompletionRingCard({ insights }: { insights: Insights }) {
  const { completionRate, recentCompletions } = insights;
  const r = 42,
    circ = 2 * Math.PI * r;
  const offset = circ - (completionRate / 100) * circ;

  return (
    <ChartTooltip
      title="Completion Rate"
      theory="Percentage of all tasks that have been marked done. A higher rate indicates good follow-through on commitments."
    >
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
          Completion
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}>
          <div style={{ position: "relative", width: "96px", height: "96px", flexShrink: 0 }}>
            <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle
                cx="48"
                cy="48"
                r={r}
                fill="none"
                stroke="var(--punch)"
                strokeWidth="8"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>
                {completionRate}%
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "38px", color: "var(--punch)" }}>
              {completionRate}%
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "2px" }}>of tasks done</div>
          </div>
        </div>
        {recentCompletions.slice(0, 3).map((t) => (
          <div key={t._id} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "4px 0", fontSize: "12px" }}>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-2)" }}>
              {t.title}
            </span>
          </div>
        ))}
      </div>
    </ChartTooltip>
  );
}
