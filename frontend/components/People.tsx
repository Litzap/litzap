"use client";

import { useId } from "react";

const SKINS = ["#f2c9a4", "#d79a6a", "#9c6b43", "#7a4a28", "#ffd9b3"];
const HAIR = ["#26221f", "#4a2c12", "#0d0d0d", "#6b3f1d", "#b9b2ab"];

/** Friendly, diverse illustrated avatar — bespoke SVG, no stock photos. */
export function Avatar({ seed = 0, size = 44 }: { seed?: number; size?: number }) {
  const id = useId().replace(/:/g, "");
  const skin = SKINS[seed % SKINS.length];
  const hair = HAIR[(seed + 2) % HAIR.length];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <clipPath id={`clip-${id}`}>
          <circle cx="24" cy="24" r="23" />
        </clipPath>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#clip-${id})`}>
        <rect width="48" height="48" fill={`url(#bg-${id})`} />
        <rect x="12" y="34" width="24" height="18" rx="11" fill={skin} />
        <circle cx="24" cy="21" r="11" fill={skin} />
        <path d="M12 21a12 12 0 0 1 24 0c0-8-5-13-12-13S12 13 12 21z" fill={hair} />
        <circle cx="20" cy="21" r="1.5" fill="#2a2320" />
        <circle cx="28" cy="21" r="1.5" fill="#2a2320" />
        <path d="M20 26q4 3 8 0" stroke="#2a232088" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </g>
      <circle cx="24" cy="24" r="23" fill="none" stroke="var(--border)" />
    </svg>
  );
}
