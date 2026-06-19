"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const ORBS = [
  { size: 560, top: "-12%", left: "-8%", c: "var(--accent-ring)", x: 70, y: 50, d: 20 },
  { size: 620, top: "18%", right: "-12%", c: "rgba(155,124,255,0.22)", x: -60, y: 60, d: 26 },
  { size: 480, bottom: "-14%", left: "26%", c: "rgba(61,242,255,0.16)", x: 50, y: -40, d: 23 },
  { size: 420, top: "40%", left: "8%", c: "rgba(91,134,255,0.16)", x: 40, y: 30, d: 18 },
  { size: 380, top: "-6%", right: "26%", c: "rgba(255,120,200,0.10)", x: -40, y: 40, d: 30 },
];

// drifting on-brand motifs (bolts + coins), very subtle
const MOTIFS = [
  { kind: "bolt", top: "16%", left: "14%", s: 30, d: 9, delay: 0 },
  { kind: "coin", top: "30%", right: "16%", s: 34, d: 11, delay: 1.2 },
  { kind: "bolt", bottom: "20%", left: "22%", s: 24, d: 10, delay: 0.6 },
  { kind: "coin", bottom: "28%", right: "26%", s: 28, d: 12, delay: 2 },
  { kind: "bolt", top: "52%", right: "9%", s: 22, d: 8, delay: 1.6 },
];

function Motif({ kind, s }: { kind: string; s: number }) {
  const A = "#5b86ff";
  if (kind === "coin") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={A} strokeWidth="1.5" />
        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill={A}>$</text>
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={A}>
      <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l1-8z" />
    </svg>
  );
}

export function MotionBackground() {
  // Hold the background completely still on phones (and for reduced-motion users)
  // so the mobile view doesn't drift around. Desktop keeps the gentle drift.
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const still = reduce || isMobile;

  // Drop a designed 3D scene in by setting NEXT_PUBLIC_SPLINE_URL (publish a scene
  // on spline.design → "Embed" → paste the URL). Falls back to the animated mesh.
  const spline = process.env.NEXT_PUBLIC_SPLINE_URL;
  if (spline) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <iframe src={spline} title="background" className="h-full w-full border-0" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 60%, var(--bg))", opacity: 0.35 }} />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: "var(--bg)" }} />

      {/* faded grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.35,
          maskImage: "radial-gradient(ellipse 85% 65% at 50% 25%, black, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 65% at 50% 25%, black, transparent 80%)",
        }}
      />

      {/* morphing color mesh */}
      {ORBS.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[100px]"
          style={{ width: o.size, height: o.size, top: o.top, left: o.left, right: o.right, bottom: o.bottom, background: `radial-gradient(closest-side, ${o.c}, transparent)` }}
          animate={still ? undefined : { x: [0, o.x, 0], y: [0, o.y, 0], scale: [1, 1.12, 1] }}
          transition={still ? undefined : { duration: o.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* drifting money motifs */}
      {MOTIFS.map((m, i) => (
        <motion.div
          key={`m${i}`}
          className="absolute"
          style={{ top: m.top, left: m.left, right: m.right, bottom: m.bottom, opacity: 0.12 }}
          animate={still ? undefined : { y: [0, -18, 0], rotate: [0, m.kind === "bolt" ? 8 : 12, 0] }}
          transition={still ? undefined : { duration: m.d, repeat: Infinity, ease: "easeInOut", delay: m.delay }}
        >
          <Motif kind={m.kind} s={m.s} />
        </motion.div>
      ))}
    </div>
  );
}
