"use client";
import { Brain, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { ExtractionResult } from "@/types";
import { formatDate } from "@/lib/utils";

const P_COLOR: Record<string,string> = { urgent:"var(--red)", high:"var(--yellow)", medium:"var(--punch)", low:"var(--green)" };

export default function ExtractionPanel({ result, onClose }: { result: ExtractionResult | null; onClose: () => void }) {
  if (!result) return null;
  const { extraction, createdTasks = [] } = result;
  if (!extraction) return null;

  const tasks = extraction.tasks || [];
  const summary = extraction.summary || "";
  const needsFollowUp = extraction.needsFollowUp || false;

  return (
    <div className="card" style={{ borderColor:"var(--punch-bdr)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"30px", height:"30px", borderRadius:"3px", background:"var(--punch-bg)", border:"1px solid var(--punch-bdr)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Brain size={14} style={{ color:"var(--punch)" }} />
          </div>
          <div>
            <p style={{ fontSize:"13px", fontWeight:600, color:"var(--text)" }}>AI Extraction Complete</p>
            <p style={{ fontSize:"11px", color:"var(--text-3)" }}>{createdTasks.length} task{createdTasks.length !== 1 ? "s" : ""} created</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", display:"flex" }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding:"18px", display:"flex", flexDirection:"column", gap:"14px", maxHeight:"500px", overflowY:"auto" }}>
        <div style={{ padding:"12px", background:"var(--punch-bg)", border:"1px solid var(--punch-bdr)", borderRadius:"3px" }}>
          <p style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--punch)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"6px" }}>Summary</p>
          <p style={{ fontSize:"13px", color:"var(--text-2)", lineHeight:1.5 }}>{summary}</p>
        </div>

        {tasks.length === 0 ? (
          <div style={{ textAlign:"center", padding:"24px" }}>
            <CheckCircle2 size={24} style={{ color:"var(--green)", margin:"0 auto 8px" }} />
            <p style={{ fontSize:"13px", color:"var(--text-2)" }}>No action items found</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Extracted Tasks</p>
            {tasks.map((task, i) => (
              <div key={i} className="card" style={{ padding:"14px", borderLeft:`3px solid ${P_COLOR[task.priority]}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
                  <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", fontWeight:700, color:P_COLOR[task.priority], textTransform:"uppercase", letterSpacing:"0.06em" }}>{task.priority}</span>
                  {task.deadline && <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)" }}>📅 {formatDate(task.deadline)}</span>}
                  <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", marginLeft:"auto" }}>{Math.round(task.confidence*100)}% conf.</span>
                </div>
                <p style={{ fontSize:"13px", fontWeight:600, color:"var(--text)", marginBottom:"6px" }}>{task.title}</p>
                {task.description && <p style={{ fontSize:"12px", color:"var(--text-2)", lineHeight:1.5, marginBottom:"8px" }}>{task.description}</p>}
                <div style={{ padding:"8px 10px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"2px" }}>
                  <p style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"var(--text-3)", textTransform:"uppercase", marginBottom:"4px" }}>AI Reasoning</p>
                  <p style={{ fontSize:"11px", color:"var(--text-3)", fontStyle:"italic", lineHeight:1.5 }}>"{task.reasoning}"</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {needsFollowUp && (
          <div style={{ display:"flex", gap:"8px", padding:"12px", background:"rgba(200,150,12,0.08)", border:"1px solid rgba(200,150,12,0.25)", borderRadius:"3px" }}>
            <AlertTriangle size={14} style={{ color:"var(--yellow)", flexShrink:0, marginTop:"1px" }} />
            <div>
              <p style={{ fontSize:"12px", fontWeight:600, color:"var(--yellow)" }}>Follow-up Detected</p>
              <p style={{ fontSize:"11px", color:"var(--text-2)", marginTop:"2px" }}>Sender may be expecting a reply.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}