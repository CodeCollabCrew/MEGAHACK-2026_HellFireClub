"use client";
import { useState } from "react";

interface ChartTooltipProps {
  title: string;
  theory: string;
  children: React.ReactNode;
}

export default function ChartTooltip({ title, theory, children }: ChartTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "12px 14px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            zIndex: 50,
          }}
        >
          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>{title}</p>
          <p style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: 1.55 }}>{theory}</p>
        </div>
      )}
    </div>
  );
}
