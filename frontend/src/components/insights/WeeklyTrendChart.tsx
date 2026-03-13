"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Insights } from "@/types";
import ChartTooltip from "@/components/ui/ChartTooltip";

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--punch)" }}>{p.payload.label || p.payload._id}</p>
      <p style={{ fontSize: "13px", color: "var(--text)" }}>{p.value} completions</p>
      <p style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "6px" }}>
        Tasks completed on this day. Spikes indicate high productivity.
      </p>
    </div>
  );
};

function formatLabel(id: string): string {
  const m = id.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return id;
  const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export default function WeeklyTrendChart({ insights }: { insights: Insights }) {
  const trend = insights.weeklyTrend || [];
  const data = trend.map((d) => ({
    ...d,
    label: formatLabel(d._id),
  }));

  if (!data.length) return null;

  return (
    <ChartTooltip
      title="Weekly Activity"
      theory="Task completion trend over the past week. Helps you see productivity patterns and plan ahead."
    >
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px" }}>
          Weekly Activity
        </div>
        <div style={{ height: "180px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--punch)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--punch)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="var(--punch)" strokeWidth={2} fill="url(#areaFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartTooltip>
  );
}
