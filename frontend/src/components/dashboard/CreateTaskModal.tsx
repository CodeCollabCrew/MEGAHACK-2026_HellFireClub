"use client";
import { useState } from "react";
import { X, Plus } from "lucide-react";
import { tasksApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function CreateTaskModal({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title:"", description:"", priority:"medium", stage:"inbox", deadline:"" });

  if (!open) return null;

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      await tasksApi.create({ ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : null });
      toast.success("Task created!");
      onCreated(); onClose();
      setForm({ title:"", description:"", priority:"medium", stage:"inbox", deadline:"" });
    } catch { toast.error("Failed to create task"); }
    finally { setLoading(false); }
  };

  const LBL: React.CSSProperties = { display:"block", fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"6px" };
  const INP: React.CSSProperties = { width:"100%", padding:"10px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"3px", color:"var(--text)", fontSize:"13px", fontFamily:"'Space Grotesk',sans-serif", outline:"none" };
  const SEL: React.CSSProperties = { ...INP, cursor:"pointer" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div className="card" style={{ width:"100%", maxWidth:"480px", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px", borderBottom:"1px solid var(--border)" }}>
          <h2 style={{ fontSize:"15px", fontWeight:600, color:"var(--text)" }}>New Task</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", display:"flex" }}><X size={16} /></button>
        </div>
        <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:"16px" }}>
          <div>
            <label style={LBL}>Title *</label>
            <input style={INP} placeholder="What needs to be done?" value={form.title} onChange={e=>set("title",e.target.value)}
              onFocus={e=>(e.target.style.borderColor="var(--punch)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
          </div>
          <div>
            <label style={LBL}>Description</label>
            <textarea style={{ ...INP, resize:"vertical", minHeight:"80px" }} placeholder="Additional context…" value={form.description} onChange={e=>set("description",e.target.value)}
              onFocus={e=>(e.target.style.borderColor="var(--punch)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div>
              <label style={LBL}>Priority</label>
              <select style={SEL} value={form.priority} onChange={e=>set("priority",e.target.value)}>
                {["low","medium","high","urgent"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Stage</label>
              <select style={SEL} value={form.stage} onChange={e=>set("stage",e.target.value)}>
                {[["inbox","Inbox"],["in_progress","In Progress"],["review","Review"],["done","Done"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={LBL}>Deadline (optional)</label>
            <input type="date" style={INP} value={form.deadline} onChange={e=>set("deadline",e.target.value)}
              onFocus={e=>(e.target.style.borderColor="var(--punch)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
          </div>
          <div style={{ display:"flex", gap:"10px", paddingTop:"4px" }}>
            <button onClick={onClose} className="btn-outline" style={{ flex:1, padding:"11px", fontSize:"13px" }}>Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-punch"
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"11px", fontSize:"13px" }}>
              {loading ? <div style={{ width:"14px", height:"14px", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%" }} className="anim-spin" /> : <Plus size={14} />}
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
