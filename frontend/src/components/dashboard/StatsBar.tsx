import { Stats, Task } from "@/types";

interface Stat { label: string; value: number; color: string; sub?: string; }

function StatCard({ label, value, color, sub }: Stat & { delay: string }) {
  return (
    <div className="card" style={{ padding:"20px", display:"flex", flexDirection:"column", gap:"12px" }}>
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{label}</div>
      <div style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:"42px", lineHeight:1, color }}>
        {value}
      </div>
      {sub && <div style={{ fontSize:"11px", color:"var(--text-3)" }}>{sub}</div>}
    </div>
  );
}

export default function StatsBar({ stats, overdueTasks }: { stats: any; overdueTasks: Task[] }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
      <StatCard label="Total Tasks"  value={stats?.total ?? 0}          color="var(--text)"   delay="0s"     sub="all stages" />
      <StatCard label="Urgent"       value={stats?.urgent ?? 0}         color="var(--red)"    delay="0.05s"  sub="need action now" />
      <StatCard label="Overdue"      value={overdueTasks.length}         color="var(--yellow)" delay="0.10s"  sub="past deadline" />
      <StatCard label="Completed"    value={stats?.done ?? 0}           color="var(--green)"  delay="0.15s"  sub="shipped ✓" />
    </div>
  );
}
