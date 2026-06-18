"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, TOKENS, DEFAULT_TOKEN } from "@/lib/store";
import { Icon } from "@/components/Icon";
import { money } from "./ui";

export function DropsView() {
  const { createDrop, myDrops } = useApp();
  const [total, setTotal] = useState("");
  const [count, setCount] = useState("");
  const [split, setSplit] = useState<"lucky" | "equal">("lucky");
  const [token, setToken] = useState(DEFAULT_TOKEN);
  const [note, setNote] = useState("");
  const [origin, setOrigin] = useState("https://litzap.me");
  const [created, setCreated] = useState<string | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  function make() {
    setErr("");
    const t = parseFloat(total);
    const c = parseInt(count, 10);
    if (!t || t <= 0 || !c || c <= 0) {
      setErr("Enter an amount and how many people.");
      return;
    }
    const r = createDrop({ total: t, count: c, split, note, token });
    if (r.ok) {
      setCreated(r.code);
      setTotal("");
      setCount("");
      setNote("");
    } else setErr(r.error);
  }

  const link = (code: string) => `${origin}/drop/${code}`;

  return (
    <div className="max-w-xl">
      <h1 className="font-brand text-4xl font-semibold text-text">Zapster Drops</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Drop a pot of money to a group — everyone grabs a share. Post the link anywhere.</p>

      <div className="panel p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-full pr-2" style={{ background: "var(--field)" }}>
            <div className="flex flex-1 items-center px-5">
              <span className="font-display text-lg font-bold text-muted">{token === "USDC" ? "$" : ""}</span>
              <input value={total} onChange={(e) => setTotal(e.target.value)} placeholder="total" inputMode="decimal" className="font-display w-full bg-transparent py-3.5 pl-1 text-lg font-bold outline-none" />
            </div>
            <select value={token} onChange={(e) => setToken(e.target.value)} className="rounded-full px-3 py-2 text-sm font-semibold outline-none" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
              {TOKENS.map((t) => (
                <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center rounded-full px-5" style={{ background: "var(--field)" }}>
            <input value={count} onChange={(e) => setCount(e.target.value)} placeholder="how many people" inputMode="numeric" className="w-full bg-transparent py-3.5 text-sm outline-none" />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {(["lucky", "equal"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSplit(s)}
              className="flex-1 rounded-full px-4 py-2.5 text-xs font-semibold transition"
              style={{ background: split === s ? "var(--accent-ring)" : "var(--field)", color: split === s ? "var(--accent)" : "var(--muted)" }}
            >
              {s === "lucky" ? "Lucky (random shares)" : "Equal split"}
            </button>
          ))}
        </div>

        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Message (e.g. happy friday!)" className="field mt-3 px-5 py-3 text-sm" />

        <button onClick={make} className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-4 text-base">
          <Icon name="bolt" size={18} strokeWidth={2} /> Create drop
        </button>

        {err && <p className="mt-3 text-xs text-red-400">{err}</p>}

        <AnimatePresence>
          {created && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl px-4 py-3 text-sm text-text" style={{ background: "var(--accent-ring)" }}>
              Drop is live. Share this so people can grab their share:
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("I dropped some money on LitZap — grab your share:")}&url=${encodeURIComponent(link(created))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] text-muted hover:text-accent"
                  style={{ background: "var(--field)" }}
                >
                  <Icon name="x" size={13} /> Share on X
                </a>
                <button onClick={() => navigator.clipboard?.writeText(link(created))} className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] text-muted hover:text-accent" style={{ background: "var(--field)" }}>
                  <Icon name="copy" size={13} /> Copy link
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {myDrops.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-muted">Your drops</h2>
          <div className="space-y-2">
            {myDrops.map((d) => (
              <div key={d.code} className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "var(--surface-2)" }}>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-text">{d.note || `Drop ${d.code}`}</div>
                  <div className="text-[11px] text-muted">{d.claims.length}/{d.count} grabbed · {money(d.total, d.token)} total</div>
                </div>
                <button onClick={() => navigator.clipboard?.writeText(link(d.code))} className="ml-2 text-muted hover:text-accent" title="Copy link">
                  <Icon name="copy" size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
