"use client";

import { useEffect, useState } from "react";

export function StatCounter({
  to,
  label,
  prefix = "",
  suffix = "",
}: {
  to: number;
  label: string;
  prefix?: string;
  suffix?: string;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const dur = 1300;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.floor(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);

  return (
    <div className="text-center">
      <div className="font-display text-2xl font-extrabold text-text">
        {prefix}
        {n.toLocaleString()}
        {suffix}
      </div>
      <div className="text-[11px] uppercase tracking-[0.15em] text-muted">{label}</div>
    </div>
  );
}
