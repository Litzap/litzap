"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "./People";
import { Zapster, type Mood } from "./Zapster";

const PEOPLE = [
  { name: "@amara", city: "Lagos", flag: "🇳🇬", amt: "₿0.4", seed: 2, priv: false },
  { name: "@kenji", city: "Tokyo", flag: "🇯🇵", amt: "$120", seed: 0, priv: true },
  { name: "@sofia", city: "Madrid", flag: "🇪🇸", amt: "€85", seed: 4, priv: false },
  { name: "@diego", city: "Lima", flag: "🇵🇪", amt: "$60", seed: 1, priv: false },
  { name: "@mei", city: "Manila", flag: "🇵🇭", amt: "$200", seed: 3, priv: true },
  { name: "@omar", city: "Cairo", flag: "🇪🇬", amt: "$45", seed: 2, priv: false },
];

const SLOTS = [
  { top: "4%", left: "0%" },
  { top: "2%", right: "0%" },
  { bottom: "30%", left: "-2%" },
];

function PersonCard({ p }: { p: (typeof PEOPLE)[number] }) {
  return (
    <div
      className="card flex items-center gap-2.5 px-3 py-2"
      style={{ borderRadius: 14, minWidth: 168 }}
    >
      <Avatar seed={p.seed} size={36} />
      <div className="leading-tight">
        <div className="flex items-center gap-1.5 text-sm font-bold text-text">
          {p.name} <span>{p.flag}</span>
        </div>
        <div className="text-[11px] text-muted">
          {p.city} · {p.priv ? "sent privately" : `received ${p.amt}`}
        </div>
      </div>
    </div>
  );
}

export function WorldHero({ mood }: { mood: Mood }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => v + 1), 2600);
    return () => clearInterval(t);
  }, []);

  const A = "#5b86ff";

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]">
      {/* globe + money routes */}
      <svg viewBox="0 0 360 360" className="absolute inset-0 h-full w-full" fill="none">
        <defs>
          <radialGradient id="globe" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor={A} stopOpacity="0.20" />
            <stop offset="70%" stopColor={A} stopOpacity="0.05" />
            <stop offset="100%" stopColor={A} stopOpacity="0" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* globe body */}
        <circle cx="180" cy="180" r="112" fill="url(#globe)" stroke="var(--border)" strokeWidth="1" />
        {/* meridians + parallels */}
        <motion.g
          stroke={A}
          strokeOpacity="0.22"
          fill="none"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ellipse cx="180" cy="180" rx="112" ry="44" />
          <ellipse cx="180" cy="180" rx="112" ry="80" />
          <ellipse cx="180" cy="180" rx="44" ry="112" />
          <ellipse cx="180" cy="180" rx="80" ry="112" />
          <line x1="68" y1="180" x2="292" y2="180" />
        </motion.g>

        {/* routes */}
        {[
          "M84 150 Q180 36 296 142",
          "M92 226 Q180 320 286 206",
          "M72 196 Q180 116 300 184",
        ].map((d, idx) => (
          <g key={idx}>
            <path id={`route-${idx}`} d={d} stroke={A} strokeOpacity="0.35" strokeWidth="1.4" strokeDasharray="2 5" />
            <circle r="3.6" fill={A} filter="url(#glow)">
              <animateMotion dur={`${2.4 + idx * 0.5}s`} repeatCount="indefinite" rotate="auto">
                <mpath href={`#route-${idx}`} />
              </animateMotion>
            </circle>
          </g>
        ))}

        {/* city nodes */}
        {[
          [84, 150], [296, 142], [92, 226], [286, 206], [72, 196], [300, 184],
        ].map(([cx, cy], n) => (
          <circle key={n} cx={cx} cy={cy} r="3.2" fill={A} />
        ))}
      </svg>

      {/* floating people */}
      {SLOTS.map((slot, s) => {
        const p = PEOPLE[(i + s) % PEOPLE.length];
        return (
          <div key={s} className="absolute" style={slot as React.CSSProperties}>
            <AnimatePresence mode="wait">
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.4 }}
              >
                <PersonCard p={p} />
              </motion.div>
            </AnimatePresence>
          </div>
        );
      })}

      {/* Zapster, foreground */}
      <div className="absolute bottom-[-6%] left-1/2 -translate-x-1/2">
        <Zapster mood={mood} size={150} />
      </div>
    </div>
  );
}
