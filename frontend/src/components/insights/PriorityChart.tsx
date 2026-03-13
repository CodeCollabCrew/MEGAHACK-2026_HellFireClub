"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Insights, TaskPriority } from "@/types";
import ChartTooltip from "@/components/ui/ChartTooltip";

const C: Record<TaskPriority, string> = {
  urgent: "var(--red)",
  high: "var(--yellow)",
  medium: "var(--punch)",
  low: "var(--green)",
};
const LABELS: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};
const PRIO: TaskPriority[] = ["urgent", "high", "medium", "low"];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const id = p.payload._id as TaskPriority;
  const theory: Record<TaskPriority, string> = {
    urgent: "Tasks that need immediate attention. Missing deadlines can cause critical issues.",
    high: "Important tasks with near-term deadlines. Should be addressed within a few days.",
    medium: "Moderate priority. Plan these after urgent and high items are handled.",
    low: "Lower priority. Can be scheduled when higher-priority work is complete.",
  };
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <p style={{ fontSize: "12px", fontWeight: 600, color: C[id] }}>{LABELS[id]}</p>
      <p style={{ fontSize: "13px", color: "var(--text)" }}>{p.value} tasks</p>
      <p style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "6px", maxWidth: "220px" }}>{theory[id]}</p>
    </div>
  );
};

export default function PriorityChart({ insights }: { insights: Insights }) {
  const data = PRIO.map((p) => ({
    _id: p,
    name: LABELS[p],
    count: insights.tasksByPriority.find((t) => t._id === p)?.count ?? 0,
  }));

  return (
    <ChartTooltip
      title="Tasks by Priority"
      theory="How your tasks are distributed across urgency levels. Higher-priority items should be tackled first to avoid bottlenecks."
    >
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
          By Priority
        </div>
        <div style={{ height: "160px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--punch-bg)" }} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={24}>
                {data.map((d) => (
                  <Cell key={d._id} fill={C[d._id]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartTooltip>
  );
}
