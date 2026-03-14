"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { authApi, saveToken, createDevSession, isDevelopment } from "@/lib/api";

function LoginContent() {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isDark = theme === "dark";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userName = params.get("name");
    const oauthError = params.get("error");

    if (oauthError) {
      setError(`Google sign-in failed: ${oauthError}`);
      return;
    }

    if (token) {
      saveToken(token);
      if (userName) {
        localStorage.setItem("axon_user", JSON.stringify({ name: decodeURIComponent(userName) }));
      }
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("All fields required.");
      return;
    }
    if (mode === "signup" && !name) {
      setError("Name required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") await authApi.login(email, password);
      else await authApi.register(email, password, name);
      router.push("/dashboard");
    } catch (err: any) {
      if (isDevelopment()) {
        createDevSession(email, name || undefined);
        router.push("/dashboard");
        return;
      }
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await authApi.guest();
      router.push("/dashboard");
    } catch {
      if (isDevelopment()) {
        createDevSession("guest@axon.local", "Guest");
        router.push("/dashboard");
        return;
      }
      setError("Guest login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = authApi.googleUrl();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: isDark
          ? "linear-gradient(135deg, #2A1E18 0%, #3A2A21 50%, #4A3428 100%)"
          : "var(--ivory)",
      }}
    >
      {/* Animated background glow */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
        aria-hidden
      >
        <motion.div
          style={{
            position: "absolute",
            width: "min(80vmax, 600px)",
            height: "min(80vmax, 600px)",
            borderRadius: "50%",
            background: isDark
              ? "radial-gradient(circle, rgba(74,52,40,0.5) 0%, rgba(42,30,24,0.2) 50%, transparent 70%)"
              : "radial-gradient(circle, rgba(74,52,40,0.12) 0%, rgba(74,52,40,0.04) 50%, transparent 70%)",
            filter: "blur(60px)",
            left: "50%",
            top: "50%",
            x: "-50%",
            y: "-50%",
          }}
          animate={{
            x: ["-50%", "-45%", "-55%", "-50%"],
            y: ["-50%", "-48%", "-52%", "-50%"],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          style={{
            position: "absolute",
            width: "min(60vmax, 400px)",
            height: "min(60vmax, 400px)",
            borderRadius: "50%",
            background: isDark
              ? "radial-gradient(circle, rgba(107,74,58,0.35) 0%, transparent 65%)"
              : "radial-gradient(circle, rgba(74,52,40,0.08) 0%, transparent 65%)",
            filter: "blur(50px)",
            right: "10%",
            bottom: "15%",
          }}
          animate={{
            right: ["10%", "15%", "8%", "10%"],
            bottom: ["15%", "12%", "18%", "15%"],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </motion.div>

      {/* Theme toggle — top right */}
      <motion.button
        type="button"
        onClick={toggle}
        style={{
          position: "absolute",
          top: "20px",
          right: "24px",
          zIndex: 10,
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          border: "1px solid var(--border-soft)",
          background: isDark ? "rgba(255,255,245,0.08)" : "rgba(255,255,255,0.8)",
          color: isDark ? "var(--ivory)" : "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </motion.button>

      {/* Center glass card */}
      <motion.div
        style={{
          width: "100%",
          maxWidth: "420px",
          margin: "auto",
          padding: "40px",
          borderRadius: "20px",
          border: "1px solid var(--border-soft)",
          background: isDark ? "rgba(74,52,40,0.45)" : "rgba(255,255,255,0.75)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: isDark
            ? "0 24px 48px rgba(0,0,0,0.2)"
            : "0 24px 48px rgba(74,52,40,0.08)",
        }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "4px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "var(--cocoa)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: "24px",
                letterSpacing: "-0.02em",
                color: isDark ? "var(--ivory)" : "var(--text-primary)",
              }}
            >
              axon
            </span>
          </div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "10px",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            AI Workspace
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: "28px",
            fontWeight: 400,
            color: isDark ? "var(--ivory)" : "var(--text-primary)",
            marginBottom: "28px",
            textAlign: "center",
          }}
        >
          {mode === "login" ? "Sign in." : "Create account."}
        </h1>

        {/* Google */}
        <motion.button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            borderRadius: "10px",
            border: "1px solid var(--border-soft)",
            background: isDark ? "rgba(255,255,245,0.06)" : "var(--white)",
            color: isDark ? "var(--ivory)" : "var(--text-primary)",
            fontSize: "14px",
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          whileHover={loading ? {} : { y: -1 }}
          whileTap={loading ? {} : { scale: 0.99 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </motion.button>

        <div style={{ textAlign: "center", margin: "16px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
          or
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="login-input"
            />
          )}
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              style={{ paddingRight: "44px" }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
              }}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                color: "var(--red)",
                fontSize: "13px",
                padding: "10px 14px",
                background: "rgba(204,34,0,0.08)",
                border: "1px solid rgba(204,34,0,0.2)",
                borderRadius: "10px",
              }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "15px",
              fontWeight: 600,
              border: "none",
              borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg, #4A3428 0%, #6B4A3A 100%)",
              color: "#fff",
              boxShadow: "0 2px 12px rgba(74,52,40,0.25)",
            }}
            whileHover={loading ? {} : { scale: 1.02, boxShadow: "0 4px 20px rgba(74,52,40,0.35)" }}
            whileTap={loading ? {} : { scale: 0.98 }}
          >
            {loading ? "Loading…" : mode === "login" ? "Sign in" : "Create account"}
          </motion.button>
        </form>

        <div style={{ textAlign: "center", margin: "20px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
          or
        </div>

        <motion.button
          type="button"
          onClick={handleGuest}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            borderRadius: "10px",
            border: "1px solid var(--border-soft)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: loading ? "not-allowed" : "pointer",
          }}
          whileHover={loading ? {} : { y: -1, color: isDark ? "var(--ivory)" : "var(--text-primary)" }}
          whileTap={loading ? {} : { scale: 0.99 }}
        >
          Continue as Guest — no sign-in needed
        </motion.button>

        {/* Toggle login/signup */}
        <div style={{ textAlign: "center", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-soft)" }}>
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--cocoa)",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            {mode === "login" ? "Create new account" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--ivory)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          style={{ fontSize: "14px", color: "var(--text-secondary)" }}
          animate={{ opacity: [0.5, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        >
          Loading…
        </motion.div>
      </div>
    );
  }

  return <LoginContent />;
}
