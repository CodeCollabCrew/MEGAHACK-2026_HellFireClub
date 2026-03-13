"use client";

import { useEffect } from "react";

export default function Error({
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
    <div style={{ padding: "40px", textAlign: "center", minHeight: "200px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", marginBottom: "12px" }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: "14px", color: "var(--text-2)", marginBottom: "20px" }}>
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="btn-punch"
        style={{ padding: "10px 20px", fontSize: "14px" }}
      >
        Try again
      </button>
    </div>
  );
}
