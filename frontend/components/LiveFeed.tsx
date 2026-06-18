"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "./Icon";

type Zap = { id: number; from: string; flag: string; to: string; amount: string; ghost: boolean; chain: string };

const SENDERS = [
  { n: "@amara", f: "🇳🇬" },
  { n: "@kenji", f: "🇯🇵" },
  { n: "@sofia", f: "🇪🇸" },
  { n: "@diego", f: "🇵🇪" },
  { n: "@mei", f: "🇵🇭" },
  { n: "@omar", f: "🇪🇬" },
  { n: "@nova", f: "🇺🇸" },
  { n: "@lina", f: "🇧🇷" },
];
const NAMES = ["@kira", "@litfox", "@zen", "@volt", "@sora", "@echo", "@neo", "@dris"];
const CHAINS = ["LitVM", "Ethereum", "Base", "Arbitrum"];

function rand<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

let counter = 0;
function makeZap(): Zap {
  const ghost = Math.random() < 0.35;
  const s = rand(SENDERS);
  return {
    id: counter++,
    from: s.n,
    flag: s.f,
    to: rand(NAMES),
    amount: ghost ? "•••" : (Math.random() * 200 + 5).toFixed(2),
    ghost,
    chain: rand(CHAINS),
  };
}

export function LiveFeed() {
  const [zaps, setZaps] = useState<Zap[]>([]);

  useEffect(() => {
    setZaps([makeZap(), makeZap(), makeZap(), makeZap()]);
    const t = setInterval(() => setZaps((p) => [makeZap(), ...p].slice(0, 6)), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="card flex h-full flex-col p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className="absolute inline-flex h-full w-full rounded-full animate-pulseRing"
            style={{ background: "var(--positive)" }}
          />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: "var(--positive)" }} />
        </span>
        <span className="font-display text-xs font-bold uppercase tracking-[0.18em] text-muted">
          Live network
        </span>
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {zaps.map((z) => (
            <motion.div
              key={z.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.35 }}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm"
              style={{ background: "var(--surface-2)" }}
            >
              <span className="flex items-center gap-2">
                <span>{z.flag}</span>
                <span className="font-semibold text-accent">{z.from}</span>
                <span className="text-muted">→</span>
                <span className="text-text">{z.to}</span>
                {z.ghost && <Icon name="lock" size={13} className="text-muted" />}
              </span>
              <span className="flex items-center gap-3">
                <span className="font-display font-bold" style={{ color: "var(--positive)" }}>
                  {z.ghost ? "•••" : z.amount}
                </span>
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] text-muted"
                  style={{ background: "var(--field)" }}
                >
                  {z.chain}
                </span>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
