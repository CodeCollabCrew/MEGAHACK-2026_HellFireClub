"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, size="md" }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "sm"|"md"|"lg";
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key==="Escape" && onClose();
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm:"380px", md:"480px", lg:"600px" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div className="card" style={{ width:"100%", maxWidth:widths[size], maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px", borderBottom:"1px solid var(--border)" }}>
          <h2 style={{ fontSize:"15px", fontWeight:600, color:"var(--text)" }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", display:"flex" }}><X size={16}/></button>
        </div>
        <div style={{ padding:"20px" }}>{children}</div>
      </div>
    </div>
  );
}
