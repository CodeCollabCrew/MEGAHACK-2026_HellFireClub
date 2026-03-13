"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { authApi, saveToken } from "@/lib/api";

function LoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggle } = useTheme();

  const [mode, setMode]         = useState<"login" | "signup">("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Google OAuth redirect handle
  useEffect(() => {
    const token      = searchParams.get("token");
    const userName   = searchParams.get("name");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      setError(`Google sign-in failed: ${oauthError}`);
      return;
    }

    if (token) {
      saveToken(token); // ✅ cookie + localStorage dono
      if (userName) {
        localStorage.setItem("axon_user", JSON.stringify({ name: decodeURIComponent(userName) }));
      }
      router.replace("/dashboard");
    }
  }, [searchParams]);

  // Email/Password Login or Register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password)             { setError("All fields required."); return; }
    if (mode === "signup" && !name)      { setError("Name required."); return; }
    if (password.length < 8)            { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    try {
      // authApi.login/register ab khud saveToken call karta hai
      if (mode === "login") await authApi.login(email, password);
      else                  await authApi.register(email, password, name);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Guest Login
  const handleGuest = async () => {
    setLoading(true);
    try {
      await authApi.guest(); // khud save karta hai
      router.push("/dashboard");
    } catch {
      setError("Guest login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth
  const handleGoogle = () => {
    window.location.href = authApi.googleUrl();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>
      {/* LEFT PANEL */}
      <div
        style={{
          width: "42%", background: "var(--text)",
          display: "flex", flexDirection: "column",
          justifyContent: "space-between", padding: "40px 48px",
        }}
        className="hidden lg:flex"
      >
        <div>
          <h2 style={{ fontSize: "42px", color: "var(--bg)", fontFamily: "'Instrument Serif', serif", marginBottom: "20px" }}>
            Your inbox, <br />finally understood.
          </h2>
          <p style={{ color: "rgba(240,237,232,0.6)", fontSize: "14px", maxWidth: "280px" }}>
            Axon reads every email, extracts tasks automatically and builds your workflow — so you don't have to.
          </p>
        </div>
        <div style={{ display: "flex", gap: "30px" }}>
          <div>
            <div style={{ fontSize: "28px", color: "var(--punch)" }}>94%</div>
            <div style={{ fontSize: "11px", color: "rgba(240,237,232,0.4)" }}>AI accuracy</div>
          </div>
          <div>
            <div style={{ fontSize: "28px", color: "var(--punch)" }}>2.4×</div>
            <div style={{ fontSize: "11px", color: "rgba(240,237,232,0.4)" }}>faster workflow</div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* TOP BAR */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "20px 32px" }}>
          <button
            onClick={toggle}
            style={{ width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
            {mode === "login" ? "New account" : "Sign in"}
          </button>
        </div>

        {/* FORM */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 32px" }}>
          <div style={{ width: "100%", maxWidth: "360px" }}>
            <h1 style={{ fontSize: "36px", marginBottom: "20px", fontFamily: "'Instrument Serif', serif" }}>
              {mode === "login" ? "Sign in." : "Create account."}
            </h1>

            {/* Google Sign In */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              style={{ width: "100%", padding: "10px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ textAlign: "center", margin: "12px 0", fontSize: "12px", color: "var(--text-3)" }}>or</div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {mode === "signup" && (
                <input
                  type="text" placeholder="Your name"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              )}
              <input
                type="email" placeholder="you@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  style={{ width: "100%" }}
                />
                <button
                  type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <div style={{ color: "var(--red)", fontSize: "13px", padding: "8px 12px", background: "rgba(204,34,0,0.06)", border: "1px solid rgba(204,34,0,0.18)", borderRadius: "3px" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-punch"
                style={{ padding: "11px", fontSize: "14px" }}>
                {loading ? "Loading..." : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div style={{ textAlign: "center", margin: "16px 0", fontSize: "12px", color: "var(--text-3)" }}>or</div>

            <button onClick={handleGuest} disabled={loading} className="btn-outline"
              style={{ width: "100%", padding: "10px", fontSize: "13px" }}>
              Continue as Guest — no sign-in needed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}