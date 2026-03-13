"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function LoginPage() {
    const router = useRouter();
    const { theme, toggle } = useTheme();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    const API = BASE_URL.endsWith("/api") ? BASE_URL : `${BASE_URL}/api`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email || !password) { setError("All fields required."); return; }
        if (mode === "signup" && !name) { setError("Name is required."); return; }
        setLoading(true);
        try {
            const endpoint = mode === "signup" ? "/auth/register" : "/auth/login";
            const body: any = { email, password };
            if (mode === "signup") body.name = name;

            const res = await fetch(`${API}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!data.success) { setError(data.message || "Something went wrong"); setLoading(false); return; }

            localStorage.setItem("axon_user", JSON.stringify({ id: data.data.id, email: data.data.email, name: data.data.name, role: data.data.role }));
            router.push("/admin");
        } catch (err) {
            setError("Could not connect to server. Try again.");
            setLoading(false);
        }
    };

    const handleGuest = () => {
        localStorage.setItem("axon_user", JSON.stringify({ email: "guest@axon.ai", name: "Guest" }));
        router.push("/admin");
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>

            {/* ─── LEFT: brand panel ────────────────────────── */}
            <div style={{
                width: "42%", background: "var(--text)", display: "flex",
                flexDirection: "column", justifyContent: "space-between",
                padding: "40px 48px", position: "relative", overflow: "hidden",
            }} className="hidden lg:flex">

                {/* decorative cross marks */}
                {[["-10%", "20%"], ["-5%", "70%"], ["80%", "10%"], ["85%", "55%"], ["40%", "85%"]].map(([l, t], i) => (
                    <div key={i} style={{ position: "absolute", left: l, top: t, opacity: 0.08, color: "var(--bg)", fontSize: "32px", fontFamily: "monospace" }}>+</div>
                ))}
                {/* big circle */}
                <div style={{
                    position: "absolute", right: "-80px", top: "50%", transform: "translateY(-50%)",
                    width: "320px", height: "320px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)"
                }} />
                <div style={{
                    position: "absolute", right: "-40px", top: "50%", transform: "translateY(-50%)",
                    width: "180px", height: "180px", borderRadius: "50%", background: "var(--punch)", opacity: 0.12
                }} />

                {/* logo */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", zIndex: 1 }}>
                    <div style={{
                        width: "36px", height: "36px", background: "var(--punch)", borderRadius: "3px",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" strokeWidth="0" />
                        </svg>
                    </div>
                    <span style={{ color: "var(--bg)", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "-0.02em" }}>
                        axon
                    </span>
                </div>

                {/* headline */}
                <div style={{ zIndex: 1 }}>
                    <div style={{ width: "32px", height: "2px", background: "var(--punch)", marginBottom: "24px" }} />
                    <h2 style={{
                        fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "52px", lineHeight: 1.1,
                        color: "var(--bg)", fontWeight: 400, marginBottom: "20px"
                    }}>
                        Your inbox,<br /><em>finally</em><br />understood.
                    </h2>
                    <p style={{ color: "rgba(240,237,232,0.5)", fontSize: "14px", lineHeight: 1.6, maxWidth: "280px" }}>
                        Axon reads every email, extracts tasks automatically, and builds your workflow — so you don't have to.
                    </p>
                </div>

                {/* stats row */}
                <div style={{ display: "flex", gap: "36px", zIndex: 1 }}>
                    {[["94%", "AI accuracy"], ["2.4×", "faster workflow"], ["∞", "emails processed"]].map(([v, l]) => (
                        <div key={l}>
                            <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "28px", color: "var(--punch)" }}>{v}</div>
                            <div style={{ fontSize: "11px", color: "rgba(240,237,232,0.4)", marginTop: "2px", fontFamily: "'Space Mono',monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>{l}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── RIGHT: form panel ────────────────────────── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

                {/* top bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", padding: "20px 32px" }}>
                    <button onClick={toggle} className="btn-outline" style={{ width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, borderRadius: "3px" }}>
                        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                    <button
                        onClick={() => setMode(mode === "login" ? "signup" : "login")}
                        className="btn-outline"
                        style={{ padding: "6px 16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        {mode === "login" ? "New account" : "Sign in"}
                        <ArrowRight size={13} />
                    </button>
                </div>

                {/* form area */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 32px" }}>
                    <div style={{ width: "100%", maxWidth: "360px" }} className="anim-up">

                        {/* heading */}
                        <div style={{ marginBottom: "32px" }}>
                            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>
                                — {mode === "login" ? "Welcome back" : "Get started"}
                            </div>
                            <h1 style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "38px", fontWeight: 400, lineHeight: 1.1, color: "var(--text)" }}>
                                {mode === "login" ? "Sign in." : "Create account."}
                            </h1>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {mode === "signup" && (
                                <div className="anim-up">
                                    <label style={{ display: "block", fontSize: "11px", fontFamily: "'Space Mono',monospace", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Name</label>
                                    <input className="input-base" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                                </div>
                            )}

                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontFamily: "'Space Mono',monospace", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Email</label>
                                <input className="input-base" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontFamily: "'Space Mono',monospace", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Password</label>
                                <div style={{ position: "relative" }}>
                                    <input className="input-base" type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: "42px" }} />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div style={{ padding: "10px 14px", borderRadius: "3px", background: "rgba(204,34,0,0.08)", border: "1px solid rgba(204,34,0,0.2)", color: "var(--red)", fontSize: "13px" }}>
                                    {error}
                                </div>
                            )}

                            <button type="submit" disabled={loading} className="btn-punch"
                                style={{ padding: "12px 20px", fontSize: "14px", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                {loading
                                    ? <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%" }} className="anim-spin" />
                                    : <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={15} /></>
                                }
                            </button>
                        </form>

                        {/* divider */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
                            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                            <span style={{ fontSize: "11px", fontFamily: "'Space Mono',monospace", color: "var(--text-3)" }}>or</span>
                            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                        </div>

                        {/* guest */}
                        <button onClick={handleGuest} className="btn-outline"
                            style={{ width: "100%", padding: "11px", fontSize: "13px", textAlign: "center" }}>
                            Continue as Guest — no sign-in needed
                        </button>

                        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-3)", marginTop: "20px" }}>
                            {mode === "login" ? "No account? " : "Have an account? "}
                            <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--punch)", fontWeight: 600, fontSize: "12px" }}>
                                {mode === "login" ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}