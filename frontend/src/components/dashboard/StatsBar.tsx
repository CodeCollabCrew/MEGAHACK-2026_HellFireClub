"use client";
import { motion } from "framer-motion";
import { Task } from "@/types";

interface Stat { label: string; value: number; color: string; sub?: string; gradient?: boolean; }

function StatCard({ label, value, color, sub, index, gradient }: Stat & { index: number }) {
  return (
    <motion.div
      className="card"
      style={{
        padding: "22px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: gradient ? "linear-gradient(135deg, #4A3428 0%, #6B4A3A 100%)" : "var(--white)",
        border: "1px solid var(--border-soft)",
        borderRadius: "18px",
        color: gradient ? "#FFFFF5" : undefined,
        boxShadow: "0 1px 3px rgba(74,52,40,0.06)",
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        y: -4,
        boxShadow: "0 12px 28px rgba(74,52,40,0.12)",
        transition: { duration: 0.2 },
      }}
    >
      <div
        style={{
          fontFamily: "'Space Mono',monospace",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          opacity: gradient ? 0.85 : 1,
          color: gradient ? "rgba(255,255,245,0.9)" : "var(--text-secondary)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Instrument Serif',Georgia,serif",
          fontSize: "42px",
          lineHeight: 1,
          color: gradient ? "#FFFFF5" : color,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: "11px",
            opacity: gradient ? 0.8 : 1,
            color: gradient ? "rgba(255,255,245,0.8)" : "var(--text-secondary)",
          }}
        >
          {sub}
        </div>
      )}
    </motion.div>
  );
}

export default function StatsBar({ stats, overdueTasks }: { stats: any; overdueTasks: Task[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }} className="stats-grid">
      <StatCard label="Total Tasks" value={stats?.total ?? 0} color="var(--text-primary)" index={0} sub="all stages" />
      <StatCard label="Urgent" value={stats?.urgent ?? 0} color="var(--red)" index={1} sub="need action now" />
      <StatCard label="Overdue" value={overdueTasks.length} color="var(--yellow)" index={2} sub="past deadline" />
      <StatCard label="Completed" value={stats?.done ?? 0} color="var(--green)" index={3} sub="shipped ✓" gradient />
    </div>
  );
}
