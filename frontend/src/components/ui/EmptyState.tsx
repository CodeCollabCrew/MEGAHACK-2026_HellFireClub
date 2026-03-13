export default function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div style={{ padding:"40px 20px", textAlign:"center", border:"2px dashed var(--border)", borderRadius:"4px" }}>
      <div style={{ color:"var(--text-3)", display:"flex", justifyContent:"center", marginBottom:"12px" }}>{icon}</div>
      <p style={{ fontSize:"14px", fontWeight:500, color:"var(--text-2)" }}>{title}</p>
      {description && <p style={{ fontSize:"12px", color:"var(--text-3)", marginTop:"4px" }}>{description}</p>}
    </div>
  );
}
