"use client";
import { useState, useEffect } from "react";
import { X, Send, Loader2, Zap, RefreshCw } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API = BASE_URL.endsWith("/api") ? BASE_URL : `${BASE_URL}/api`;

interface Props {
  email: { emailId: string; from: string; subject: string } | null;
  onClose: () => void;
  onSent: () => void;
}

type Step = "drafting" | "review" | "sending" | "done";

export default function FollowUpModal({ email, onClose, onSent }: Props) {
  const [step, setStep]       = useState<Step>("drafting");
  const [to, setTo]           = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody]       = useState("");

  const userId = typeof window !== "undefined"
    ? localStorage.getItem("userId") || ""
    : "";

  if (!email) return null;

  const handleDraft = async () => {
    setStep("drafting");
    setBody("");
    try {
      const res = await axios.post(`${API}/gmail/draft-followup`, {
        emailId: email.emailId,
        userId,
      });

      const data = res.data?.data;
      const draft = data?.draft;

      const senderName = email.from.match(/^([^<]+)/)?.[1]?.trim() || "there";
      const myName = userId.split("@")[0];

      setTo(draft?.to || email.from);
      setSubject(draft?.subject || `Re: ${email.subject}`);
      setBody(
        draft?.body ||
        `Hi ${senderName},\n\nThank you for your email regarding "${email.subject}".\n\nI wanted to follow up and ensure we are aligned on the next steps. Please let me know if you need anything further from my end.\n\nLooking forward to your response.\n\nBest regards,\n${myName}`
      );
      setStep("review");
    } catch (err: any) {
      console.error("Draft error:", err.response?.data || err.message);
      // Use fallback draft instead of failing
      const senderName = email.from.match(/^([^<]+)/)?.[1]?.trim() || "there";
      const myName = userId.split("@")[0];
      setTo(email.from);
      setSubject(`Re: ${email.subject}`);
      setBody(
        `Hi ${senderName},\n\nThank you for your email regarding "${email.subject}".\n\nI wanted to follow up and ensure we are aligned on the next steps. Please let me know if you need anything further from my end.\n\nLooking forward to your response.\n\nBest regards,\n${myName}`
      );
      setStep("review");
      toast("Using template draft — AI unavailable", { icon: "⚠️" });
    }
  };

  // Auto-draft on mount
  useEffect(() => { handleDraft(); }, []);

  const handleSend = async () => {
    if (!body.trim()) { toast.error("Message cannot be empty"); return; }
    setStep("sending");
    try {
      await axios.post(`${API}/gmail/send-followup`, {
        userId, emailId: email.emailId, to, subject, body,
      });
      toast.success("Follow-up sent!");
      setStep("done");
      onSent();
      setTimeout(onClose, 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send");
      setStep("review");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div className="card" style={{ width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Zap size={16} style={{ color: "var(--punch)" }} />
            <span style={{ fontSize: "14px", fontWeight: 600 }}>AI Follow-up</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Original email info */}
          <div style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: "3px", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "3px", fontFamily: "'Space Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>Replying to</p>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{email.subject}</p>
            <p style={{ fontSize: "11px", color: "var(--text-3)" }}>{email.from}</p>
          </div>

          {/* Drafting loader */}
          {step === "drafting" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "40px", color: "var(--text-3)" }}>
              <Loader2 size={16} className="anim-spin" />
              <span style={{ fontSize: "13px" }}>AI is writing your follow-up...</span>
            </div>
          )}

          {/* Review / Edit / Sending */}
          {(step === "review" || step === "sending") && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-3)", fontFamily: "'Space Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "5px" }}>To</label>
                  <input value={to} onChange={e => setTo(e.target.value)} style={{ width: "100%", fontSize: "13px" }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-3)", fontFamily: "'Space Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "5px" }}>Subject</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} style={{ width: "100%", fontSize: "13px" }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-3)", fontFamily: "'Space Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "5px" }}>Message</label>
                  <textarea value={body} onChange={e => setBody(e.target.value)}
                    rows={10}
                    style={{ width: "100%", fontSize: "13px", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleSend} disabled={step === "sending"} className="btn-punch"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px" }}>
                  {step === "sending"
                    ? <><Loader2 size={13} className="anim-spin" /> Sending...</>
                    : <><Send size={13} /> Send</>}
                </button>
                <button onClick={handleDraft} disabled={step === "sending"} className="btn-outline"
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "11px 16px", fontSize: "12px" }}>
                  <RefreshCw size={12} /> Regenerate
                </button>
                <button onClick={onClose} disabled={step === "sending"} className="btn-outline"
                  style={{ padding: "11px 16px", fontSize: "12px" }}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* Done */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--green)" }}>
              <Send size={28} style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600 }}>Email sent!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}