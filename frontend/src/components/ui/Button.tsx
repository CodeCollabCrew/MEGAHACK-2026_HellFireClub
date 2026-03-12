"use client";
import { Loader2 } from "lucide-react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary"|"secondary"|"ghost"|"danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  type?: "button"|"submit";
}

const STYLES: Record<string,React.CSSProperties> = {
  primary:   { background:"var(--punch)", color:"#fff", border:"1px solid var(--punch)" },
  secondary: { background:"var(--surface)", color:"var(--text-2)", border:"1px solid var(--border)" },
  ghost:     { background:"transparent", color:"var(--text-2)", border:"1px solid var(--border)" },
  danger:    { background:"rgba(204,34,0,0.1)", color:"var(--red)", border:"1px solid rgba(204,34,0,0.3)" },
};

export default function Button({ children, onClick, variant="primary", loading, disabled, icon, className, type="button" }: ButtonProps) {
  return (
    <button type={type} onClick={onClick} disabled={disabled||loading} className={className}
      style={{ ...STYLES[variant], display:"inline-flex", alignItems:"center", gap:"7px", padding:"9px 16px", borderRadius:"3px", fontSize:"13px", fontWeight:600, cursor:"pointer", opacity:(disabled||loading)?0.6:1, transition:"opacity 0.15s", fontFamily:"'Space Grotesk',sans-serif" }}>
      {loading ? <Loader2 size={13} className="anim-spin"/> : icon}
      {children}
    </button>
  );
}
