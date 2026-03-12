export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div style={{ width:size, height:size, border:"2px solid var(--border)", borderTopColor:"var(--punch)", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
  );
}

export function FullPageLoader({ message }: { message?: string }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"var(--bg)", gap:"16px" }}>
      <Spinner size={28} />
      {message && <p style={{ fontFamily:"'Space Mono',monospace", fontSize:"12px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{message}</p>}
    </div>
  );
}
