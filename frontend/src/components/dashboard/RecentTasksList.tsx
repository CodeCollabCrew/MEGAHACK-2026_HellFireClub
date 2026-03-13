"use client";
import { Task } from "@/types";
import { formatDate, isOverdue } from "@/lib/utils";
import { Inbox } from "lucide-react";

const P_COLOR: Record<string,string> = { urgent:"var(--red)", high:"var(--yellow)", medium:"var(--punch)", low:"var(--green)" };

export default function RecentTasksList({ tasks, onViewPipeline }: { tasks: Task[]; onViewPipeline: () => void }) {
  if (!tasks.length) return (
    <div className="card" style={{ padding:"32px", textAlign:"center" }}>
      <Inbox size={24} style={{ color:"var(--text-3)", margin:"0 auto 8px" }} />
      <p style={{ fontSize:"13px", color:"var(--text-2)" }}>No tasks yet</p>
      <p style={{ fontSize:"11px", color:"var(--text-3)", marginTop:"4px" }}>Process emails to extract tasks</p>
    </div>
  );

  return (
    <div className="card" style={{ padding:"8px" }}>
      {tasks.slice(0, 8).map(task => {
        const overdue = isOverdue(task.deadline, task.stage);
        return (
          <div key={task._id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 10px", borderRadius:"3px", cursor:"default" }}
            onMouseEnter={e=>(e.currentTarget.style.background="var(--surface)")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
            <div style={{ width:"6px", height:"6px", borderRadius:"50%", flexShrink:0, background:P_COLOR[task.priority] }} />
            <span style={{ flex:1, fontSize:"13px", color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.title}</span>
            {task.deadline && (
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color: overdue ? "var(--red)" : "var(--text-3)", flexShrink:0 }}>
                {overdue ? "⚠ " : ""}{formatDate(task.deadline)}
              </span>
            )}
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", fontWeight:700, color:P_COLOR[task.priority], textTransform:"uppercase", flexShrink:0 }}>
              {task.priority.slice(0,3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
