import { Insights } from "@/types";
export default function EmailStatsCard({ insights }: { insights: Insights }) {
  const { emailStats } = insights;
  const pct = emailStats.total > 0 ? Math.round((emailStats.processed / emailStats.total) * 100) : 0;
  return (
    <div className="card" style={{ padding:"20px" }}>
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"16px" }}>Email Stats</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"16px" }}>
        {[["Total", emailStats.total, "var(--text)"],["Processed", emailStats.processed, "var(--green)"],["Has Actions", emailStats.withActions, "var(--punch)"],["Follow-ups", emailStats.needsFollowUp, "var(--yellow)"]].map(([l,v,c])=>(
          <div key={String(l)} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"3px", padding:"12px" }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"6px" }}>{l}</div>
            <div style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:"28px", color:String(c) }}>{v}</div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", marginBottom:"6px" }}>
          <span>Processing rate</span><span>{pct}%</span>
        </div>
        <div style={{ height:"3px", background:"var(--border)", borderRadius:"2px", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:"var(--green)", transition:"width 0.6s" }} />
        </div>
      </div>
    </div>
  );
}
