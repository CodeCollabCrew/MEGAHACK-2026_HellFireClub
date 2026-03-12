"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sun, Moon } from "lucide-react";
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

  // LOGIN / SIGNUP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("All fields required.");
      return;
    }

    setLoading(true);

    // demo delay
    await new Promise((r) => setTimeout(r, 700));

    const userName = name || email.split("@")[0];

    localStorage.setItem(
      "axon_user",
      JSON.stringify({
        email: email,
        name: userName,
      })
    );

    localStorage.setItem("userId", email);

    router.push("/dashboard");
  };

  // GUEST LOGIN
  const handleGuest = () => {
    const guestEmail = "guest@axon.ai";

    localStorage.setItem(
      "axon_user",
      JSON.stringify({
        email: guestEmail,
        name: "Guest",
      })
    );

    localStorage.setItem("userId", guestEmail);

    router.push("/dashboard");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          width: "42%",
          background: "var(--text)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px 48px",
        }}
        className="hidden lg:flex"
      >
        <div>
          <h2
            style={{
              fontSize: "42px",
              color: "var(--bg)",
              fontFamily: "'Instrument Serif', serif",
              marginBottom: "20px",
            }}
          >
            Your inbox, <br />
            finally understood.
          </h2>

          <p
            style={{
              color: "rgba(240,237,232,0.6)",
              fontSize: "14px",
              maxWidth: "280px",
            }}
          >
            Axon reads every email, extracts tasks automatically and builds
            your workflow — so you don't have to.
          </p>
        </div>

        <div style={{ display: "flex", gap: "30px" }}>
          <div>
            <div style={{ fontSize: "28px", color: "var(--punch)" }}>94%</div>
            <div style={{ fontSize: "11px", color: "rgba(240,237,232,0.4)" }}>
              AI accuracy
            </div>
          </div>

          <div>
            <div style={{ fontSize: "28px", color: "var(--punch)" }}>2.4×</div>
            <div style={{ fontSize: "11px", color: "rgba(240,237,232,0.4)" }}>
              faster workflow
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* TOP BAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            padding: "20px 32px",
          }}
        >
          <button
            onClick={toggle}
            style={{
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "New account" : "Sign in"}
          </button>
        </div>

        {/* FORM */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 32px",
          }}
        >
          <div style={{ width: "100%", maxWidth: "360px" }}>
            <h1
              style={{
                fontSize: "36px",
                marginBottom: "20px",
                fontFamily: "'Instrument Serif', serif",
              }}
            >
              {mode === "login" ? "Sign in." : "Create account."}
            </h1>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {mode === "signup" && (
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}

              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <div style={{ color: "red", fontSize: "13px" }}>{error}</div>
              )}

              <button type="submit" disabled={loading}>
                {loading
                  ? "Loading..."
                  : mode === "login"
                  ? "Sign in"
                  : "Create account"}
              </button>
            </form>

            <div style={{ textAlign: "center", margin: "20px 0" }}>or</div>

            <button
              onClick={handleGuest}
              style={{ width: "100%", padding: "10px" }}
            >
              Continue as Guest — no sign-in needed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}