"use client";
import { Brain, Clock, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { Task, TaskStage } from "@/types";
import { formatDate, isOverdue } from "@/lib/utils";

const STAGES: TaskStage[] = ["inbox", "in_progress", "review", "done"];
const P_COLOR: Record<string,string> = { urgent:"var(--red)", high:"var(--yellow)", medium:"var(--punch)", low:"var(--green)" };
const P_CLASS: Record<string,string> = { urgent:"chip-urgent", high:"chip-high", medium:"chip-medium", low:"chip-low" };

export default function TaskCard({ task, onMove, onDelete }: {
  task: Task; onMove: (id: string, s: TaskStage) => void; onDelete: (id: string) => void;
}) {
  const idx = STAGES.indexOf(task.stage);
  const overdue = isOverdue(task.deadline, task.stage);
  const accent = P_COLOR[task.priority];

  return (
    <div className="card group" style={{ padding:"14px", borderLeft:`3px solid ${accent}`, transition:"box-shadow 0.15s" }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 4px 16px rgba(0,0,0,0.1)"}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow="none"}}>

      {/* top row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
        <span className={`chip ${P_CLASS[task.priority]}`}>{task.priority}</span>
        {task.aiExtracted && (
          <div style={{ display:"flex", alignItems:"center", gap:"4px", color:"var(--text-3)", fontSize:"11px", fontFamily:"'Space Mono',monospace" }}>
            <Brain size={10} />{Math.round(task.aiConfidence * 100)}%
          </div>
        )}
      </div>

      {/* title */}
      <p style={{ fontSize:"13px", fontWeight:500, lineHeight:1.4, color:"var(--text)", marginBottom:"8px", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
        {task.title}
      </p>

      {/* deadline */}
      {task.deadline && (
        <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"8px", color: overdue ? "var(--red)" : "var(--text-3)" }}>
          <Clock size={10} />
          <span style={{ fontSize:"11px", fontFamily:"'Space Mono',monospace" }}>{overdue && "OVERDUE · "}{formatDate(task.deadline)}</span>
        </div>
      )}

      {/* confidence bar */}
      {task.aiExtracted && (
        <div style={{ height:"2px", background:"var(--border)", borderRadius:"1px", marginBottom:"10px", overflow:"hidden" }}>
          <div style={{ width:`${task.aiConfidence*100}%`, height:"100%", background:accent, transition:"width 0.5s" }} />
        </div>
      )}

      {/* actions */}
      <div style={{ display:"flex", gap:"4px", opacity:0, transition:"opacity 0.15s" }} className="group-hover:opacity-100"
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.opacity="1"}}
        ref={el => { if (el) { const card = el.closest(".card") as HTMLElement; if (card) { card.addEventListener("mouseenter", () => el.style.opacity="1"); card.addEventListener("mouseleave", () => el.style.opacity="0"); } } }}>
        {idx > 0 && (
          <button onClick={() => onMove(task._id, STAGES[idx-1])} className="btn-outline" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"4px", padding:"5px 8px", fontSize:"11px" }}>
            <ArrowLeft size={10} /> Back
          </button>
        )}
        {idx < STAGES.length - 1 && (
          <button onClick={() => onMove(task._id, STAGES[idx+1])} className="btn-punch" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"4px", padding:"5px 8px", fontSize:"11px" }}>
            Next <ArrowRight size={10} />
          </button>
        )}
        <button onClick={() => onDelete(task._id)} className="btn-outline"
          style={{ width:"28px", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--red)"; (e.currentTarget as HTMLElement).style.color="var(--red)"}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--border)"; (e.currentTarget as HTMLElement).style.color="var(--text-2)"}}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
