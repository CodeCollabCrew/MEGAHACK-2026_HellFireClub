"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "40px", background: "#f5f5f5", margin: 0 }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#111", marginBottom: "12px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "14px", color: "#555", marginBottom: "24px" }}>
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#FF4D00",
              color: "#fff",
              border: "none",
              padding: "10px 24px",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
