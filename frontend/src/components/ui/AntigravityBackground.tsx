"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

const COCOA_GLOW = "radial-gradient(circle at center, rgba(74,52,40,0.25), transparent 70%)";
const COCOA_SOFT = "radial-gradient(circle at center, rgba(107,74,58,0.18), transparent 65%)";
const CURSOR_GLOW = "radial-gradient(circle at center, rgba(74,52,40,0.2), transparent 55%)";

const BLOB_CONFIG = [
  { baseX: 15, baseY: 25, size: 380, driftX: [0, 24, 0], driftY: [0, -18, 0], duration: 14 },
  { baseX: 72, baseY: 18, size: 320, driftX: [0, -20, 0], driftY: [0, 16, 0], duration: 16 },
  { baseX: 42, baseY: 62, size: 400, driftX: [0, 18, 0], driftY: [0, 22, 0], duration: 18 },
  { baseX: 88, baseY: 68, size: 300, driftX: [0, -16, 0], driftY: [0, -14, 0], duration: 15 },
];

const CURSOR_INFLUENCE = 0.03;
const SPRING = { type: "spring" as const, stiffness: 60, damping: 28 };

export default function AntigravityBackground() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [center, setCenter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };
    const onResize = () => {
      setCenter({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    };
    onResize();
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const cursorOffset = useMemo(
    () => ({
      x: (mouse.x - center.x) * CURSOR_INFLUENCE,
      y: (mouse.y - center.y) * CURSOR_INFLUENCE,
    }),
    [mouse.x, mouse.y, center.x, center.y]
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden
    >
      {/* 4 gradient blobs: base position + cursor reaction (anti-gravity) + slow drift */}
      {BLOB_CONFIG.map((cfg, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            left: `${cfg.baseX}%`,
            top: `${cfg.baseY}%`,
            width: cfg.size,
            height: cfg.size,
            marginLeft: -cfg.size / 2,
            marginTop: -cfg.size / 2,
            willChange: "transform",
          }}
          animate={{
            x: cursorOffset.x,
            y: cursorOffset.y,
          }}
          transition={SPRING}
        >
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              background: i === 0 ? COCOA_GLOW : COCOA_SOFT,
              filter: "blur(56px)",
            }}
            animate={{
              x: cfg.driftX,
              y: cfg.driftY,
            }}
            transition={{
              duration: cfg.duration,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </motion.div>
      ))}

      {/* Cursor-following soft glow */}
      <motion.div
        style={{
          position: "fixed",
          width: 420,
          height: 420,
          left: mouse.x,
          top: mouse.y,
          marginLeft: -210,
          marginTop: -210,
          background: CURSOR_GLOW,
          filter: "blur(52px)",
          pointerEvents: "none",
          willChange: "left, top",
        }}
        animate={{ left: mouse.x, top: mouse.y }}
        transition={{ type: "spring", stiffness: 150, damping: 30 }}
      />
    </div>
  );
}
