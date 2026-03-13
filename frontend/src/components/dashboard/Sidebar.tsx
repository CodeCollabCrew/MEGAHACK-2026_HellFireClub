"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Mail, GitBranch, BarChart3, Zap, Loader2, LogIn, LogOut, Sun, Moon, Menu, X } from "lucide-react";
import GmailConnect from "./GmailConnect";
import { useTheme } from "@/context/ThemeContext";

type Tab = "dashboard"|"emails"|"pipeline"|"insights";

interface SidebarProps {
  activeTab: Tab; onTabChange: (t: Tab) => void;
  unreadCount: number; unprocessedCount: number;
  onProcessAll: () => void; processingEmails: boolean;
  onEmailsImported: () => void;
  user: { name: string; email: string } | null;
}

const NAV = [
  { id:"dashboard" as Tab, icon:LayoutDashboard, label:"Overview"  },
  { id:"emails"    as Tab, icon:Mail,            label:"Inbox"     },
  { id:"pipeline"  as Tab, icon:GitBranch,       label:"Pipeline"  },
  { id:"insights"  as Tab, icon:BarChart3,        label:"Insights"  },
];

const SB: React.CSSProperties = {
  width:"220px", background:"var(--surface)", borderRight:"1px solid var(--border)",
  display:"flex", flexDirection:"column", height:"100vh",
  position:"fixed", top:0, left:0, zIndex:30, overflowY:"auto",
  transition:"transform 0.25s ease",
};

export default function Sidebar({ activeTab, onTabChange, unreadCount, unprocessedCount, onProcessAll, processingEmails, onEmailsImported, user }: SidebarProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTab = (t: Tab) => { onTabChange(t); setMobileOpen(false); };

  const content = (
    <>
      {/* Logo */}
      <div style={{ padding:"18px 16px 14px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"30px", height:"30px", background:"var(--punch)", borderRadius:"3px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:"15px", letterSpacing:"-0.02em", color:"var(--text)", lineHeight:1 }}>axon</div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:"2px" }}>AI Workspace</div>
          </div>
        </div>
        {/* Mobile close */}
        <button onClick={()=>setMobileOpen(false)} style={{ display:"none", background:"none", border:"none", cursor:"pointer", color:"var(--text-3)" }} className="mobile-close">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"12px 10px", display:"flex", flexDirection:"column", gap:"2px" }}>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.1em", padding:"4px 10px 10px" }}>Workspace</div>

        {NAV.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => handleTab(id)}
            style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 12px", borderRadius:"3px",
              fontSize:"13px", fontWeight:500, cursor:"pointer", border:"1px solid transparent",
              background: activeTab===id ? "var(--punch-bg)" : "transparent",
              color: activeTab===id ? "var(--punch)" : "var(--text-2)",
              borderColor: activeTab===id ? "var(--punch-bdr)" : "transparent",
              transition:"all 0.12s", width:"100%", textAlign:"left" }}>
            <Icon size={14} strokeWidth={activeTab===id ? 2.5 : 1.8} />
            <span style={{ flex:1 }}>{label}</span>
            {id==="emails" && unreadCount>0 && (
              <span style={{ background:"var(--punch)", color:"#fff", fontSize:"10px", fontFamily:"'Space Mono',monospace", fontWeight:700, padding:"1px 6px", borderRadius:"2px" }}>
                {unreadCount>9?"9+":unreadCount}
              </span>
            )}
          </button>
        ))}

        {/* Status */}
        <div style={{ marginTop:"14px", paddingTop:"14px", borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:"6px" }}>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.1em", padding:"0 10px 4px" }}>Status</div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"7px 10px", borderRadius:"3px", background:"var(--card)", border:"1px solid var(--border)" }}>
            <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"var(--green)" }} />
            <span style={{ fontSize:"12px", color:"var(--text-2)" }}>Online</span>
          </div>
          {unprocessedCount>0 && (
            <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"7px 10px", borderRadius:"3px", background:"var(--punch-bg)", border:"1px solid var(--punch-bdr)" }}>
              <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"var(--punch)" }} />
              <span style={{ fontSize:"12px", color:"var(--punch)" }}>{unprocessedCount} awaiting AI</span>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom */}
      <div style={{ padding:"12px 10px", borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:"8px" }}>
        <GmailConnect onImported={onEmailsImported} />
        <button onClick={onProcessAll} disabled={processingEmails} className="btn-punch"
          style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 14px", fontSize:"13px", opacity:processingEmails?0.6:1 }}>
          {processingEmails ? <Loader2 size={13} className="anim-spin" /> : <Zap size={13} fill="white" color="white" />}
          Process with AI
          {unprocessedCount>0 && (
            <span style={{ marginLeft:"auto", background:"rgba(255,255,255,0.2)", fontFamily:"'Space Mono',monospace", fontSize:"11px", padding:"1px 6px", borderRadius:"2px" }}>
              {unprocessedCount}
            </span>
          )}
        </button>
        <div style={{ height:"1px", background:"var(--border)" }} />
        {user ? (
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <div style={{ width:"28px", height:"28px", borderRadius:"3px", background:"var(--punch-bg)", border:"1px solid var(--punch-bdr)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"var(--punch)", fontFamily:"'Space Mono',monospace", fontSize:"12px", fontWeight:700 }}>
              {user.name[0].toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"12px", fontWeight:500, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email.split("@")[0]}</div>
            </div>
            <button onClick={toggle} className="btn-outline" style={{ width:"28px", height:"28px", padding:0, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {theme==="dark" ? <Sun size={12}/> : <Moon size={12}/>}
            </button>
            <button onClick={()=>{ localStorage.removeItem("axon_user"); router.push("/login"); }}
              className="btn-outline" style={{ width:"28px", height:"28px", padding:0, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <LogOut size={12} style={{ color:"var(--text-3)" }} />
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", gap:"6px" }}>
            <button onClick={()=>router.push("/login")} className="btn-punch"
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", padding:"8px 12px", fontSize:"12px" }}>
              <LogIn size={12}/> Sign in
            </button>
            <button onClick={toggle} className="btn-outline" style={{ width:"34px", height:"34px", padding:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {theme==="dark" ? <Sun size={13}/> : <Moon size={13}/>}
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{ ...SB, transform: "none" }} className="sidebar-desktop">
        {content}
      </aside>

      {/* Mobile top bar */}
      <div style={{ display:"none", position:"fixed", top:0, left:0, right:0, zIndex:29, background:"var(--surface)", borderBottom:"1px solid var(--border)", padding:"12px 16px", alignItems:"center", justifyContent:"space-between" }} className="mobile-topbar">
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <div style={{ width:"26px", height:"26px", background:"var(--punch)", borderRadius:"3px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span style={{ fontWeight:700, fontSize:"14px", color:"var(--text)" }}>axon</span>
        </div>
        <button onClick={()=>setMobileOpen(true)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-2)", display:"flex" }}>
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div onClick={()=>setMobileOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:28 }} />
          <aside style={{ ...SB, width:"260px", transform:"none" }}>
            <div style={{ padding:"18px 16px 14px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <div style={{ width:"30px", height:"30px", background:"var(--punch)", borderRadius:"3px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <span style={{ fontWeight:700, fontSize:"15px", color:"var(--text)" }}>axon</span>
              </div>
              <button onClick={()=>setMobileOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", display:"flex" }}><X size={18}/></button>
            </div>
            <nav style={{ flex:1, padding:"12px 10px", display:"flex", flexDirection:"column", gap:"2px" }}>
              {NAV.map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => handleTab(id)}
                  style={{ display:"flex", alignItems:"center", gap:"10px", padding:"11px 12px", borderRadius:"3px", fontSize:"14px", fontWeight:500, cursor:"pointer",
                    border:"1px solid transparent", background:activeTab===id?"var(--punch-bg)":"transparent",
                    color:activeTab===id?"var(--punch)":"var(--text-2)", borderColor:activeTab===id?"var(--punch-bdr)":"transparent",
                    width:"100%", textAlign:"left" }}>
                  <Icon size={15} /><span>{label}</span>
                  {id==="emails" && unreadCount>0 && (
                    <span style={{ background:"var(--punch)", color:"#fff", fontSize:"10px", fontFamily:"'Space Mono',monospace", fontWeight:700, padding:"1px 6px", borderRadius:"2px", marginLeft:"auto" }}>
                      {unreadCount>9?"9+":unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div style={{ padding:"12px 10px", borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:"8px" }}>
              <button onClick={onProcessAll} disabled={processingEmails} className="btn-punch"
                style={{ display:"flex", alignItems:"center", gap:"8px", padding:"11px 14px", fontSize:"13px" }}>
                <Zap size={13} fill="white" color="white" /> Process with AI
              </button>
              {user ? (
                <button onClick={()=>{ localStorage.removeItem("axon_user"); router.push("/login"); }}
                  className="btn-outline" style={{ padding:"9px", fontSize:"12px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                  <LogOut size={12}/> Sign out
                </button>
              ) : (
                <button onClick={()=>router.push("/login")} className="btn-punch"
                  style={{ padding:"9px", fontSize:"12px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                  <LogIn size={12}/> Sign in
                </button>
              )}
            </div>
          </aside>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-topbar   { display: flex !important; }
        }
      `}</style>
    </>
  );
}
