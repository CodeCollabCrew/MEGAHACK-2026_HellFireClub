"use client";

const BASE: React.CSSProperties = { width:"100%", padding:"10px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"3px", color:"var(--text)", fontSize:"13px", fontFamily:"'Space Grotesk',sans-serif", outline:"none" };
const LBL: React.CSSProperties = { display:"block", fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"6px" };

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div>
      {label && <label style={LBL}>{label}</label>}
      <input style={BASE} {...props}
        onFocus={e=>(e.target.style.borderColor="var(--punch)")}
        onBlur={e=>(e.target.style.borderColor="var(--border)")} />
    </div>
  );
}

export function Textarea({ label, rows=3, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div>
      {label && <label style={LBL}>{label}</label>}
      <textarea rows={rows} style={{ ...BASE, resize:"vertical" }} {...props}
        onFocus={e=>(e.target.style.borderColor="var(--punch)")}
        onBlur={e=>(e.target.style.borderColor="var(--border)")} />
    </div>
  );
}

export function Select({ label, value, onChange, options }: { label?: string; value: string; onChange: (v:string)=>void; options:{value:string;label:string}[] }) {
  return (
    <div>
      {label && <label style={LBL}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ ...BASE, cursor:"pointer" }}
        onFocus={e=>(e.target.style.borderColor="var(--punch)")}
        onBlur={e=>(e.target.style.borderColor="var(--border)")}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
