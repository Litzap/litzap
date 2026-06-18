"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isAddress, parseUnits } from "viem";
import { useApp, TOKENS, DEFAULT_TOKEN } from "@/lib/store";
import { ZERO, isLive } from "@/lib/config";
import { payNative, payErc20, resolveName } from "@/lib/onchain";
import { Icon, type IconName } from "@/components/Icon";
import { Zapster, type Mood } from "@/components/Zapster";

type Kind = "tag" | "email" | "x" | "discord";
const TABS: { kind: Kind; label: string; icon: IconName }[] = [
  { kind: "tag", label: "ZapTag / address", icon: "at" },
  { kind: "email", label: "Email", icon: "mail" },
  { kind: "x", label: "X", icon: "x" },
  { kind: "discord", label: "Discord", icon: "discord" },
];
const EXPLORER = "https://liteforge.hub.caldera.xyz/tx/";

export function SendView() {
  const { addTx } = useApp();
  const [kind, setKind] = useState<Kind>("tag");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenSym, setTokenSym] = useState(DEFAULT_TOKEN);
  const [note, setNote] = useState("");
  const [mood, setMood] = useState<Mood>("idle");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; hash?: string } | null>(null);

  const token = TOKENS.find((t) => t.symbol === tokenSym)!;

  async function submit() {
    setResult(null);
    if (kind !== "tag") {
      setResult({ ok: false, msg: "Sending to email/socials goes on-chain with our social-claim release. For now send to a ZapTag or address." });
      return;
    }
    const amt = parseFloat(amount);
    if (!to.trim()) return setResult({ ok: false, msg: "Who are you paying?" });
    if (!amt || amt <= 0) return setResult({ ok: false, msg: "Enter an amount." });
    if (!isLive) return setResult({ ok: false, msg: "On-chain contracts not configured." });
    if (!token.native && token.address === ZERO) return setResult({ ok: false, msg: `${token.symbol} address not configured.` });

    setMood("idle");
    setBusy(true);
    try {
      const v = to.trim();
      let dest: `0x${string}`;
      if (isAddress(v)) dest = v as `0x${string}`;
      else {
        const name = v.replace(/^@/, "").replace(/\.zap$/, "").toLowerCase();
        dest = await resolveName(name);
        if (!dest || dest === ZERO) throw new Error(`${name}.zap isn't registered yet.`);
      }

      let hash: `0x${string}`;
      if (token.native) {
        hash = await payNative(dest, String(amt), note);
      } else {
        hash = await payErc20(token.address, dest, parseUnits(String(amt), token.decimals), note);
      }

      addTx({ dir: "out", party: v, amount: amt, token: token.symbol, note, hash });
      setMood("zap");
      setResult({ ok: true, msg: `Sent ${amt} ${token.symbol} to ${v}.`, hash });
      setTo("");
      setAmount("");
      setNote("");
    } catch (e: unknown) {
      setMood("broke");
      setResult({ ok: false, msg: (e as { shortMessage?: string })?.shortMessage || (e as Error)?.message || "Transaction failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_300px]">
      <div>
        <h1 className="font-brand text-4xl font-semibold text-text">Send money</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Real on-chain payments on LitVM — to a ZapTag or wallet address.</p>

        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.kind} onClick={() => { setKind(t.kind); setResult(null); }} className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition" style={{ background: kind === t.kind ? "var(--accent-ring)" : "var(--field)", color: kind === t.kind ? "var(--accent)" : "var(--muted)" }}>
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {kind === "tag" ? (
          <>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="name.zap or 0x address" className="field mb-4 px-5 py-3.5 text-sm" />
            <div className="mb-4 flex items-center gap-2 rounded-full pr-2" style={{ background: "var(--field)" }}>
              <div className="flex flex-1 items-center px-5">
                <span className="font-display text-lg font-bold text-muted">{token.symbol === "USDC" ? "$" : ""}</span>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" className="font-display w-full bg-transparent py-3.5 pl-1 text-lg font-bold outline-none" />
              </div>
              <select value={tokenSym} onChange={(e) => setTokenSym(e.target.value)} className="rounded-full px-3 py-2 text-sm font-semibold outline-none" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
                {TOKENS.map((t) => (
                  <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                ))}
              </select>
            </div>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" className="field mb-5 px-5 py-3 text-sm" />
            <button onClick={submit} disabled={busy} className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-base">
              <Icon name="send" size={18} strokeWidth={2} />
              {busy ? "Sending on-chain…" : "Send"}
            </button>
          </>
        ) : (
          <div className="rounded-2xl px-5 py-6 text-sm text-muted" style={{ background: "var(--surface-2)" }}>
            Paying by {TABS.find((t) => t.kind === kind)!.label} (they claim when they join, verified) is coming with our social-claim release. For now, send to a <b>ZapTag</b> or <b>address</b> — it's live on-chain.
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 rounded-2xl px-4 py-3 text-sm" style={{ background: result.ok ? "var(--accent-ring)" : "rgba(239,68,68,0.12)", color: result.ok ? "var(--text)" : "#ef4444" }}>
              <div>{result.msg}</div>
              {result.hash && (
                <a href={`${EXPLORER}${result.hash}`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] text-accent underline">
                  View on explorer
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="hidden items-start justify-center md:flex">
        <Zapster mood={mood} size={220} />
      </div>
    </div>
  );
}
