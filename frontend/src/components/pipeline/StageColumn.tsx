import { Task, TaskStage } from "@/types";
import TaskCard from "./TaskCard";

const COLS: Record<TaskStage, { label:string; dot:string }> = {
  inbox:       { label:"Inbox",       dot:"var(--text-3)" },
  in_progress: { label:"In Progress", dot:"var(--blue)" },
  review:      { label:"Review",      dot:"var(--yellow)" },
  done:        { label:"Done",        dot:"var(--green)" },
};

export default function StageColumn({ stage, tasks, onMove, onDelete }: { stage: TaskStage; tasks: Task[]; onMove: (id:string,s:TaskStage)=>void; onDelete:(id:string)=>void }) {
  const { label, dot } = COLS[stage];
  return (
    <div style={{ flex:1, minWidth:0, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"4px", display:"flex", flexDirection:"column", minHeight:"480px" }}>
      <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:dot }} />
          <span style={{ fontSize:"12px", fontWeight:600, color:"var(--text)" }}>{label}</span>
        </div>
        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"11px", color:"var(--text-3)", background:"var(--card)", border:"1px solid var(--border)", padding:"1px 8px", borderRadius:"2px" }}>
          {tasks.length}
        </span>
      </div>
      <div style={{ flex:1, padding:"10px", display:"flex", flexDirection:"column", gap:"8px", overflowY:"auto" }}>
        {tasks.map(t => <TaskCard key={t._id} task={t} onMove={onMove} onDelete={onDelete} />)}
        {!tasks.length && (
          <div style={{ border:"2px dashed var(--border)", borderRadius:"3px", padding:"28px", textAlign:"center" }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Empty</div>
          </div>
        )}
      </div>
    </div>
  );
}
