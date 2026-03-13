import { Insights, TaskPriority } from "@/types";
const C: Record<TaskPriority,string> = { urgent:"var(--red)", high:"var(--yellow)", medium:"var(--punch)", low:"var(--green)" };
const PRIO: TaskPriority[] = ["urgent","high","medium","low"];
export default function PriorityChart({ insights }: { insights: Insights }) {
  const total = insights.tasksByPriority.reduce((a,b) => a + b.count, 0) || 1;
  return (
    <div className="card" style={{ padding:"20px" }}>
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"16px" }}>By Priority</div>
      <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
        {PRIO.map(p => {
          const count = insights.tasksByPriority.find(t=>t._id===p)?.count ?? 0;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={p}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:C[p], textTransform:"uppercase", letterSpacing:"0.06em" }}>{p}</span>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)" }}>{count}</span>
              </div>
              <div style={{ height:"3px", background:"var(--border)", borderRadius:"2px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:C[p], transition:"width 0.6s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
