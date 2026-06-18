"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, TOKENS, DEFAULT_TOKEN } from "@/lib/store";
import { Icon } from "@/components/Icon";

export function RequestView() {
  const { request, session } = useApp();
  const [from, setFrom] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState(DEFAULT_TOKEN);
  const [note, setNote] = useState("");
  const [done, setDone] = useState<string | null>(null);

  function submit() {
    const amt = parseFloat(amount);
    if (!from.trim() || !amt || amt <= 0) return;
    request({ from: from.trim(), amount: amt, token, note });
    setDone(from.trim());
    setAmount("");
    setNote("");
  }

  const link = session ? `litzap.app/u/${session.username}` : "";

  return (
    <div className="max-w-xl">
      <h1 className="font-brand text-4xl font-semibold text-text">Request money</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Ask anyone to pay you — they get a one-tap link.</p>

      <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="@name · x:@handle · email" className="field mb-4 px-5 py-3.5 text-sm" />

      <div className="mb-4 flex items-center gap-2 rounded-full pr-2" style={{ background: "var(--field)" }}>
        <div className="flex flex-1 items-center px-5">
          <span className="font-display text-lg font-bold text-muted">{token === "USDC" ? "$" : ""}</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" className="font-display w-full bg-transparent py-3.5 pl-1 text-lg font-bold outline-none" />
        </div>
        <select value={token} onChange={(e) => setToken(e.target.value)} className="rounded-full px-3 py-2 text-sm font-semibold outline-none" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
          {TOKENS.map((t) => (
            <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
          ))}
        </select>
      </div>

      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's it for?" className="field mb-5 px-5 py-3 text-sm" />

      <button onClick={submit} className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-base">
        <Icon name="arrowDownLeft" size={18} strokeWidth={2} />
        Send request
      </button>

      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col gap-2 rounded-2xl px-4 py-3 text-sm text-text" style={{ background: "var(--accent-ring)" }}>
            <span>Request sent to {done}.</span>
            <button onClick={() => navigator.clipboard?.writeText(link)} className="flex items-center gap-2 rounded-full px-4 py-2 text-[11px] text-muted hover:text-accent" style={{ background: "var(--field)" }}>
              <Icon name="copy" size={13} />
              {link}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
