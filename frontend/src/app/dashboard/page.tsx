"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, AlertTriangle, ChevronRight, LogIn } from "lucide-react";

import { useTasks }    from "@/hooks/useTasks";
import { useEmails }   from "@/hooks/useEmails";
import { usePipeline } from "@/hooks/usePipeline";
import { useInsights } from "@/hooks/useInsights";

import Sidebar            from "@/components/dashboard/Sidebar";
import Header             from "@/components/dashboard/Header";
import StatsBar           from "@/components/dashboard/StatsBar";
import CreateTaskModal    from "@/components/dashboard/CreateTaskModal";
import RecentTasksList    from "@/components/dashboard/RecentTasksList";
import EmailList          from "@/components/email/EmailList";
import EmailViewer        from "@/components/email/EmailViewer";
import ExtractionPanel    from "@/components/email/ExtractionPanel";
import KanbanBoard        from "@/components/pipeline/KanbanBoard";
import PriorityChart      from "@/components/insights/PriorityChart";
import WeeklyTrendChart   from "@/components/insights/WeeklyTrendChart";
import EmailStatsCard     from "@/components/insights/EmailStatsCard";
import CompletionRingCard from "@/components/insights/CompletionRingCard";
import { FullPageLoader } from "@/components/ui/Spinner";
import { Email }          from "@/types";
import { isOverdue }      from "@/lib/utils";

type Tab = "dashboard"|"emails"|"pipeline"|"insights";

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab]           = useState<Tab>("dashboard");
  const [modal, setModal]       = useState(false);
  const [selEmail, setSelEmail] = useState<Email|null>(null);
  const [booting, setBooting]   = useState(true);
  const [user, setUser]         = useState<{name:string;email:string}|null>(null);

  const { tasks, stats, loading:tLoad, fetchTasks, moveTask }                                      = useTasks();
  const { emails, processingEmailId, processingAll, lastResult, setLastResult, fetchEmails, processOne, processAll } = useEmails();
  const { pipeline, loading:pLoad, fetchPipeline, moveTask:movePipeTask, deleteTask:delPipeTask }  = usePipeline();
  const { insights, loading:iLoad, fetchInsights }                                                 = useInsights();

  useEffect(() => {
    const s = localStorage.getItem("axon_user");
    if (s) setUser(JSON.parse(s));
    Promise.all([fetchTasks(), fetchEmails()]).finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (tab==="pipeline") fetchPipeline();
    if (tab==="insights") fetchInsights();
  }, [tab]);

  const handleProcessEmail = async (email: Email) => {
    const r = await processOne(email);
    if (r) { setSelEmail(email); fetchTasks(); }
  };

  const unread      = emails.filter(e=>!e.isRead).length;
  const unprocessed = emails.filter(e=>!e.isProcessed).length;
  const urgentTasks = tasks.filter(t=>t.priority==="urgent"&&t.stage!=="done");
  const overdue     = tasks.filter(t=>isOverdue(t.deadline,t.stage));

  if (booting) return <FullPageLoader message="Loading workspace…" />;

  return (
    <>
      <style>{`
        .dash-main { margin-left: 220px; }
        @media (max-width: 768px) {
          .dash-main { margin-left: 0; padding-top: 56px; }
          .two-col   { grid-template-columns: 1fr !important; }
          .three-col { grid-template-columns: 1fr !important; }
          .four-col  { grid-template-columns: 1fr 1fr !important; }
          .email-grid{ grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg)" }}>
        <Sidebar activeTab={tab} onTabChange={setTab} unreadCount={unread} unprocessedCount={unprocessed}
          onProcessAll={processAll} processingEmails={processingAll} onEmailsImported={fetchEmails} user={user} />

        <main className="dash-main" style={{ flex:1, minHeight:"100vh" }}>

          {/* ══ OVERVIEW ══ */}
          {tab==="dashboard" && (
            <div style={{ padding:"28px 28px", maxWidth:"920px" }} className="anim-up">
              <Header title="Overview"
                subtitle={urgentTasks.length ? `${urgentTasks.length} urgent · ${overdue.length} overdue` : "All clear ✓"}
                onRefresh={()=>Promise.all([fetchTasks(),fetchEmails()])} refreshing={tLoad} />

              {!user && (
                <div style={{ padding:"14px 18px", borderRadius:"4px", background:"var(--punch-bg)", border:"1px solid var(--punch-bdr)", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px", gap:"12px", flexWrap:"wrap" }}>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:600, color:"var(--punch)" }}>Browsing as guest</div>
                    <div style={{ fontSize:"12px", color:"var(--text-2)", marginTop:"2px" }}>Sign in to save data & connect Gmail</div>
                  </div>
                  <button onClick={()=>router.push("/login")} className="btn-punch"
                    style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 16px", fontSize:"13px", whiteSpace:"nowrap" }}>
                    <LogIn size={13}/> Sign in
                  </button>
                </div>
              )}

              <StatsBar stats={stats} overdueTasks={overdue} />

              {urgentTasks.length>0 && (
                <div style={{ marginTop:"16px", padding:"14px 16px", borderRadius:"4px", background:"rgba(204,34,0,0.06)", border:"1px solid rgba(204,34,0,0.18)", borderLeft:"3px solid var(--red)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
                    <AlertTriangle size={14} style={{ color:"var(--red)" }}/>
                    <span style={{ fontSize:"13px", fontWeight:600, color:"var(--red)" }}>{urgentTasks.length} urgent task{urgentTasks.length>1?"s":""}</span>
                  </div>
                  {urgentTasks.slice(0,3).map(t=>(
                    <div key={t._id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"3px 0", fontSize:"13px" }}>
                      <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"var(--red)", flexShrink:0 }}/>
                      <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"var(--text-2)" }}>{t.title}</span>
                      <button onClick={()=>setTab("pipeline")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--red)", fontSize:"11px", fontFamily:"'Space Mono',monospace", display:"flex", alignItems:"center", gap:"2px" }}>
                        Open<ChevronRight size={10}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginTop:"20px" }} className="two-col">
                <div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                    <span style={{ fontSize:"13px", fontWeight:600, color:"var(--text)" }}>Recent Tasks</span>
                    <button onClick={()=>setModal(true)} className="btn-outline"
                      style={{ display:"flex", alignItems:"center", gap:"5px", padding:"5px 10px", fontSize:"12px" }}>
                      <Plus size={12}/> New
                    </button>
                  </div>
                  <RecentTasksList tasks={tasks} onViewPipeline={()=>setTab("pipeline")} />
                </div>
                <div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                    <span style={{ fontSize:"13px", fontWeight:600, color:"var(--text)" }}>Recent Emails</span>
                    <button onClick={()=>setTab("emails")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--punch)", fontSize:"11px", fontFamily:"'Space Mono',monospace", display:"flex", alignItems:"center", gap:"3px" }}>
                      All<ChevronRight size={11}/>
                    </button>
                  </div>
                  <div className="card" style={{ padding:"8px" }}>
                    {emails.length===0 && (
                      <p style={{ padding:"20px", textAlign:"center", fontSize:"12px", color:"var(--text-3)" }}>Connect Gmail to see emails →</p>
                    )}
                    {emails.slice(0,6).map(email=>(
                      <div key={email._id} onClick={()=>{setSelEmail(email);setTab("emails");}}
                        style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px", borderRadius:"3px", cursor:"pointer" }}
                        onMouseEnter={e=>(e.currentTarget.style.background="var(--surface)")}
                        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                        <div style={{ width:"6px", height:"6px", borderRadius:"50%", flexShrink:0, background:email.isProcessed?"var(--green)":"var(--punch)"}}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:"13px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"var(--text)", fontWeight:!email.isRead?600:400 }}>{email.subject}</p>
                          <p style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{email.from}</p>
                        </div>
                        {email.isProcessed&&email.hasActionItems&&(
                          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--punch)", flexShrink:0 }}>{email.extractedTaskIds.length}t</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ EMAILS ══ */}
          {tab==="emails" && (
            <div style={{ padding:"28px" }} className="anim-up">
              <Header title="Inbox" subtitle={`${unprocessed} unprocessed · ${emails.length} total`} onRefresh={fetchEmails}/>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 3fr", gap:"16px" }} className="email-grid">
                <div style={{ maxHeight:"calc(100vh - 130px)", overflowY:"auto", paddingRight:"4px" }}>
                  <EmailList emails={emails} selectedEmail={selEmail} onSelect={setSelEmail} onProcess={handleProcessEmail} processingEmailId={processingEmailId}/>
                </div>
                <div>
                  {lastResult
                    ? <ExtractionPanel result={lastResult} onClose={()=>setLastResult(null)}/>
                    : <EmailViewer email={selEmail} onProcess={handleProcessEmail} processingEmailId={processingEmailId}/>
                  }
                </div>
              </div>
            </div>
          )}

          {/* ══ PIPELINE ══ */}
          {tab==="pipeline" && (
            <div style={{ padding:"28px" }} className="anim-up">
              <Header title="Pipeline" subtitle={`${tasks.length} tasks · ${overdue.length} overdue`} onRefresh={fetchPipeline} refreshing={pLoad}
                action={<button onClick={()=>setModal(true)} className="btn-outline" style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", fontSize:"12px" }}><Plus size={12}/> Add Task</button>}/>
              <KanbanBoard pipeline={pipeline} onMove={movePipeTask} onDelete={delPipeTask} loading={pLoad}/>
            </div>
          )}

          {/* ══ INSIGHTS ══ */}
          {tab==="insights" && (
            <div style={{ padding:"28px", maxWidth:"960px" }} className="anim-up">
              <Header title="Insights" subtitle="AI-powered analytics" onRefresh={fetchInsights} refreshing={iLoad}/>
              {insights ? (
                <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px" }} className="three-col">
                    <CompletionRingCard insights={insights}/>
                    <EmailStatsCard insights={insights}/>
                    <PriorityChart insights={insights}/>
                  </div>
                  <WeeklyTrendChart insights={insights}/>
                  <div className="card" style={{ padding:"20px" }}>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"14px" }}>Pipeline</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px" }} className="four-col">
                      {[["inbox","Inbox","var(--text-3)"],["in_progress","In Progress","var(--blue)"],["review","Review","var(--yellow)"],["done","Done","var(--green)"]].map(([id,lbl,c])=>{
                        const cnt = insights.tasksByStage.find(s=>s._id===id)?.count??0;
                        return (
                          <div key={id} className="card" style={{ padding:"14px", textAlign:"center" }}>
                            <div style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:"32px", color:c }}>{cnt}</div>
                            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"var(--text-3)", marginTop:"4px", textTransform:"uppercase", letterSpacing:"0.06em" }}>{lbl}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", justifyContent:"center", padding:"80px" }}>
                  <div style={{ width:"28px", height:"28px", border:"2px solid var(--border)", borderTopColor:"var(--punch)", borderRadius:"50%" }} className="anim-spin"/>
                </div>
              )}
            </div>
          )}
        </main>

        <CreateTaskModal open={modal} onClose={()=>setModal(false)}
          onCreated={()=>{ fetchTasks(); if(tab==="pipeline") fetchPipeline(); }}/>
      </div>
    </>
  );
}
