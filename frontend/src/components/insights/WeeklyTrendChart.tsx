import { Insights } from "@/types";
export default function WeeklyTrendChart({ insights }: { insights: Insights }) {
  const trend = insights.weeklyTrend;
  if (!trend.length) return null;
  const max = Math.max(...trend.map(d=>d.count)) || 1;
  return (
    <div className="card" style={{ padding:"20px" }}>
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"20px" }}>Weekly Activity</div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:"8px", height:"80px" }}>
        {trend.map((d,i) => {
          const h = Math.max(3, (d.count/max)*72);
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"6px" }}>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"var(--text-3)" }}>{d.count||""}</span>
              <div style={{ width:"100%", height:`${h}px`, background:"var(--border)", borderRadius:"2px", cursor:"pointer", transition:"background 0.15s" }}
                onMouseEnter={e=>(e.currentTarget.style.background="var(--punch)")}
                onMouseLeave={e=>(e.currentTarget.style.background="var(--border)")} />
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"var(--text-3)", textTransform:"uppercase" }}>{d._id.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
