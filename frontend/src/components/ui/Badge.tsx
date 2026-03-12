const P: Record<string,{bg:string;color:string;border:string}> = {
  urgent: { bg:"rgba(204,34,0,0.1)",   color:"var(--red)",    border:"rgba(204,34,0,0.25)" },
  high:   { bg:"rgba(200,150,12,0.1)", color:"var(--yellow)", border:"rgba(200,150,12,0.25)" },
  medium: { bg:"var(--punch-bg)",       color:"var(--punch)",  border:"var(--punch-bdr)" },
  low:    { bg:"rgba(26,122,74,0.1)",  color:"var(--green)",  border:"rgba(26,122,74,0.25)" },
};
const S: Record<string,{bg:string;color:string;border:string}> = {
  inbox:       { bg:"var(--surface)", color:"var(--text-2)", border:"var(--border)" },
  in_progress: { bg:"rgba(27,79,216,0.1)", color:"var(--blue)", border:"rgba(27,79,216,0.25)" },
  review:      { bg:"rgba(200,150,12,0.1)", color:"var(--yellow)", border:"rgba(200,150,12,0.25)" },
  done:        { bg:"rgba(26,122,74,0.1)", color:"var(--green)", border:"rgba(26,122,74,0.25)" },
};

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const s = P[priority] || P.low;
  return (
    <span className={className} style={{ display:"inline-flex", alignItems:"center", padding:"2px 7px", borderRadius:"2px", fontFamily:"'Space Mono',monospace", fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      {priority}
    </span>
  );
}

export function StatusBadge({ stage }: { stage: string }) {
  const s = S[stage] || S.inbox;
  const labels: Record<string,string> = { inbox:"Inbox", in_progress:"In Progress", review:"Review", done:"Done" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 7px", borderRadius:"2px", fontFamily:"'Space Mono',monospace", fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      {labels[stage] || stage}
    </span>
  );
}
