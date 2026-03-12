export function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`card ${className||""}`} style={style}>{children}</div>;
}
export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div style={{ padding:"16px 18px", borderBottom:"1px solid var(--border)" }}>{children}</div>;
}
export function CardBody({ children }: { children: React.ReactNode }) {
  return <div style={{ padding:"16px 18px" }}>{children}</div>;
}
